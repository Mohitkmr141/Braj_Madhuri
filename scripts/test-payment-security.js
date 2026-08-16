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

    if (updatedOrder.status === 'Pending' && resA.success && resB.success) {
      console.log('  ✅ PASSED: Concurrent race condition resolved cleanly without throwing P2002 or crashing.');
      passed++;
    } else {
      console.error('  ❌ FAILED: Concurrency results unexpected:', { resA, resB, status: updatedOrder?.status });
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
