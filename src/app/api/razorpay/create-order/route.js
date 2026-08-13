import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

import { getPrisma } from '../../../../lib/prisma.js';

export async function POST(request) {
  try {
    const { cartItems, state } = await request.json();

    if (!cartItems || !cartItems.length) {
      return NextResponse.json(
        { success: false, error: 'Cart items are required' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();
    let calculatedCartTotal = 0;

    // 1. Calculate actual cart total from database prices
    for (const item of cartItems) {
      const product = await prisma.product.findUnique({ where: { id: item.id } });
      if (!product) {
        return NextResponse.json({ success: false, error: `Product ${item.id} not found` }, { status: 400 });
      }
      calculatedCartTotal += (product.price || 0) * item.quantity;
    }

    // Fetch site settings
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    
    // Apply special sale discount
    let specialSaleDiscount = 0;
    if (settings && settings.isSaleActive) {
      specialSaleDiscount = Math.round(calculatedCartTotal * (settings.saleDiscountPercentage / 100));
    }
    
    const finalDiscountedTotal = Math.max(0, calculatedCartTotal - specialSaleDiscount);

    // 2. Calculate shipping cost
    let shippingCost = 0;
    if (finalDiscountedTotal < 999) {
      if (state === "Delhi NCR") {
        shippingCost = 79;
      } else if (state === "Rest of India") {
        shippingCost = 119;
      }
    }

    const amount = finalDiscountedTotal + shippingCost;

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amountInPaise = Math.round(amount * 100);
    if (amountInPaise < 100) {
      return NextResponse.json(
        { success: false, error: 'Amount must be at least 1 INR (100 paise)' },
        { status: 400 }
      );
    }

    const options = {
      amount: amountInPaise, // Amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1, // Automatically capture the payment
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create Razorpay order' },
      { status: 500 }
    );
  }
}
