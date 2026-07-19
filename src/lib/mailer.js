import nodemailer from "nodemailer";

// Create a reusable transporter using Gmail
// Note: Since this is a demo, if no SMTP credentials are provided, it will mock success
export const sendOrderEmail = async (order) => {
  // We check if the user actually configured their EMAIL_USER and EMAIL_PASS
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("No EMAIL_USER or EMAIL_PASS provided in .env. Mocking email send...");
    return { success: true, mocked: true };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App Password
    },
  });

  const itemsHtml = order.cartItems
    .map(
      (item) =>
        `<li>${item.quantity}x ${item.title} ${item.size ? `(Size: ${item.size})` : ""} ${item.color ? `[Color: ${item.color}]` : ""} - ₹${item.price}</li>`
    )
    .join("");

  const adminMailOptions = {
    from: `"The Braj Madhuri" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // Sending alert to the admin
    subject: `New Order Received! [${order.orderNumber}]`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4A1521;">New Order Alert! 🎉</h2>
        <p>You have received a new order on The Braj Madhuri.</p>
        
        <h3 style="color: #C9972A;">Order Details:</h3>
        <p><strong>Order ID:</strong> ${order.orderNumber}</p>
        <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
        <p><strong>Payment Method:</strong> Online</p>
        
        <h3 style="color: #C9972A;">Customer Info:</h3>
        <p><strong>Name:</strong> ${order.customerName}</p>
        <p><strong>Email:</strong> ${order.email}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Address:</strong> ${order.address}, ${order.city}, ${order.state} - ${order.pincode}</p>
        
        <h3 style="color: #C9972A;">Items Ordered:</h3>
        <ul>
          ${itemsHtml}
        </ul>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">Please log into the Admin Dashboard to view more details.</p>
      </div>
    `,
  };

  const customerMailOptions = {
    from: `"The Braj Madhuri" <${process.env.EMAIL_USER}>`,
    to: order.email, // Sending confirmation to the customer
    subject: `Order Confirmation - The Braj Madhuri [${order.orderNumber}]`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4A1521;">Thank you for your order! 🪷</h2>
        <p>Dear ${order.customerName},</p>
        <p>We have successfully received your order and are processing it. Here are your order details:</p>
        
        <h3 style="color: #C9972A;">Order Details:</h3>
        <p><strong>Order ID:</strong> ${order.orderNumber}</p>
        <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
        
        <h3 style="color: #C9972A;">Items Ordered:</h3>
        <ul>
          ${itemsHtml}
        </ul>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 14px; color: #555;">If you have any questions, feel free to reply to this email or contact us on WhatsApp.</p>
        <p style="font-size: 14px; color: #555; margin-top: 10px;"><strong>Jai Shri Krishna · Radhe Radhe</strong></p>
      </div>
    `,
  };

  try {
    // Send both emails simultaneously
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(customerMailOptions)
    ]);
    console.log("Order emails sent successfully for: %s", order.orderNumber);
    return { success: true };
  } catch (error) {
    console.error("Error sending emails:", error);
    return { success: false, error: error.message };
  }
};
