import { getPrisma } from '../../../lib/prisma.js';
import { NextResponse } from 'next/server';
import { sendOrderEmail } from '../../../lib/mailer.js';
import { createShiprocketOrder } from '../../../lib/shiprocket.js';
import crypto from 'crypto';



export async function POST(request) {
  const prisma = getPrisma();
  try {
    const body = await request.json();
    const {
      formData,
      cartItems,
      cartTotal,
      shippingCost,
      paymentMethod,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = body;

    // ── Validate required fields ──────────────────────────────────────────────
    if (!formData?.email || !formData?.firstName || !formData?.phone || !formData?.address) {
      return NextResponse.json(
        { success: false, error: 'Missing required customer details' },
        { status: 400 }
      );
    }

    if (!cartItems?.length) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // ── Verify Razorpay signature ─────────────────────────────────────────────
    if (paymentMethod === 'online') {
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return NextResponse.json(
          { success: false, error: 'Missing Razorpay payment details' },
          { status: 400 }
        );
      }

      const bodyToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(bodyToSign)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        console.error('[Checkout] Signature mismatch — possible tampered request');
        return NextResponse.json(
          { success: false, error: 'Payment verification failed. Please contact support.' },
          { status: 400 }
        );
      }
    }

    // ── DB transaction: stock check → decrement → create order ───────────────
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check stock for all items
      for (const item of cartItems) {
        const product = await tx.product.findUnique({ where: { id: item.id } });
        if (!product) {
          throw new Error(`Product "${item.title}" not found.`);
        }
        if (product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${item.title}". Only ${product.stock} left.`
          );
        }
      }

      // 2. Decrement stock
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 3. Generate unique Order Number (timestamp + random suffix for collision safety)
      const timestamp = Date.now().toString(36).toUpperCase();
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const orderNumber = `BM-${timestamp}${randomSuffix}`;

      // 4. Save order to database
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName: `${formData.firstName} ${formData.lastName || ''}`.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          totalAmount: cartTotal,
          paymentMethod: paymentMethod,
          shippingCost: shippingCost || 0,
          cartItems: cartItems,
        },
      });

      return { orderNumber, newOrder };
    });

    console.log(`[Checkout] Order ${result.orderNumber} saved. Razorpay Payment ID: ${razorpay_payment_id}`);

    // ── Execute background tasks (emails & shiprocket) before returning ──────────
    await Promise.allSettled([
      sendOrderEmail(result.newOrder).then((emailResult) => {
        if (!emailResult.success && !emailResult.skipped) {
          console.error(`[Checkout] Email delivery had issues for order ${result.orderNumber}:`, emailResult);
        }
      }).catch((err) => {
        console.error(`[Checkout] Unexpected email error for order ${result.orderNumber}:`, err.message);
      }),
      createShiprocketOrder(result.newOrder).then(async (srResult) => {
        if (srResult?.order_id) {
          await prisma.order.update({
            where: { id: result.newOrder.id },
            data: {
              shiprocketOrderId: srResult.order_id,
              shiprocketShipmentId: srResult.shipment_id,
            },
          }).catch((err) => console.error('[Checkout] Failed to update Shiprocket IDs:', err.message));
        }
      }).catch((err) => {
        console.error('[Checkout] Failed to create Shiprocket order:', err.message);
      })
    ]);

    // ── Return success immediately — emails/shiprocket run in background ──────
    return NextResponse.json({ success: true, orderNumber: result.orderNumber });

  } catch (error) {
    // Stock errors are user-facing; everything else is a server error
    const isUserError =
      error.message?.includes('Insufficient stock') ||
      error.message?.includes('not found');

    console.error('[Checkout] Error:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: isUserError ? error.message : 'Failed to process your order. Please try again.',
      },
      { status: isUserError ? 409 : 500 }
    );
  }
}


