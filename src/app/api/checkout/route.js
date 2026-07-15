import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { sendOrderEmail } from '../../../lib/mailer.js';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { formData, cartItems, cartTotal, paymentMethod } = body;

    // 1. Generate a unique Order Number
    const randomId = Math.floor(Math.random() * 900000) + 100000;
    const orderNumber = `BM-${randomId}`;

    // 2. Save Order to Database
    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        customerName: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email || "",
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        totalAmount: cartTotal,
        paymentMethod: paymentMethod,
        cartItems: cartItems, // JSON field
      },
    });

    // 3. Trigger Email Alert (Non-blocking)
    sendOrderEmail(newOrder).catch((err) => {
      console.error("Failed to send background email:", err);
    });

    return NextResponse.json({ success: true, orderNumber });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process order' },
      { status: 500 }
    );
  }
}
