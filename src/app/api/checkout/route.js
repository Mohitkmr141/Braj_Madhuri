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
    } = body;
    const razorpay_payment_id = (body.razorpay_payment_id || '').trim();
    const razorpay_order_id = (body.razorpay_order_id || '').trim();
    const razorpay_signature = (body.razorpay_signature || '').trim();
    const orderNumber = (body.orderNumber || '').trim();

    // ── Validate required fields ──────────────────────────────────────────────
    if (!formData?.email || !formData?.firstName || !formData?.phone || !formData?.address) {
      return NextResponse.json(
        { success: false, error: 'Missing required customer details' },
        { status: 400 }
      );
    }

    // ── Enforce supported payment method ─────────────────────────────────────
    if (paymentMethod !== 'online') {
      return NextResponse.json(
        { success: false, error: 'Invalid payment method. Only online payments are accepted.' },
        { status: 400 }
      );
    }

    // ── Verify Razorpay payment details format ────────────────────────────────
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing Razorpay payment details' },
        { status: 400 }
      );
    }

    if (!razorpay_order_id.startsWith('order_') || !razorpay_payment_id.startsWith('pay_')) {
      return NextResponse.json(
        { success: false, error: 'Invalid Razorpay transaction identifiers' },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('[Checkout] RAZORPAY_KEY_SECRET is not configured on the server.');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const bodyToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(bodyToSign)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const receivedBuf = Buffer.from(razorpay_signature, 'utf8');

    if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
      console.error('[Checkout] Signature mismatch — possible tampered request');
      return NextResponse.json(
        { success: false, error: 'Payment verification failed. Please contact support.' },
        { status: 400 }
      );
    }

    // ── Finalize paid order idempotently ──────────────────────────────────────
    // NOTE: We deliberately omit cartItems from fallbackData here.
    // The pre-created order (written from server-verified data in /api/razorpay/create-order)
    // should almost always be found. In the rare edge-case it is not, the fallback order
    // is created with only formData and the Razorpay-verified amount — never from
    // raw client-supplied cartItems which could contain tampered prices.
    const result = await finalizePaidOrder({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      orderNumber: orderNumber,
      fallbackData: {
        formData,
        cartItems: [],   // intentionally empty — amount verified from Razorpay API in orderService
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
