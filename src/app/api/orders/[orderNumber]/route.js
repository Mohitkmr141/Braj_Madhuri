import { NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { orderNumber } = await params;

    if (!orderNumber || typeof orderNumber !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Order number is required.' },
        { status: 400 }
      );
    }

    const trimmedOrderNumber = orderNumber.trim();
    const prisma = getPrisma();

    const order = await prisma.order.findUnique({
      where: { orderNumber: trimmedOrderNumber },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        totalAmount: true,
        shippingCost: true,
        paymentMethod: true,
        status: true,
        cartItems: true,
        razorpayPaymentId: true,
        razorpayOrderId: true,
        createdAt: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found.' },
        { status: 404 }
      );
    }

    // Parse cart items safely
    let parsedCartItems = [];
    try {
      parsedCartItems =
        typeof order.cartItems === 'string'
          ? JSON.parse(order.cartItems)
          : order.cartItems || [];
    } catch {
      parsedCartItems = [];
    }

    const sanitizedOrder = {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      email: order.email,
      phone: order.phone,
      address: order.address,
      city: order.city,
      state: order.state,
      pincode: order.pincode,
      totalAmount: order.totalAmount,
      shippingCost: order.shippingCost || 0,
      paymentMethod: order.paymentMethod,
      status: order.status,
      cartItems: Array.isArray(parsedCartItems) ? parsedCartItems : [],
      razorpayPaymentId: order.razorpayPaymentId,
      createdAt: order.createdAt,
    };

    return NextResponse.json({
      success: true,
      order: sanitizedOrder,
    });
  } catch (error) {
    console.error('[Order API] Error fetching order receipt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve order details.' },
      { status: 500 }
    );
  }
}
