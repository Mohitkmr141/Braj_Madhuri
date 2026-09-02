import { getPrisma } from './prisma.js';
import { sendOrderEmail } from './mailer.js';
import { createShiprocketOrder } from './shiprocket.js';
import Razorpay from 'razorpay';
import { randomBytes } from 'crypto';

/**
 * Safely decrements stock for cart items within a Prisma transaction or client.
 * Uses PostgreSQL row-locking FOR UPDATE on variant products to prevent lost updates under concurrency.
 */
async function decrementStockForItems(tx, cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) return;

  for (const item of cartItems) {
    if (!item.id) continue;
    try {
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

      // If variant-specific, lock the product row first to prevent concurrent JSON overwrites
      if (item.size || item.color) {
        try {
          await tx.$queryRaw`SELECT id FROM "Product" WHERE id = ${item.id} FOR UPDATE`;
        } catch {
          // In case underlying DB doesn't support SELECT FOR UPDATE (e.g. test mock), proceed safely
        }
      }

      const product = await tx.product.findUnique({ where: { id: item.id } });
      if (!product) {
        console.warn(`[OrderService] Product ${item.id} not found during stock decrement; skipping.`);
        continue;
      }

      let updatedVariants = Array.isArray(product.variants) ? [...product.variants] : [];

      if ((item.size || item.color) && updatedVariants.length > 0) {
        const iS = (item.size || '').trim().toLowerCase();
        const iC = (item.color || '').trim().toLowerCase();

        // Find index of exact match first
        let targetIndex = updatedVariants.findIndex((v) => {
          const vS = (v.size || '').trim().toLowerCase();
          const vC = (v.color || '').trim().toLowerCase();
          return (vS === iS) && (vC === iC);
        });

        // Fallback: match on size or color if the other attribute is empty
        if (targetIndex === -1) {
          targetIndex = updatedVariants.findIndex((v) => {
            const vS = (v.size || '').trim().toLowerCase();
            const vC = (v.color || '').trim().toLowerCase();
            const matchS = iS ? vS === iS : (!vS || vS === '');
            const matchC = iC ? vC === iC : (!vC || vC === '');
            return matchS && matchC;
          });
        }

        let variantMatched = false;
        if (targetIndex !== -1) {
          variantMatched = true;
          const currentStock = parseInt(updatedVariants[targetIndex].stock, 10) || 0;
          const newStock = Math.max(0, currentStock - qty);
          updatedVariants[targetIndex] = { ...updatedVariants[targetIndex], stock: newStock };
        }

        await tx.product.update({
          where: { id: item.id },
          data: {
            stock: { decrement: qty },
            salesCount: { increment: qty },
            ...(variantMatched ? { variants: updatedVariants } : {}),
          },
        });
      } else {
        await tx.product.update({
          where: { id: item.id },
          data: {
            stock: { decrement: qty },
            salesCount: { increment: qty },
          },
        });
      }
    } catch (err) {
      console.error(`[OrderService] Error decrementing stock for item ${item.id}:`, err.message);
      // Do not rethrow: a stock update glitch should never prevent a paid order from being recorded
    }
  }
}

/**
 * Finalizes an order after payment has been verified (via Webhook or Checkout callback).
 * Guaranteed to be idempotent: if the order is already processed, it will not double-decrement stock or resend emails.
 *
 * @param {Object} params
 * @param {string} params.razorpayOrderId - The Razorpay Order ID (e.g. order_OP8q7x...)
 * @param {string} params.razorpayPaymentId - The Razorpay Payment ID (e.g. pay_OP8z1a...)
 * @param {string} [params.orderNumber] - Internal order number (e.g. BM-XYZ)
 * @param {Object} [params.fallbackData] - Customer details & cart items if order needs to be created on the fly
 * @returns {Promise<{ success: boolean, order: Object, isNewOrUpdated: boolean }>}
 */
