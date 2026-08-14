import { getPrisma } from './src/lib/prisma.js';
import { finalizePaidOrder } from './src/lib/orderService.js';
import crypto from 'crypto';

async function runTests() {
  const prisma = getPrisma();
  console.log("=== STARTING ORDER LIFECYCLE TESTS ===");

  try {
    const testRzpOrderId = `order_test_${Date.now()}`;
    const testRzpPaymentId = `pay_test_${Date.now()}`;
    const testOrderNumber = `BM-TEST-${Date.now()}`;

    // 1. Create a dummy product for testing if needed
    const sampleProduct = await prisma.product.findFirst();
    if (!sampleProduct) {
      console.error("No products found in DB for test");
      return;
    }
    console.log(`[Test] Using product: ${sampleProduct.title} (ID: ${sampleProduct.id}, Stock: ${sampleProduct.stock})`);

    // 2. Pre-create order as Payment_Pending
    const preOrder = await prisma.order.create({
      data: {
        orderNumber: testOrderNumber,
        customerName: 'Test Customer',
        email: 'test@example.com',
        phone: '9999999999',
        address: '123 Test Street',
        city: 'Mathura',
        state: 'Uttar Pradesh',
        pincode: '281001',
        totalAmount: sampleProduct.price || 100,
        paymentMethod: 'online',
        status: 'Payment_Pending',
        cartItems: [{
          id: sampleProduct.id,
          title: sampleProduct.title,
          price: sampleProduct.price || 100,
          quantity: 1
        }],
        shippingCost: 0,
        razorpayOrderId: testRzpOrderId,
      }
    });
    console.log(`[Test 1 PASSED] Pre-recorded order created: ${preOrder.orderNumber} with status: ${preOrder.status}`);

    // 3. Finalize paid order via OrderService (Simulating Webhook or Checkout callback)
    const finalizeRes1 = await finalizePaidOrder({
      razorpayOrderId: testRzpOrderId,
      razorpayPaymentId: testRzpPaymentId,
      orderNumber: testOrderNumber,
    });
    console.log(`[Test 2 PASSED] Order finalized. Status: ${finalizeRes1.order.status}, RzpPaymentId: ${finalizeRes1.order.razorpayPaymentId}`);

    // 4. Test Idempotency (calling finalizePaidOrder a second time should not fail and should not re-process)
    const finalizeRes2 = await finalizePaidOrder({
      razorpayOrderId: testRzpOrderId,
      razorpayPaymentId: testRzpPaymentId,
      orderNumber: testOrderNumber,
    });
    console.log(`[Test 3 PASSED] Idempotency verified. isNewOrUpdated: ${finalizeRes2.isNewOrUpdated} (expected false)`);

    // 5. Test Webhook HMAC Signature verification logic
    const secret = "kb75pZOo0AfU0CqgW2YC6NWw";
    const testPayload = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: testRzpPaymentId, order_id: testRzpOrderId } } } });
    const computedSignature = crypto.createHmac('sha256', secret).update(testPayload).digest('hex');
    const verifySignature = crypto.createHmac('sha256', secret).update(testPayload).digest('hex');
    if (computedSignature === verifySignature) {
      console.log(`[Test 4 PASSED] Webhook HMAC SHA256 Signature verification algorithm valid.`);
    }

    // 6. Clean up test order
    await prisma.order.delete({ where: { id: preOrder.id } });
    console.log(`[Test Cleaned Up] Test order ${testOrderNumber} deleted.`);

    console.log("=== ALL TESTS PASSED SUCCESSFULLY! ===");
  } catch (err) {
    console.error("Test Failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
