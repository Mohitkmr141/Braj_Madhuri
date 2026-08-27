import { NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma.js';
import { verifyAdminToken } from '../../../../lib/auth.js';
import { cookies } from 'next/headers';
import Razorpay from 'razorpay';

// Helper to restock items with synchronized variant matching
async function adjustStockForItems(tx, items, multiplier = 1) {
  for (const item of items) {
    if (!item || !item.id) continue;
    const qty = Math.abs(parseInt(item.quantity, 10) || 1);
    const isRestock = multiplier > 0;

    const prod = await tx.product.findUnique({ where: { id: item.id } });
    if (!prod) continue;

    let updatedVariants = Array.isArray(prod.variants) ? [...prod.variants] : [];
    if ((item.size || item.color) && updatedVariants.length > 0) {
      const iS = (item.size || '').trim().toLowerCase();
      const iC = (item.color || '').trim().toLowerCase();

      let targetIndex = updatedVariants.findIndex((v) => {
        const vS = (v.size || '').trim().toLowerCase();
        const vC = (v.color || '').trim().toLowerCase();
        return (vS === iS) && (vC === iC);
      });

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
        const curStock = parseInt(updatedVariants[targetIndex].stock, 10) || 0;
        const newStock = isRestock ? curStock + qty : Math.max(0, curStock - qty);
        updatedVariants[targetIndex] = { ...updatedVariants[targetIndex], stock: newStock };
      }

      await tx.product.update({
        where: { id: item.id },
        data: {
          stock: isRestock ? { increment: qty } : { decrement: qty },
          ...(variantMatched ? { variants: updatedVariants } : {}),
        },
      });
    } else {
      await tx.product.update({
        where: { id: item.id },
        data: {
          stock: isRestock ? { increment: qty } : { decrement: qty },
        },
      });
    }
  }
}

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

    let items = [];
    try {
      items = typeof order.cartItems === 'string' ? JSON.parse(order.cartItems) : (order.cartItems || []);
    } catch {
      items = [];
    }
    if (!Array.isArray(items)) items = [];

    const activeStatuses = ['Pending', 'Shipped', 'Delivered'];
    const shouldRestock = activeStatuses.includes(order.status);

    // Restock inventory and mark order as Cancelled in a transaction
    await prisma.$transaction(async (tx) => {
      if (shouldRestock) {
        await adjustStockForItems(tx, items, +1);
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: 'Cancelled' },
      });
    });

    console.log(`[Refund] Refund ${refund.id} issued for order ${order.orderNumber} (${order.razorpayPaymentId}). Restocked: ${shouldRestock}`);

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
