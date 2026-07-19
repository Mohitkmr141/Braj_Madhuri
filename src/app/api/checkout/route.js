import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { sendOrderEmail } from '../../../lib/mailer.js';
import { createShiprocketOrder } from '../../../lib/shiprocket.js';
import crypto from 'crypto';

let prisma;
function getPrisma() {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

export async function POST(request) {
  const prisma = getPrisma();
  try {
    const body = await request.json();
    const { formData, cartItems, cartTotal, shippingCost, paymentMethod, razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

    // Verify Razorpay signature if online payment
    if (paymentMethod === 'online') {
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return NextResponse.json({ success: false, error: 'Missing payment details' }, { status: 400 });
      }
      const bodyToSign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(bodyToSign.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 });
      }
    }

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
          shippingCost: shippingCost || 0,
          cartItems: cartItems, // JSON field
        },
      });

      return { orderNumber, newOrder };
    });

    // 5. Trigger Email Alert
    try {
      await sendOrderEmail(result.newOrder);
    } catch (err) {
      console.error("Failed to send email:", err);
    }

    // 6. Trigger Shiprocket Order Creation
    try {
      const srResult = await createShiprocketOrder(result.newOrder);
      if (srResult && srResult.order_id) {
        await prisma.order.update({
          where: { id: result.newOrder.id },
          data: { 
            shiprocketOrderId: srResult.order_id,
            shiprocketShipmentId: srResult.shipment_id 
          }
        });
      }
    } catch (err) {
      console.error("Failed to create Shiprocket order:", err);
    }

    return NextResponse.json({ success: true, orderNumber: result.orderNumber });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process order' },
      { status: 500 }
    );
  }
}
