import { NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma.js';
import { verifyAdminToken } from '../../../../lib/auth.js';
import { cookies } from 'next/headers';
import Razorpay from 'razorpay';

export async function POST(request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');

  if (!session || !(await verifyAdminToken(session.value))) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const prisma = getPrisma();

  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (!order.razorpayPaymentId) {
      return NextResponse.json(
        { success: false, error: 'No Razorpay payment ID on this order. Cannot issue refund automatically.' },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ success: false, error: 'Razorpay credentials not configured.' }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amountInPaise = Math.round(Number(order.totalAmount) * 100);

    const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
      amount: amountInPaise,
      notes: {
        reason: 'Order cancelled by admin',
        orderNumber: order.orderNumber,
      },
    });

    // Mark order as Cancelled after successful refund
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'Cancelled' },
    });

    console.log(`[Refund] Refund ${refund.id} issued for order ${order.orderNumber} (${order.razorpayPaymentId})`);

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amount: order.totalAmount,
      orderNumber: order.orderNumber,
      message: `Refund of ₹${order.totalAmount} initiated successfully. Refund ID: ${refund.id}`,
    });
  } catch (error) {
    console.error('[Refund] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Refund failed' }, { status: 500 });
  }
}
