import nodemailer from "nodemailer";

// ─── Singleton transporter ────────────────────────────────────────────────────
// Created once at module load time so the TCP connection to Gmail is reused
// across all orders rather than being torn down and rebuilt on every request.
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null; // No credentials — will be caught in sendOrderEmail
  }

  _transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password
    },
    pool: true,          // Keep connection alive between sends
    maxConnections: 3,   // Allow up to 3 simultaneous connections
    rateDelta: 1000,     // Wait 1s between messages if needed
    rateLimit: 5,        // Max 5 messages per rateDelta window
  });

  return _transporter;
}

// ─── Retry helper ─────────────────────────────────────────────────────────────
// Retries a promise-returning fn up to `maxAttempts` times with a delay.
async function withRetry(fn, maxAttempts = 3, delayMs = 1000) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        console.warn(`[Email] Attempt ${attempt} failed: ${err.message} — retrying in ${delayMs}ms…`);
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }
  }
  throw lastError;
}

// ─── Build HTML helpers ───────────────────────────────────────────────────────
function buildItemsHtml(order) {
  const items =
    typeof order.cartItems === "string"
      ? JSON.parse(order.cartItems)
      : order.cartItems || [];

  return items
    .map(
      (item) =>
        `<li style="margin-bottom:6px;">
          <strong>${item.quantity}x ${item.title}</strong>
          ${item.size ? `<span style="color:#888;"> (Size: ${item.size})</span>` : ""}
          ${item.color ? `<span style="color:#888;"> [${item.color}]</span>` : ""}
          — ₹${item.price}
        </li>`
    )
    .join("");
}

function buildAdminHtml(order, itemsHtml) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:10px;">
      <h2 style="color:#4A1521;margin-top:0;">🎉 New Order Received!</h2>
      <p style="color:#555;">A new order has been placed on <strong>The Braj Madhuri</strong>.</p>

      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;background:#fdf8f0;font-weight:bold;width:40%;border-radius:4px;">Order ID</td><td style="padding:8px;">${order.orderNumber}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Total Amount</td><td style="padding:8px;">₹${order.totalAmount}</td></tr>
        <tr><td style="padding:8px;background:#fdf8f0;font-weight:bold;">Shipping Cost</td><td style="padding:8px;">₹${order.shippingCost || 0}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Payment</td><td style="padding:8px;">Online (Razorpay)</td></tr>
      </table>

      <h3 style="color:#C9972A;">Customer Details</h3>
      <table style="width:100%;border-collapse:collapse;margin:8px 0;">
        <tr><td style="padding:6px;font-weight:bold;width:40%;">Name</td><td style="padding:6px;">${order.customerName}</td></tr>
        <tr><td style="padding:6px;background:#fdf8f0;font-weight:bold;">Email</td><td style="padding:6px;background:#fdf8f0;">${order.email || "—"}</td></tr>
        <tr><td style="padding:6px;font-weight:bold;">Phone</td><td style="padding:6px;">${order.phone}</td></tr>
        <tr><td style="padding:6px;background:#fdf8f0;font-weight:bold;">Address</td><td style="padding:6px;background:#fdf8f0;">${order.address}, ${order.city}, ${order.state} — ${order.pincode}</td></tr>
      </table>

      <h3 style="color:#C9972A;">Items Ordered</h3>
      <ul style="padding-left:18px;color:#333;">${itemsHtml}</ul>

      <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;" />
      <p style="font-size:12px;color:#888;">Log into the Admin Dashboard to manage this order.</p>
    </div>`;
}

function buildCustomerHtml(order, itemsHtml) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:10px;">
      <h2 style="color:#4A1521;margin-top:0;">🪷 Thank you for your order!</h2>
      <p style="color:#555;">Dear <strong>${order.customerName}</strong>,</p>
      <p style="color:#555;">Your order has been placed successfully and is being processed. Here's a summary:</p>

      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;background:#fdf8f0;font-weight:bold;width:40%;border-radius:4px;">Order ID</td><td style="padding:8px;font-weight:bold;color:#4A1521;">${order.orderNumber}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Total Amount</td><td style="padding:8px;">₹${order.totalAmount}</td></tr>
        <tr><td style="padding:8px;background:#fdf8f0;font-weight:bold;">Delivery To</td><td style="padding:8px;background:#fdf8f0;">${order.address}, ${order.city}, ${order.state} — ${order.pincode}</td></tr>
      </table>

      <h3 style="color:#C9972A;">Items Ordered</h3>
      <ul style="padding-left:18px;color:#333;">${itemsHtml}</ul>

      <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;" />
      <p style="font-size:14px;color:#555;">If you have any questions, feel free to reply to this email or contact us on WhatsApp.</p>
      <p style="font-size:14px;color:#4A1521;font-weight:bold;margin-top:10px;">Jai Shri Krishna · Radhe Radhe 🙏</p>
      <p style="font-size:12px;color:#aaa;margin-top:16px;">© The Braj Madhuri</p>
    </div>`;
}

// ─── Main export ──────────────────────────────────────────────────────────────
export const sendOrderEmail = async (order) => {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn("[Email] No EMAIL_USER or EMAIL_PASS in .env — skipping email send.");
    return { success: false, skipped: true };
  }

  const itemsHtml = buildItemsHtml(order);
  const adminEmail = process.env.EMAIL_USER;
  const customerEmail = order.email?.trim();

  // ── 1. Send admin notification (with retry) ──────────────────────────────
  const adminResult = await withRetry(
    () =>
      transporter.sendMail({
        from: `"The Braj Madhuri" <${adminEmail}>`,
        to: adminEmail,
        subject: `🛍️ New Order [${order.orderNumber}]`,
        html: buildAdminHtml(order, itemsHtml),
      }),
    3,
    1000
  ).then(() => {
    console.log(`[Email] ✅ Admin email sent for order ${order.orderNumber}`);
    return { ok: true };
  }).catch((err) => {
    console.error(`[Email] ❌ Admin email FAILED for order ${order.orderNumber}:`, err.message);
    return { ok: false, error: err.message };
  });

  // ── 2. Send customer confirmation (with retry, only if email provided) ───
  let customerResult = { ok: true, skipped: true };
  if (customerEmail) {
    customerResult = await withRetry(
      () =>
        transporter.sendMail({
          from: `"The Braj Madhuri" <${adminEmail}>`,
          to: customerEmail,
          subject: `Order Confirmed — The Braj Madhuri [${order.orderNumber}]`,
          html: buildCustomerHtml(order, itemsHtml),
        }),
      3,
      1000
    ).then(() => {
      console.log(`[Email] ✅ Customer email sent to ${customerEmail} for order ${order.orderNumber}`);
      return { ok: true };
    }).catch((err) => {
      console.error(`[Email] ❌ Customer email FAILED to ${customerEmail} for order ${order.orderNumber}:`, err.message);
      return { ok: false, error: err.message };
    });
  } else {
    console.warn(`[Email] ⚠️ No customer email for order ${order.orderNumber} — skipping customer email.`);
  }

  // Return combined result — admin email is the critical one
  return {
    success: adminResult.ok,
    admin: adminResult,
    customer: customerResult,
  };
};
