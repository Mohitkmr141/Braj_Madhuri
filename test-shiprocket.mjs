import { getShiprocketToken, createShiprocketOrder, calculateShipping } from "./src/lib/shiprocket.js";

async function test() {
  try {
    console.log("Getting token...");
    const token = await getShiprocketToken();
    console.log("Token:", token.substring(0, 10) + "...");

    console.log("Testing calculate shipping...");
    const shipping = await calculateShipping("110001", 0.5, 0);
    console.log("Shipping API OK. Couriers available:", shipping?.available_courier_companies?.length);

    console.log("Testing order creation...");
    const order = {
      orderNumber: "TEST-12345",
      customerName: "Mohit Kumar",
      address: "123 Test St",
      city: "New Delhi",
      pincode: "110001",
      state: "Delhi NCR",
      email: "test@example.com",
      phone: "9876543210",
      totalAmount: 500,
      shippingCost: 0,
      cartItems: [
        { id: "1", title: "Test Product", quantity: 1, price: 500 }
      ]
    };

    const srResult = await createShiprocketOrder(order);
    console.log("Order creation successful:", srResult);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
