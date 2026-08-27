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

    const result = await prisma.order.updateMany({
      where: {
        status: 'Payment_Pending',
        createdAt: { lt: cutoff },
      },
      data: {
        status: 'Payment_Failed',
      },
    });

    console.log(`[Cleanup] Marked ${result.count} stale Payment_Pending order(s) as Payment_Failed.`);

    return NextResponse.json({
      success: true,
      cleaned: result.count,
      total: staleOrders.length,
      message: `Cleaned ${result.count} of ${staleOrders.length} stale Payment_Pending orders.`,
    });
  } catch (error) {
    console.error('[Cleanup] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
