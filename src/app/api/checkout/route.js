import { NextResponse } from 'next/server';
import { sendOrderEmail } from '../../../lib/mailer.js';

let prisma;
async function getPrisma() {
  if (!prisma) {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function POST(request) {
  const prisma = await getPrisma();
  try {
    const body = await request.json();
    const { formData, cartItems, cartTotal, paymentMethod } = body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check stock for all items
      for (const item of cartItems) {
        // Find product
        const product = await tx.product.findUnique({ where: { id: item.id } });
        if (!product) {
          throw new Error(`Product ${item.title} not found.`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.title}. Only ${product.stock} left.`);
        }
      }

      // 2. Decrement stock
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.id },
          data: { stock: { decrement: item.quantity } }
        });
      }

      // 3. Generate a unique Order Number
      const randomId = Math.floor(Math.random() * 900000) + 100000;
      const orderNumber = `BM-${randomId}`;

      // 4. Save Order to Database
      const newOrder = await tx.order.create({
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

      return { orderNumber, newOrder };
    });

    // 5. Trigger Email Alert (Non-blocking)
    sendOrderEmail(result.newOrder).catch((err) => {
      console.error("Failed to send background email:", err);
    });

    return NextResponse.json({ success: true, orderNumber: result.orderNumber });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process order' },
      { status: 500 }
    );
  }
}
