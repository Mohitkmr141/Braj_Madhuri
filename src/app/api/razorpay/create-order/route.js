import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getPrisma } from '../../../../lib/prisma.js';

export async function POST(request) {
  try {
    const { cartItems, state, formData } = await request.json();

    if (!cartItems || !cartItems.length) {
      return NextResponse.json(
        { success: false, error: 'Cart items are required' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();
    let calculatedCartTotal = 0;

    const COMBO_MAP = {
      'combo-daily-pooja-pack': { title: 'Daily Pooja Pack', price: 399 },
      'combo-japa-essentials': { title: 'Japa Essentials', price: 599 },
      'combo-thakur-ji-seva': { title: 'Thakur Ji Seva', price: 799 },
    };

    // 1. Validate items and pre-check stock from database
    for (const item of cartItems) {
      if (item.id && (item.id.startsWith('combo-') || COMBO_MAP[item.id])) {
        const comboInfo = COMBO_MAP[item.id] || { price: item.price || 399 };
        calculatedCartTotal += (comboInfo.price || item.price || 0) * item.quantity;
        continue;
      }

      const product = await prisma.product.findUnique({ where: { id: item.id } });
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product "${item.title || item.id}" not found.` },
          { status: 400 }
        );
      }

      let itemPrice = product.price || 0;

      // Check variant stock and pricing if applicable
      if (item.size || item.color) {
        const variants = Array.isArray(product.variants) ? product.variants : [];
        const matchedVariant = variants.find(v => {
          const vS = (v.size || '').trim().toLowerCase();
          const vC = (v.color || '').trim().toLowerCase();
          const iS = (item.size || '').trim().toLowerCase();
          const iC = (item.color || '').trim().toLowerCase();
          return (!vS || vS === iS) && (!vC || vC === iC);
        });

        if (matchedVariant) {
          const variantStock = parseInt(matchedVariant.stock, 10) || 0;
          if (variantStock < item.quantity) {
            return NextResponse.json(
              {
                success: false,
                error: `Insufficient stock for "${item.title}". Only ${variantStock} left in this variant.`
              },
              { status: 400 }
            );
          }
          if (matchedVariant.price !== undefined && matchedVariant.price !== null && matchedVariant.price !== '') {
            const vp = parseFloat(matchedVariant.price);
            if (!isNaN(vp)) itemPrice = vp;
          }
        } else if (product.stock < item.quantity) {
          return NextResponse.json(
            { success: false, error: `Insufficient stock for "${item.title}". Only ${product.stock} left.` },
            { status: 400 }
          );
        }
      } else if (product.stock < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for "${item.title}". Only ${product.stock} left.` },
          { status: 400 }
        );
      }

      calculatedCartTotal += itemPrice * item.quantity;
    }

    // 2. Fetch site settings for discounts
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    
    let specialSaleDiscount = 0;
    if (settings && settings.isSaleActive) {
      specialSaleDiscount = Math.round(calculatedCartTotal * (settings.saleDiscountPercentage / 100));
    }
    
    const finalDiscountedTotal = Math.max(0, calculatedCartTotal - specialSaleDiscount);

    // 3. Calculate shipping cost
    const customerState = (formData?.state || state || '').trim();
    let shippingCost = 0;
    if (finalDiscountedTotal < 999) {
      if (customerState.toLowerCase() === "delhi" || customerState.toLowerCase() === "delhi ncr") {
        shippingCost = 79;
      } else {
        // Default to standard shipping rate (covers missing state from direct API calls)
        shippingCost = 119;
      }
    }

    const totalAmount = finalDiscountedTotal + shippingCost;
    const amountInPaise = Math.round(totalAmount * 100);

    if (amountInPaise < 100) {
      return NextResponse.json(
        { success: false, error: 'Amount must be at least 1 INR (100 paise)' },
        { status: 400 }
      );
    }

    // 4. Generate unique Order Number
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const orderNumber = `BM-${timestamp}${randomSuffix}`;

    // 5. Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const customerName = formData?.firstName 
      ? `${formData.firstName} ${formData.lastName || ''}`.trim() 
      : 'Guest Customer';

    // Build Razorpay order options with metadata notes
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderNumber,
      payment_capture: 1,
      notes: {
        orderNumber: orderNumber,
        customerName: customerName.slice(0, 40),
        email: (formData?.email || '').slice(0, 40),
        phone: (formData?.phone || '').slice(0, 15),
        address: (formData?.address || '').slice(0, 80),
        city: (formData?.city || '').slice(0, 40),
        state: (customerState || '').slice(0, 30),
        pincode: (formData?.pincode || '').slice(0, 10),
      },
    };

    const rzpOrder = await razorpay.orders.create(options);

    // 6. Pre-record the order in database with status 'Payment_Pending'
    if (formData?.email && formData?.phone) {
      try {
        await prisma.order.create({
          data: {
            orderNumber: orderNumber,
            customerName: customerName,
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone.trim(),
            address: formData.address || '',
            city: formData.city || '',
            state: customerState || '',
            pincode: formData.pincode || '',
            totalAmount: totalAmount,
            paymentMethod: 'online',
            status: 'Payment_Pending',
            cartItems: cartItems,
            shippingCost: shippingCost,
            razorpayOrderId: rzpOrder.id,
          },
        });
        console.log(`[Create-Order] Pre-recorded order ${orderNumber} (Razorpay: ${rzpOrder.id}) as Payment_Pending`);
      } catch (dbErr) {
        console.error(`[Create-Order] Failed to pre-record order in DB:`, dbErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      order: rzpOrder,
      orderNumber: orderNumber
    });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create Razorpay order' },
      { status: 500 }
    );
  }
}