export async function finalizePaidOrder({
  razorpayOrderId,
  razorpayPaymentId,
  orderNumber,
  fallbackData = null,
}) {
  const prisma = getPrisma();

  // 1. Look for existing order by razorpayOrderId or orderNumber
  let existingOrder = null;
  if (razorpayOrderId) {
    existingOrder = await prisma.order.findUnique({
      where: { razorpayOrderId },
    });
  }

  if (!existingOrder && orderNumber) {
    existingOrder = await prisma.order.findUnique({
      where: { orderNumber },
    });
  }

  // 2. If order exists and is already marked active/paid (not 'Payment_Pending'), return immediately
  if (existingOrder && existingOrder.status !== 'Payment_Pending') {
    console.log(`[OrderService] Order ${existingOrder.orderNumber} already finalized with status: ${existingOrder.status}`);
    return { success: true, order: existingOrder, isNewOrUpdated: false };
  }

  let finalizedOrder = null;
  let isNewOrUpdated = false;

  if (existingOrder) {
    // 3A. Transition existing 'Payment_Pending' order to 'Pending'
    finalizedOrder = await prisma.$transaction(async (tx) => {
      // Re-fetch inside transaction to avoid race conditions
      const current = await tx.order.findUnique({ where: { id: existingOrder.id } });
      if (current.status !== 'Payment_Pending') {
        return current;
      }

      isNewOrUpdated = true;

      let items = [];
      try {
        items = typeof current.cartItems === 'string' ? JSON.parse(current.cartItems) : (current.cartItems || []);
      } catch (e) {
        items = [];
      }

      // Decrement stock
      await decrementStockForItems(tx, items);

      // Update order status to Pending (Paid & ready for shipping)
      const updated = await tx.order.update({
        where: { id: current.id },
        data: {
          status: 'Pending',
          razorpayPaymentId: razorpayPaymentId || current.razorpayPaymentId,
          razorpayOrderId: razorpayOrderId || current.razorpayOrderId,
        },
      });

      return updated;
    });
  } else if (fallbackData) {
    // 3B. If no pre-existing order was found, verify amount directly with Razorpay API before creation
    let verifiedTotalAmount = fallbackData.totalAmount || fallbackData.cartTotal || 0;

    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && (razorpayPaymentId || razorpayOrderId)) {
      try {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        if (razorpayPaymentId) {
          const payment = await razorpay.payments.fetch(razorpayPaymentId);
          if (payment && payment.amount) {
            verifiedTotalAmount = payment.amount / 100;
          }
        } else if (razorpayOrderId) {
          const rzpOrder = await razorpay.orders.fetch(razorpayOrderId);
          if (rzpOrder && rzpOrder.amount) {
            verifiedTotalAmount = rzpOrder.amount / 100;
          }
        }
      } catch (rzpFetchErr) {
        console.warn('[OrderService] Unable to fetch Razorpay details during fallback creation:', rzpFetchErr.message);
      }
    }

    const genOrderNumber = orderNumber || `BM-${Date.now().toString(36).toUpperCase()}${randomBytes(3).toString('hex').toUpperCase()}`;
    const cartItems = fallbackData.cartItems || [];

    if (cartItems.length === 0) {
      console.error(`[OrderService] ⚠️ ALERT: Fallback order creation for Razorpay Order ${razorpayOrderId} has EMPTY cartItems — stock will NOT be decremented. This indicates the pre-created order was not found in DB.`);
    }

    try {
      finalizedOrder = await prisma.$transaction(async (tx) => {
        // Decrement stock
        await decrementStockForItems(tx, cartItems);

        const created = await tx.order.create({
          data: {
            orderNumber: genOrderNumber,
            customerName: fallbackData.customerName || `${fallbackData.formData?.firstName || 'Guest'} ${fallbackData.formData?.lastName || ''}`.trim(),
            email: (fallbackData.email || fallbackData.formData?.email || '').trim().toLowerCase(),
            phone: fallbackData.phone || fallbackData.formData?.phone || '',
            address: fallbackData.address || fallbackData.formData?.address || '',
            city: fallbackData.city || fallbackData.formData?.city || '',
            state: fallbackData.state || fallbackData.formData?.state || '',
            pincode: fallbackData.pincode || fallbackData.formData?.pincode || '',
            totalAmount: verifiedTotalAmount,
            paymentMethod: 'online',
            status: 'Pending',
            cartItems: cartItems,
            shippingCost: fallbackData.shippingCost || 0,
            razorpayOrderId: razorpayOrderId || null,
            razorpayPaymentId: razorpayPaymentId || null,
          },
        });

        return created;
      });
      isNewOrUpdated = true;
    } catch (createErr) {
      // Gracefully resolve Prisma unique constraint violation (P2002) in concurrent races
      if (createErr.code === 'P2002' && razorpayOrderId) {
        console.log(`[OrderService] Race condition handled for Razorpay Order ${razorpayOrderId}`);
        const winningOrder = await prisma.order.findUnique({ where: { razorpayOrderId } });
        if (winningOrder) {
          return { success: true, order: winningOrder, isNewOrUpdated: false };
        }
      }
      throw createErr;
    }
  } else {
    throw new Error(`Cannot finalize order: No order found for Razorpay Order ID ${razorpayOrderId} and no fallback data provided.`);
  }

  console.log(`[OrderService] Order ${finalizedOrder.orderNumber} successfully finalized with status: ${finalizedOrder.status}`);

  // 4. Background tasks: Trigger Email & Shiprocket if updated in this call (Non-blocking)
  if (isNewOrUpdated && finalizedOrder.status === 'Pending') {
    // Run fulfillment asynchronously in the background so the customer gets instant checkout response (<200ms)
    (async () => {
      try {
        await Promise.allSettled([
          sendOrderEmail(finalizedOrder).then((emailResult) => {
            if (!emailResult.success && !emailResult.skipped) {
              console.error(`[OrderService] Email delivery issue for order ${finalizedOrder.orderNumber}:`, emailResult);
            }
          }).catch((err) => {
            console.error(`[OrderService] Email error for order ${finalizedOrder.orderNumber}:`, err.message);
          }),

          createShiprocketOrder(finalizedOrder).then(async (srResult) => {
            if (srResult?.order_id) {
              await prisma.order.update({
                where: { id: finalizedOrder.id },
                data: {
                  shiprocketOrderId: srResult.order_id,
                  shiprocketShipmentId: srResult.shipment_id,
                },
              }).catch((err) => console.error('[OrderService] Failed to update Shiprocket IDs:', err.message));
              console.log(`[OrderService] ✅ Shiprocket order created for ${finalizedOrder.orderNumber}: ID ${srResult.order_id}`);
            }
          }).catch((err) => {
            console.error(`[OrderService] Shiprocket order creation error for ${finalizedOrder.orderNumber}:`, err.message);
          }),
        ]);
      } catch (bgErr) {
        console.error(`[OrderService] Background fulfillment error for order ${finalizedOrder.orderNumber}:`, bgErr);
      }
    })();
  }

  return { success: true, order: finalizedOrder, isNewOrUpdated };
}
