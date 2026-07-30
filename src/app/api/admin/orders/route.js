import { getPrisma } from '../../../../lib/prisma.js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const prisma = getPrisma();
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';

    // Build dynamic where clause
    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    // Get total count for pagination metadata
    const totalOrders = await prisma.order.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalOrders / limit));

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
