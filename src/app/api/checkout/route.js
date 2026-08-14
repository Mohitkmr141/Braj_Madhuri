import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { finalizePaidOrder } from '../../../lib/orderService.js';

export async function POST(request) {
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
      orderNumber,
    } = body;

    // ── Validate required fields ──────────────────────────────────────────────
    if (!formData?.email || !formData?.firstName || !formData?.phone || !formData?.address) {
      return NextResponse.json(
        { success: false, error: 'Missing required customer details' },
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

    // ── Finalize paid order idempotently ──────────────────────────────────────
    const result = await finalizePaidOrder({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      orderNumber: orderNumber,
      fallbackData: {
        formData,
        cartItems: cartItems || [],
        cartTotal: cartTotal || 0,
        shippingCost: shippingCost || 0,
      },
    });

    console.log(`[Checkout] Order ${result.order.orderNumber} confirmed. Payment ID: ${razorpay_payment_id}`);

    return NextResponse.json({
      success: true,
      orderNumber: result.order.orderNumber,
    });

  } catch (error) {
    console.error('[Checkout] Error finalizing order:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process your order. Please contact support with your Payment ID.',
      },
      { status: 500 }
    );
  }
}
