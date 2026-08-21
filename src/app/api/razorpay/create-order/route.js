import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getPrisma } from '../../../../lib/prisma.js';

const COMBO_MAP = {
  'combo-daily-pooja-pack': { title: 'Daily Pooja Pack', price: 399 },
  'combo-japa-essentials': { title: 'Japa Essentials', price: 599 },
  'combo-thakur-ji-seva': { title: 'Thakur Ji Seva', price: 799 },
};

export async function POST(request) {
  try {
    const { cartItems, state, formData } = await request.json();

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart cannot be empty.' },
        { status: 400 }
      );
    }

    if (!formData?.email || !formData?.phone || !formData?.firstName || !formData?.address || !formData?.city || !formData?.state || !formData?.pincode) {
      return NextResponse.json(
        { success: false, error: 'Please provide all required shipping and contact details.' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();
    let calculatedCartTotal = 0;
    const verifiedCartItems = [];

    // 1. Strictly validate items, quantities, and prices from DB / COMBO_MAP
    for (const item of cartItems) {
      if (!item || !item.id) {
        return NextResponse.json(
          { success: false, error: 'Invalid item found in cart.' },
          { status: 400 }
        );
      }

      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
        return NextResponse.json(
          { success: false, error: `Invalid quantity for item "${item.title || item.id}". Quantity must be between 1 and 50.` },
          { status: 400 }
        );
      }

      // Check combo items strictly from COMBO_MAP - NEVER trust item.price from client
      if (item.id.startsWith('combo-') || COMBO_MAP[item.id]) {
        const comboInfo = COMBO_MAP[item.id];
        if (!comboInfo) {
          return NextResponse.json(
            { success: false, error: `Invalid combo product: "${item.id}".` },
            { status: 400 }
          );
        }
        calculatedCartTotal += comboInfo.price * qty;
        verifiedCartItems.push({
          id: item.id,
          title: comboInfo.title,
          price: comboInfo.price,
          originalPrice: null,
          quantity: qty,
          size: null,
          color: null,
          image: item.image || '/header-banner.jpg',
        });
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
      let itemOrigPrice = product.originalPrice || product.price || 0;
      let itemImage = product.imageUrl || (Array.isArray(product.images) && product.images[0]) || '/header-banner.jpg';
      const itemSize = item.size ? String(item.size).trim() : null;
      const itemColor = item.color ? String(item.color).trim() : null;

      // Check variant stock and pricing if applicable
      if (itemSize || itemColor) {
        const variants = Array.isArray(product.variants) ? product.variants : [];
        const iS = (itemSize || '').toLowerCase();
        const iC = (itemColor || '').toLowerCase();

        // Exact match first
        let matchedVariant = variants.find(v => {
          const vS = (v.size || '').trim().toLowerCase();
          const vC = (v.color || '').trim().toLowerCase();
          return (vS === iS) && (vC === iC);
        });

        // Fallback: match on size or color if the other attribute is empty
        if (!matchedVariant) {
          matchedVariant = variants.find(v => {
            const vS = (v.size || '').trim().toLowerCase();
            const vC = (v.color || '').trim().toLowerCase();
            const matchS = iS ? vS === iS : (!vS || vS === '');
            const matchC = iC ? vC === iC : (!vC || vC === '');
            return matchS && matchC;
          });
        }

        if (matchedVariant) {
          const variantStock = parseInt(matchedVariant.stock, 10) || 0;
          if (variantStock < qty) {
            return NextResponse.json(
              {
                success: false,
                error: `Insufficient stock for "${product.title}". Only ${variantStock} left in this variant.`
              },
              { status: 400 }
            );
          }
          if (matchedVariant.price !== undefined && matchedVariant.price !== null && matchedVariant.price !== '') {
            const vp = parseFloat(matchedVariant.price);
            if (!isNaN(vp) && vp >= 0) itemPrice = vp;
          }
          if (matchedVariant.originalPrice !== undefined && matchedVariant.originalPrice !== null && matchedVariant.originalPrice !== '') {
            const vop = parseFloat(matchedVariant.originalPrice);
            if (!isNaN(vop) && vop >= 0) itemOrigPrice = vop;
          }
          if (matchedVariant.image) {
            itemImage = matchedVariant.image;
          }
        } else if (variants.length > 0) {
          // Bug 3 fix: customer specified a size/color that does not match any variant.
          // Previously this silently fell through to product.stock. Now we reject it explicitly.
          return NextResponse.json(
            {
              success: false,
              error: `The selected size/color combination is not available for "${product.title}". Please choose a valid option.`
            },
            { status: 400 }
          );
        } else if (product.stock < qty) {
          return NextResponse.json(
            { success: false, error: `Insufficient stock for "${product.title}". Only ${product.stock} left.` },
            { status: 400 }
          );
        }

      } else if (product.stock < qty) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for "${product.title}". Only ${product.stock} left.` },
          { status: 400 }
        );
      }

      calculatedCartTotal += itemPrice * qty;
      verifiedCartItems.push({
        id: product.id,
        title: product.title,
        price: itemPrice,
        originalPrice: itemOrigPrice,
        quantity: qty,
        size: itemSize,
        color: itemColor,
        image: itemImage,
      });
    }

    // 2. Fetch site settings for discounts
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    
    let specialSaleDiscount = 0;
    if (settings && settings.isSaleActive && settings.saleDiscountPercentage > 0) {
      specialSaleDiscount = Math.round(calculatedCartTotal * (settings.saleDiscountPercentage / 100));
    }
    
    const finalDiscountedTotal = Math.max(0, calculatedCartTotal - specialSaleDiscount);

    // 3. Calculate shipping cost strictly from customer state
    const customerState = (formData?.state || state || '').trim();
    let shippingCost = 0;
    if (finalDiscountedTotal < 999) {
      if (customerState.toLowerCase() === "delhi" || customerState.toLowerCase() === "delhi ncr") {
        shippingCost = 79;
      } else {
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

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('[Create-Order] Missing Razorpay API keys.');
      return NextResponse.json(
        { success: false, error: 'Payment gateway configuration error.' },
        { status: 500 }
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
        cartItems: verifiedCartItems,
        shippingCost: shippingCost,
        razorpayOrderId: rzpOrder.id,
      },
    });

    console.log(`[Create-Order] Pre-recorded order ${orderNumber} (Razorpay: ${rzpOrder.id}) as Payment_Pending`);

    return NextResponse.json({
      success: true,
      order: rzpOrder,
      orderNumber: orderNumber,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
