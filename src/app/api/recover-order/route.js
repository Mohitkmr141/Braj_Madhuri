import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { finalizePaidOrder } from '../../../lib/orderService.js';
import { getPrisma } from '../../../lib/prisma.js';
import { generateOrderAccessToken } from '../../../lib/auth.js';

/**
 * POST /api/recover-order
 * 
 * Customer self-service recovery endpoint.
 * Called when a customer paid but didn't receive an order confirmation
 * (e.g. browser closed before the success callback fired).
 * 
 * Body: { razorpayPaymentId: "pay_XXXXXX" }
 * 
 * This verifies the payment status directly with Razorpay API,
 * then finalizes the order (idempotent — safe to call multiple times).
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const razorpayPaymentId = (body.razorpayPaymentId || '').trim();

    if (!razorpayPaymentId || !razorpayPaymentId.startsWith('pay_')) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid Razorpay Payment ID (starts with pay_).' },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('[RecoverOrder] Razorpay API keys not configured.');
      return NextResponse.json(
        { success: false, error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // 1. Verify payment status directly with Razorpay API
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    let payment;
    try {
      payment = await razorpay.payments.fetch(razorpayPaymentId);
    } catch (rzpErr) {
      console.error('[RecoverOrder] Could not fetch payment from Razorpay:', rzpErr.message);
      return NextResponse.json(
        { success: false, error: 'Payment ID not found. Please check and try again.' },
        { status: 404 }
      );
    }

    // 2. Only proceed if payment is captured (i.e., money actually received)
    if (payment.status !== 'captured') {
      console.warn(`[RecoverOrder] Payment ${razorpayPaymentId} has status "${payment.status}", not captured.`);
      return NextResponse.json(
        {
          success: false,
          error: `Payment status is "${payment.status}". Only captured (successful) payments can be recovered. Please contact support if you believe this is wrong.`,
        },
        { status: 400 }
      );
    }

    const razorpayOrderId = payment.order_id;
    const amountPaid = payment.amount / 100; // Convert paise to INR

    // 3. Check if order already exists and is confirmed — return it directly
    if (razorpayOrderId) {
      const prisma = getPrisma();
      const existingOrder = await prisma.order.findUnique({ where: { razorpayOrderId } });
      if (existingOrder && existingOrder.status !== 'Payment_Pending') {
        console.log(`[RecoverOrder] Order already finalized: ${existingOrder.orderNumber} (${existingOrder.status})`);
        return NextResponse.json({
          success: true,
          orderNumber: existingOrder.orderNumber,
          orderToken: generateOrderAccessToken(existingOrder.orderNumber),
          alreadyConfirmed: true,
          message: 'Your order was already confirmed. Please check your email for the confirmation.',
        });
      }
    }

    // 4. Build fallback data from Razorpay payment notes (set during order creation)
    const notes = payment.notes || {};
    const fallbackData = notes.orderNumber ? {
      customerName: notes.customerName || 'Customer',
      email: notes.email || '',
      phone: notes.phone || '',
      address: notes.address || '',
      city: notes.city || '',
      state: notes.state || '',
      pincode: notes.pincode || '',
      totalAmount: amountPaid,
      cartItems: [],
    } : null;

    // 5. Finalize the order (idempotent — safe to call multiple times)
    const result = await finalizePaidOrder({
      razorpayOrderId: razorpayOrderId || null,
      razorpayPaymentId: razorpayPaymentId,
      orderNumber: notes.orderNumber || null,
      fallbackData,
    });

    console.log(`[RecoverOrder] ✅ Order recovered: ${result.order.orderNumber} for Payment ID ${razorpayPaymentId}`);

    return NextResponse.json({
      success: true,
      orderNumber: result.order.orderNumber,
      orderToken: generateOrderAccessToken(result.order.orderNumber),
      alreadyConfirmed: !result.isNewOrUpdated,
      message: result.isNewOrUpdated
        ? 'Your order has been recovered and confirmed! A confirmation email will be sent shortly.'
        : 'Your order was already confirmed. Please check your email.',
    });

  } catch (error) {
    console.error('[RecoverOrder] Unexpected error:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred during recovery. Please contact support with your Payment ID.',
      },
      { status: 500 }
    );
  }
}
