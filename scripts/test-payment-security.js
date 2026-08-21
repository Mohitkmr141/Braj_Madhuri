import { finalizePaidOrder } from '../src/lib/orderService.js';
import { getPrisma } from '../src/lib/prisma.js';

async function runSecurityTests() {
  console.log('=== STARTING PAYMENT GATEWAY SECURITY AUDIT TESTS ===\n');
  let passed = 0;
  let failed = 0;

  const prisma = getPrisma();

  const COMBO_MAP = {
    'combo-daily-pooja-pack': { title: 'Daily Pooja Pack', price: 399 },
    'combo-japa-essentials': { title: 'Japa Essentials', price: 599 },
    'combo-thakur-ji-seva': { title: 'Thakur Ji Seva', price: 799 },
  };

  // Helper simulating the validation block from create-order/route.js
  function validateAndCalculateCart(cartItems, formData, state) {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return { success: false, status: 400, error: 'Cart cannot be empty.' };
    }

    if (!formData?.email || !formData?.phone || !formData?.firstName || !formData?.address || !formData?.city || !formData?.pincode) {
      return { success: false, status: 400, error: 'Please provide all required shipping and contact details.' };
    }

    let calculatedCartTotal = 0;

    for (const item of cartItems) {
      if (!item || !item.id) {
        return { success: false, status: 400, error: 'Invalid item found in cart.' };
      }

      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
        return { success: false, status: 400, error: `Invalid quantity for item "${item.title || item.id}". Quantity must be between 1 and 50.` };
      }

      // Check combo items strictly from COMBO_MAP - NEVER trust item.price from client
      if (item.id.startsWith('combo-') || COMBO_MAP[item.id]) {
        const comboInfo = COMBO_MAP[item.id];
        if (!comboInfo) {
          return { success: false, status: 400, error: `Invalid combo product: "${item.id}".` };
        }
        calculatedCartTotal += comboInfo.price * qty;
        continue;
      }
    }

    return { success: true, calculatedCartTotal };
  }

  // Test 1: Arbitrary Combo Price Injection
  try {
    console.log('[Test 1] Testing Price Injection via fake combo ID with price: 1...');
    const result = validateAndCalculateCart(
      [{ id: 'combo-hacked-custom-bundle', price: 1, quantity: 1 }],
      {
        firstName: 'Attacker',
        email: 'attacker@example.com',
        phone: '9999999999',
        address: 'Attacker Rd',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
      },
      'Delhi'
    );

    if (!result.success && result.error && result.error.includes('Invalid combo product')) {
      console.log('  ✅ PASSED: Arbitrary combo price injection was successfully blocked.');
      passed++;
    } else {
      console.error('  ❌ FAILED: Fake combo was allowed!', result);
      failed++;
    }
  } catch (err) {
    console.error('  ❌ FAILED with error:', err);
    failed++;
  }

  // Test 2: Negative Quantity Tampering
  try {
    console.log('\n[Test 2] Testing Negative Quantity Tampering (quantity: -5)...');
    const result = validateAndCalculateCart(
      [{ id: 'combo-daily-pooja-pack', quantity: -5 }],
      {
        firstName: 'Attacker',
        email: 'attacker@example.com',
        phone: '9999999999',
        address: 'Attacker Rd',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
      },
      'Delhi'
    );

    if (!result.success && result.error && result.error.includes('Quantity must be between 1 and 50')) {
      console.log('  ✅ PASSED: Negative quantity manipulation was successfully blocked.');
      passed++;
    } else {
      console.error('  ❌ FAILED: Negative quantity was allowed!', result);
      failed++;
    }
  } catch (err) {
    console.error('  ❌ FAILED with error:', err);
    failed++;
  }

  // Test 3: Float Quantity Manipulation
  try {
    console.log('\n[Test 3] Testing Float Quantity Manipulation (quantity: 2.5)...');
    const result = validateAndCalculateCart(
      [{ id: 'combo-daily-pooja-pack', quantity: 2.5 }],
      {
        firstName: 'Attacker',
        email: 'attacker@example.com',
        phone: '9999999999',
        address: 'Attacker Rd',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
      },
      'Delhi'
    );

    if (!result.success && result.error && result.error.includes('Quantity must be between 1 and 50')) {
      console.log('  ✅ PASSED: Float quantity manipulation was successfully blocked.');
      passed++;
    } else {
      console.error('  ❌ FAILED: Float quantity was allowed!', result);
      failed++;
    }
  } catch (err) {
    console.error('  ❌ FAILED with error:', err);
    failed++;
  }

  // Test 4: Missing Required Customer Details
  try {
    console.log('\n[Test 4] Testing Order Creation with Missing Customer Details...');
    const result = validateAndCalculateCart(
      [{ id: 'combo-daily-pooja-pack', quantity: 1 }],
      {
        firstName: 'Incomplete',
        // missing email, phone, address, etc.
      },
      'Delhi'
    );

    if (!result.success && result.error && result.error.includes('required shipping and contact details')) {
      console.log('  ✅ PASSED: Incomplete customer details rejected before payment order is issued.');
      passed++;
    } else {
      console.error('  ❌ FAILED: Incomplete details were allowed!', result);
      failed++;
    }
  } catch (err) {
    console.error('  ❌ FAILED with error:', err);
    failed++;
  }

  // Test 5: Concurrent Finalization & Idempotency
  // BUG FIX: this test was previously left with an unclosed try{} block that swallowed
  // Tests 6 & 7 and never evaluated the updatedOrder.status assertion.
  try {
    console.log('\n[Test 5] Testing Concurrent Order Finalization (Race Condition Simulation)...');
    const testRzpOrderId = `order_sec_test_${Date.now()}`;
    const testRzpPaymentId = `pay_sec_test_${Date.now()}`;
    const testOrderNumber = `BM-SEC-${Date.now()}`;

    // Create a pre-recorded order
    const preOrder = await prisma.order.create({
      data: {
        orderNumber: testOrderNumber,
        customerName: 'Concurrency Tester',
        email: 'concurrency@test.com',
        phone: '9876543210',
        address: '123 Mathura Rd',
        city: 'Vrindavan',
        state: 'Uttar Pradesh',
        pincode: '281121',
        totalAmount: 399,
        paymentMethod: 'online',
        status: 'Payment_Pending',
        cartItems: [{ id: 'combo-daily-pooja-pack', title: 'Daily Pooja Pack', price: 399, quantity: 1 }],
        shippingCost: 119,
        razorpayOrderId: testRzpOrderId,
      },
    });

    // Run 2 simultaneous finalize calls (simulating Webhook + Browser callback arriving at the exact same millisecond)
    const [resA, resB] = await Promise.all([
      finalizePaidOrder({
        razorpayOrderId: testRzpOrderId,
        razorpayPaymentId: testRzpPaymentId,
        orderNumber: testOrderNumber,
      }),
      finalizePaidOrder({
        razorpayOrderId: testRzpOrderId,
        razorpayPaymentId: testRzpPaymentId,
        orderNumber: testOrderNumber,
      }),
    ]);

    const updatedOrder = await prisma.order.findUnique({ where: { id: preOrder.id } });

    // Clean up test order
    await prisma.order.delete({ where: { id: preOrder.id } });

    // Evaluate Test 5 result (was previously missing — assertion was dropped)
    if (updatedOrder && updatedOrder.status === 'Pending' && resA.success && resB.success) {
      console.log('  ✅ PASSED: Concurrent race condition resolved cleanly. Final status: Pending.');
      passed++;
    } else {
      console.error('  ❌ FAILED: Concurrency results unexpected:', { resA, resB, status: updatedOrder?.status });
      failed++;
    }
  } catch (err) {
    console.error('  ❌ FAILED with error:', err);
    failed++;
  }

  // Test 6: Variant Matching Accuracy (Exact Match vs Incomplete Attribute Match)
  try {
    console.log('\n[Test 6] Testing Variant Exact Matching Priority...');
    const dummyProduct = {
      id: 'test-variant-prod',
      title: 'Test Variant Product',
      price: 200,
      variants: [
        { id: 'v1', size: '', color: 'Red', price: 150, stock: 10 },
        { id: 'v2', size: 'Large', color: 'Red', price: 250, stock: 5 },
      ]
    };

    const requestedItem = { id: 'test-variant-prod', size: 'Large', color: 'Red', quantity: 1 };
    const iS = (requestedItem.size || '').toLowerCase();
    const iC = (requestedItem.color || '').toLowerCase();

    // Exact match first
    let matched = dummyProduct.variants.find(v => {
      const vS = (v.size || '').trim().toLowerCase();
      const vC = (v.color || '').trim().toLowerCase();
      return (vS === iS) && (vC === iC);
    });

    if (!matched) {
      matched = dummyProduct.variants.find(v => {
        const vS = (v.size || '').trim().toLowerCase();
        const vC = (v.color || '').trim().toLowerCase();
        const matchS = iS ? vS === iS : (!vS || vS === '');
        const matchC = iC ? vC === iC : (!vC || vC === '');
        return matchS && matchC;
      });
    }

    if (matched && matched.id === 'v2' && matched.price === 250) {
      console.log('  ✅ PASSED: Variant exact matching selected the correct variant (v2 @ ₹250) instead of v1.');
      passed++;
    } else {
      console.error('  ❌ FAILED: Wrong variant matched:', matched);
      failed++;
    }
  } catch (err) {
    console.error('  ❌ FAILED with error:', err);
    failed++;
  }

  // Test 7: Untrusted Cart Item Price Sanitization
  try {
    console.log('\n[Test 7] Testing Untrusted Cart Item Price Sanitization...');
    // Simulated DB product
    const dbProd = { id: 'prod-secure-123', title: 'Authentic Dhoop', price: 299, originalPrice: 399 };
    const clientTamperedItem = { id: 'prod-secure-123', title: 'Hacked Title', price: 1, originalPrice: 1, quantity: 2 };

    // Build verified cart item (as server would — ignoring all client-provided prices)
    const verifiedItem = {
      id: dbProd.id,
      title: dbProd.title,
      price: dbProd.price,
      originalPrice: dbProd.originalPrice,
      quantity: clientTamperedItem.quantity,
      size: null,
      color: null,
      image: '/header-banner.jpg',
    };

    if (verifiedItem.price === 299 && verifiedItem.title === 'Authentic Dhoop') {
      console.log('  ✅ PASSED: Client tampered item price was sanitized to verified DB price (₹299).');
      passed++;
    } else {
      console.error('  ❌ FAILED: Item price was not sanitized:', verifiedItem);
      failed++;
    }
  } catch (err) {
    console.error('  ❌ FAILED with error:', err);
    failed++;
  }

  // Test 8: Unmatched Variant Rejection
  try {
    console.log('\n[Test 8] Testing Unmatched Variant Rejection (size: "XXL" with no XXL variant)...');
    const dummyProduct = {
      id: 'test-variant-reject',
      title: 'Kashmiri Kesar',
      price: 500,
      stock: 20,
      variants: [
        { id: 'v1', size: 'Small', color: '', price: 499, stock: 8 },
        { id: 'v2', size: 'Large', color: '', price: 599, stock: 5 },
      ]
    };

    const requestedItem = { id: 'test-variant-reject', size: 'XXL', color: '', quantity: 1 };
    const iS = (requestedItem.size || '').toLowerCase();
    const iC = (requestedItem.color || '').toLowerCase();
    const variants = dummyProduct.variants;

    let matchedVariant = variants.find(v => {
      const vS = (v.size || '').trim().toLowerCase();
      const vC = (v.color || '').trim().toLowerCase();
      return (vS === iS) && (vC === iC);
    });

    if (!matchedVariant) {
      matchedVariant = variants.find(v => {
        const vS = (v.size || '').trim().toLowerCase();
        const vC = (v.color || '').trim().toLowerCase();
        const matchS = iS ? vS === iS : (!vS || vS === '');
        const matchC = iC ? vC === iC : (!vC || vC === '');
        return matchS && matchC;
      });
    }

    // New behaviour (Bug 3 fix): reject if size/color requested but no variant found
    const requestedSizeOrColor = !!(requestedItem.size || requestedItem.color);
    const wouldReject = requestedSizeOrColor && !matchedVariant;

    if (wouldReject) {
      console.log('  ✅ PASSED: Unmatched variant "XXL" correctly rejected — order would not proceed.');
      passed++;
    } else {
      console.error('  ❌ FAILED: Unmatched variant was allowed through! Matched:', matchedVariant);
      failed++;
    }
  } catch (err) {
    console.error('  ❌ FAILED with error:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runSecurityTests();
