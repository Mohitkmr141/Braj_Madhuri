import Razorpay from 'razorpay';

async function testRazorpay() {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: 100, // 1 INR
      currency: 'INR',
      receipt: `receipt_test_123`,
      payment_capture: 1,
    };

    console.log("Creating Razorpay order with Key ID:", process.env.RAZORPAY_KEY_ID);
    const order = await razorpay.orders.create(options);
    console.log("Success! Order:", order);
  } catch (error) {
    console.error("Razorpay Error:", error);
  }
}

testRazorpay();
