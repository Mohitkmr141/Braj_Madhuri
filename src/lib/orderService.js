import { getPrisma } from './prisma.js';
import { sendOrderEmail } from './mailer.js';
import { createShiprocketOrder } from './shiprocket.js';

/**
 * Safely decrements stock for cart items within a Prisma transaction or client.
 */
async function decrementStockForItems(tx, cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) return;

  for (const item of cartItems) {
    if (!item.id) continue;
    try {
      const product = await tx.product.findUnique({ where: { id: item.id } });
      if (!product) {
        console.warn(`[OrderService] Product ${item.id} not found during stock decrement; skipping.`);
        continue;
      }

      const qty = parseInt(item.quantity, 10) || 1;
      let updatedVariants = Array.isArray(product.variants) ? [...product.variants] : [];

      if ((item.size || item.color) && updatedVariants.length > 0) {
        let variantMatched = false;
        updatedVariants = updatedVariants.map((v) => {
          if (variantMatched) return v;
          const vS = (v.size || '').trim().toLowerCase();
          const vC = (v.color || '').trim().toLowerCase();
          const iS = (item.size || '').trim().toLowerCase();
          const iC = (item.color || '').trim().toLowerCase();
          if ((!vS || vS === iS) && (!vC || vC === iC)) {
            variantMatched = true;
            const currentStock = parseInt(v.stock, 10) || 0;
            const newStock = Math.max(0, currentStock - qty);
            return { ...v, stock: newStock };
          }
          return v;
        });

        await tx.product.update({
          where: { id: item.id },
          data: {
            stock: { decrement: qty },
            ...(variantMatched ? { variants: updatedVariants } : {}),
          },
        });
      } else {
        await tx.product.update({
          where: { id: item.id },
          data: { stock: { decrement: qty } },
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
    // 3B. If no pre-existing order was found, create it from fallbackData so no paid order is lost
    const genOrderNumber = orderNumber || `BM-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const cartItems = fallbackData.cartItems || [];

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
          totalAmount: fallbackData.totalAmount || fallbackData.cartTotal || 0,
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
  } else {
    throw new Error(`Cannot finalize order: No order found for Razorpay Order ID ${razorpayOrderId} and no fallback data provided.`);
  }

  console.log(`[OrderService] Order ${finalizedOrder.orderNumber} successfully finalized with status: ${finalizedOrder.status}`);

  // 4. Background tasks: Trigger Email & Shiprocket if updated in this call
  if (isNewOrUpdated && finalizedOrder.status === 'Pending') {
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
        }
      }).catch((err) => {
        console.error('[OrderService] Shiprocket order creation error:', err.message);
      }),
    ]);
  }

  return { success: true, order: finalizedOrder, isNewOrUpdated };
}
