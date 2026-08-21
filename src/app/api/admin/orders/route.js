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

// Helper to restock or decrement items with synchronized variant matching.
// multiplier: +1 to restock (cancellation/deletion), -1 to decrement (un-cancel / re-activation).
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
        // Clamp variant stock to 0 minimum when decrementing
        const newStock = isRestock ? curStock + qty : Math.max(0, curStock - qty);
        updatedVariants[targetIndex] = { ...updatedVariants[targetIndex], stock: newStock };
      }

      await tx.product.update({
        where: { id: item.id },
        data: {
          // Use explicit increment/decrement — avoids Prisma treating {increment: -n} ambiguously
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


export async function PATCH(request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  
  if (!session || !(await verifyAdminToken(session.value))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const prisma = getPrisma();
  try {
    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({ success: false, error: "Missing orderId or status" }, { status: 400 });
    }

    const ALLOWED_STATUSES = ['Pending', 'Shipped', 'Delivered', 'Cancelled', 'Payment_Pending', 'Payment_Failed'];
    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const prevStatus = order.status;
    if (prevStatus === status) {
      return NextResponse.json({ success: true, order });
    }

    let items = [];
    try {
      items = typeof order.cartItems === 'string' ? JSON.parse(order.cartItems) : (order.cartItems || []);
    } catch {
      items = [];
    }
    if (!Array.isArray(items)) items = [];

    const activeStatuses = ['Pending', 'Shipped', 'Delivered'];
    const isDeactivating = activeStatuses.includes(prevStatus) && (status === 'Cancelled' || status === 'Payment_Failed');
    const isActivating = (prevStatus === 'Cancelled' || prevStatus === 'Payment_Failed' || prevStatus === 'Payment_Pending') && activeStatuses.includes(status);

    const updatedOrder = await prisma.$transaction(async (tx) => {
      if (isDeactivating) {
        // Restock inventory
        await adjustStockForItems(tx, items, +1);
      } else if (isActivating) {
        // Decrement inventory
        await adjustStockForItems(tx, items, -1);
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status },
      });
    });

    console.log(`[Admin Orders] Updated order ${order.orderNumber} status from "${prevStatus}" to "${status}"`);

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update order status' }, { status: 500 });
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

    // 2. Aggregate items to restock only for active/paid orders (Pending/Shipped/Delivered)
    const restockItems = [];
    for (const order of ordersToDelete) {
      if (order.status !== 'Pending' && order.status !== 'Shipped' && order.status !== 'Delivered') {
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
      await adjustStockForItems(tx, restockItems, +1);

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
