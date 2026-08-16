import { verifyAdminToken } from '../../../../lib/auth.js';
import { getPrisma } from '../../../../lib/prisma.js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  
  if (!session || !(await verifyAdminToken(session.value))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const prisma = getPrisma();
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit'), 10) || 25));
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
  
  if (!session || !(await verifyAdminToken(session.value))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { orderIds } = await request.json();

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid or empty order IDs" }, { status: 400 });
    }

    const prisma = getPrisma();
    
    // 1. Fetch orders to get cart items and status
    const ordersToDelete = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, status: true, cartItems: true }
    });

    // 2. Aggregate items to restock only for active/paid orders (Pending/Shipped)
    const restockItems = [];
    for (const order of ordersToDelete) {
      if (order.status !== 'Pending' && order.status !== 'Shipped') {
        continue; // Do not restock Payment_Pending or Cancelled orders
      }

      let items = [];
      try {
        items = typeof order.cartItems === 'string' ? JSON.parse(order.cartItems) : (order.cartItems || []);
      } catch (e) {
        items = [];
      }
      
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.id && item.quantity) {
            restockItems.push(item);
          }
        }
      }
    }

    // 3. Perform bulk deletion and restock in a transaction
    await prisma.$transaction(async (tx) => {
      for (const item of restockItems) {
        const qty = parseInt(item.quantity, 10) || 1;
        const prod = await tx.product.findUnique({ where: { id: item.id } });
        if (!prod) continue;

        let newVariants = prod.variants;
        if ((item.size || item.color) && Array.isArray(prod.variants)) {
          const vS = (item.size || '').trim().toLowerCase();
          const vC = (item.color || '').trim().toLowerCase();
          newVariants = prod.variants.map((v) => {
            const matchS = (!v.size && !vS) || (v.size || '').trim().toLowerCase() === vS;
            const matchC = (!v.color && !vC) || (v.color || '').trim().toLowerCase() === vC;
            if (matchS && matchC) {
              const curStock = parseInt(v.stock, 10) || 0;
              return { ...v, stock: curStock + qty };
            }
            return v;
          });
        }

        await tx.product.update({
          where: { id: item.id },
          data: {
            stock: { increment: qty },
            ...(newVariants !== prod.variants ? { variants: newVariants } : {}),
          },
        });
      }

      // Perform bulk deletion
      await tx.order.deleteMany({
        where: { id: { in: orderIds } }
      });
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${ordersToDelete.length} order(s).`,
      count: ordersToDelete.length
    });
  } catch (error) {
    console.error('Error deleting orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete orders' },
      { status: 500 }
    );
  }
}
