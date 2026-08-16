import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { finalizePaidOrder } from '../../../../lib/orderService.js';
import { getPrisma } from '../../../../lib/prisma.js';

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      console.warn('[Razorpay Webhook] Missing x-razorpay-signature header.');
      return NextResponse.json({ success: false, error: 'Missing signature' }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (!webhookSecret) {
      console.error('[Razorpay Webhook] No webhook secret or key secret configured.');
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const receivedBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
      console.error('[Razorpay Webhook] Invalid webhook signature mismatch.');
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseErr) {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    const event = payload.event;
    console.log(`[Razorpay Webhook] Received verified event: "${event}"`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderEntity = payload.payload?.order?.entity;

      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const razorpayPaymentId = paymentEntity?.id || null;
      const notes = paymentEntity?.notes || orderEntity?.notes || {};
      const orderNumber = notes.orderNumber || null;

      if (!razorpayOrderId) {
        console.warn('[Razorpay Webhook] Event missing razorpay order_id, cannot map to order.');
        return NextResponse.json({ status: 'ok', warning: 'Missing order_id' });
      }

      console.log(`[Razorpay Webhook] Processing captured payment for Order ${razorpayOrderId} / ${orderNumber}`);

      const fallbackData = notes.email ? {
        customerName: notes.customerName || 'Customer',
        email: notes.email,
        phone: notes.phone || '',
        address: notes.address || '',
        city: notes.city || '',
        state: notes.state || '',
        pincode: notes.pincode || '',
        totalAmount: (paymentEntity?.amount || orderEntity?.amount || 0) / 100,
        cartItems: [],
      } : null;

      await finalizePaidOrder({
        razorpayOrderId,
        razorpayPaymentId,
        orderNumber,
        fallbackData,
      });

      return NextResponse.json({ status: 'ok', processed: true });
    }

    if (event === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      if (razorpayOrderId) {
        const prisma = getPrisma();
        await prisma.order.updateMany({
          where: {
            razorpayOrderId: razorpayOrderId,
            status: 'Payment_Pending',
          },
          data: {
            status: 'Payment_Failed',
          },
        }).catch((err) => console.error('[Razorpay Webhook] Error marking order as Payment_Failed:', err.message));
        console.log(`[Razorpay Webhook] Marked order with Razorpay ID ${razorpayOrderId} as Payment_Failed`);
      }
      return NextResponse.json({ status: 'ok', handled: 'payment.failed' });
    }

    // Return 200 for other unhandled events so Razorpay doesn't retry them indefinitely
    return NextResponse.json({ status: 'ok', ignored: true });
  } catch (error) {
    console.error('[Razorpay Webhook] Internal error handling webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
