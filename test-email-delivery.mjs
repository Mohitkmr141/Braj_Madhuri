import { sendOrderEmail } from "./src/lib/mailer.js";

async function testEmail() {
  console.log("Testing email sending...");
  const dummyOrder = {
    orderNumber: "TEST-123",
    totalAmount: 100,
    shippingCost: 0,
    customerName: "Mohit Kumar",
    email: "brajmadhuriofficial@gmail.com",
    phone: "9876543210",
    address: "Test",
    city: "Delhi",
    state: "Delhi",
    pincode: "110001",
    cartItems: [{ title: "Test Product", quantity: 1, price: 100 }]
  };

  const result = await sendOrderEmail(dummyOrder);
  console.log("Email Result:", JSON.stringify(result, null, 2));
}

testEmail().catch(console.error);
