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
        { razorpayOrderId: { contains: search, mode: 'insensitive' } },
        { razorpayPaymentId: { contains: search, mode: 'insensitive' } },
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

export async function DELETE(request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { orderIds } = await request.json();

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid or empty order IDs" }, { status: 400 });
    }

    const prisma = getPrisma();
    
    // 1. Fetch orders to get cart items for restocking
    const ordersToDelete = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { cartItems: true }
    });

    // 2. Aggregate quantities to restock
    const restockMap = {};
    for (const order of ordersToDelete) {
      let items = [];
      try {
        items = typeof order.cartItems === 'string' ? JSON.parse(order.cartItems) : order.cartItems;
      } catch (e) {
        items = [];
      }
      
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.id && item.quantity) {
            restockMap[item.id] = (restockMap[item.id] || 0) + parseInt(item.quantity, 10);
          }
        }
      }
    }

    // 3. Perform bulk deletion and restock in a transaction
    await prisma.$transaction(async (tx) => {
      // Restock products (using updateMany so it doesn't fail if product was deleted)
      for (const [productId, quantity] of Object.entries(restockMap)) {
        await tx.product.updateMany({
          where: { id: productId },
          data: { stock: { increment: quantity } }
        });
      }

      // Perform bulk deletion
      await tx.order.deleteMany({
        where: { id: { in: orderIds } }
      });
    });

    return NextResponse.json({ success: true, message: `Successfully deleted ${ordersToDelete.length} orders and restocked items.`, count: ordersToDelete.length });
  } catch (error) {
    console.error('Error deleting orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete orders' },
      { status: 500 }
    );
  }
}
