import { NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma.js';
import { verifyAdminToken } from '../../../../lib/auth.js';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');

  if (!session || !(await verifyAdminToken(session.value))) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const prisma = getPrisma();

  try {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

    const staleOrders = await prisma.order.findMany({
      where: {
        status: 'Payment_Pending',
        createdAt: { lt: cutoff },
      },
    });

    if (staleOrders.length === 0) {
      return NextResponse.json({ success: true, cleaned: 0, message: 'No stale orders found.' });
    }

    let cleaned = 0;

    for (const order of staleOrders) {
      try {
        let items = [];
        try {
          items = typeof order.cartItems === 'string' ? JSON.parse(order.cartItems) : (order.cartItems || []);
        } catch { items = []; }

        await prisma.$transaction(async (tx) => {
          // Restore stock for each item
          for (const item of items) {
            if (!item?.id) continue;
            const qty = Math.abs(parseInt(item.quantity, 10) || 1);
            const prod = await tx.product.findUnique({ where: { id: item.id } });
            if (!prod) continue;

            let updatedVariants = Array.isArray(prod.variants) ? [...prod.variants] : [];
            if ((item.size || item.color) && updatedVariants.length > 0) {
              const iS = (item.size || '').trim().toLowerCase();
              const iC = (item.color || '').trim().toLowerCase();
              const idx = updatedVariants.findIndex(v =>
                (v.size || '').trim().toLowerCase() === iS &&
                (v.color || '').trim().toLowerCase() === iC
              );
              if (idx !== -1) {
                const cur = parseInt(updatedVariants[idx].stock, 10) || 0;
                updatedVariants[idx] = { ...updatedVariants[idx], stock: cur + qty };
                await tx.product.update({
                  where: { id: item.id },
                  data: { stock: { increment: qty }, variants: updatedVariants },
                });
              } else {
                await tx.product.update({ where: { id: item.id }, data: { stock: { increment: qty } } });
              }
            } else {
              await tx.product.update({ where: { id: item.id }, data: { stock: { increment: qty } } });
            }
          }

          await tx.order.update({
            where: { id: order.id },
            data: { status: 'Payment_Failed' },
          });
        });

        cleaned++;
        console.log(`[Cleanup] Stale order ${order.orderNumber} marked Payment_Failed, stock restored.`);
      } catch (err) {
        console.error(`[Cleanup] Failed for ${order.orderNumber}:`, err.message);
      }
    }

    return NextResponse.json({
      success: true,
      cleaned,
      total: staleOrders.length,
      message: `Cleaned ${cleaned} of ${staleOrders.length} stale Payment_Pending orders.`,
    });
  } catch (error) {
    console.error('[Cleanup] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
