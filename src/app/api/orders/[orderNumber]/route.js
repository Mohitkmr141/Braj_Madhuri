import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { getPrisma } from '../../../../lib/prisma.js';
import { verifyAdminToken, verifyOrderAccessToken } from '../../../../lib/auth.js';

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

    // ── Authorization & IDOR Protection ─────────────────────────────────────
    let isAuthorized = false;

    // 1. Admin Session Check via Cookie
    try {
      const cookieStore = await cookies();
      const adminCookie = cookieStore.get('admin_session')?.value;
      if (adminCookie && (await verifyAdminToken(adminCookie))) {
        isAuthorized = true;
      }
    } catch {
      // Ignore cookie retrieval issues
    }

    // 2. NextAuth Session Check (Matching Email or Admin Role)
    if (!isAuthorized) {
      try {
        const session = await getServerSession(authOptions);
        if (session?.user) {
          const sessionEmail = session.user.email?.toLowerCase().trim();
          const orderEmail = order.email?.toLowerCase().trim();
          if (
            session.user.role === 'ADMIN' ||
            (sessionEmail && sessionEmail === orderEmail)
          ) {
            isAuthorized = true;
          }
        }
      } catch {
        // Ignore session retrieval issues
      }
    }

    // 3. Order Verification Token Check (HMAC signed during checkout / recovery)
    if (!isAuthorized) {
      const { searchParams } = new URL(request.url);
      const token = searchParams.get('token') || request.headers.get('x-order-token');
      if (token && verifyOrderAccessToken(trimmedOrderNumber, token)) {
        isAuthorized = true;
      }
    }

    // 4. Verification via Customer Phone or Email (Self-service order lookup)
    if (!isAuthorized) {
      const { searchParams } = new URL(request.url);
      const queryEmail = searchParams.get('email')?.toLowerCase().trim();
      const queryPhone = searchParams.get('phone')?.replace(/\D/g, '');
      const orderPhoneDigits = order.phone?.replace(/\D/g, '');

      if (queryEmail && order.email && queryEmail === order.email.toLowerCase().trim()) {
        isAuthorized = true;
      } else if (
        queryPhone &&
        orderPhoneDigits &&
        queryPhone.length >= 10 &&
        (orderPhoneDigits.endsWith(queryPhone) || queryPhone.endsWith(orderPhoneDigits))
      ) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access. Please log in with the account used for this order or provide valid verification details.',
        },
        { status: 401 }
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

