import nodemailer from "nodemailer";

// ─── Transporter factory & singleton ──────────────────────────────────────────
let _transporter = null;

function createFreshTransporter() {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, "");

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
}

function getTransporter() {
  if (!_transporter) {
    _transporter = createFreshTransporter();
  }
  return _transporter;
}

// ─── Retry helper ─────────────────────────────────────────────────────────────
// Retries a promise-returning fn up to `maxAttempts` times with a delay.
// If an attempt fails, it recreates the transporter in case of broken sockets.
async function withRetry(fn, maxAttempts = 3, delayMs = 1000) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // Re-initialize transporter on socket connection drop
      _transporter = createFreshTransporter();
      if (attempt < maxAttempts) {
        console.warn(`[Email] Attempt ${attempt} failed: ${err.message} — retrying in ${delayMs}ms…`);
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }
  }
  throw lastError;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── Build HTML helpers for Orders ───────────────────────────────────────────
function buildItemsHtml(order) {
  let items = [];
  try {
    items =
      typeof order.cartItems === "string"
        ? JSON.parse(order.cartItems)
        : order.cartItems || [];
  } catch (err) {
    console.error("[Email] Error parsing cart items:", err);
  }

  if (!Array.isArray(items) || items.length === 0) {
    return "<li style='color:#777;'>No item details available</li>";
  }

  return items
    .map(
      (item) =>
        `<li style="margin-bottom:6px;">
          <strong>${Number(item.quantity) || 1}x ${escapeHtml(item.title || "Product")}</strong>
          ${item.size ? `<span style="color:#888;"> (Size: ${escapeHtml(item.size)})</span>` : ""}
          ${item.color ? `<span style="color:#888;"> [${escapeHtml(item.color)}]</span>` : ""}
          — ₹${Number(item.price) || 0}
        </li>`
    )
    .join("");
}

function getOrderPricingBreakdown(order) {
  let items = [];
  try {
    items = typeof order.cartItems === "string" ? JSON.parse(order.cartItems) : order.cartItems || [];
  } catch (err) {
    items = [];
  }
  const itemsTotal = Array.isArray(items) ? items.reduce((acc, it) => acc + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0) : 0;
  const shippingCost = Number(order.shippingCost) || 0;
  const totalAmount = Number(order.totalAmount) || 0;
  const discountAmount = Math.max(0, Math.round(itemsTotal + shippingCost - totalAmount));
  return { itemsTotal, shippingCost, totalAmount, discountAmount };
}

function buildAdminHtml(order, itemsHtml) {
  const safeOrderNumber = escapeHtml(order.orderNumber);
  const safeCustomerName = escapeHtml(order.customerName);
  const safeEmail = escapeHtml(order.email || "—");
  const safePhone = escapeHtml(order.phone);
  const safeAddress = `${escapeHtml(order.address)}, ${escapeHtml(order.city)}, ${escapeHtml(order.state)} — ${escapeHtml(order.pincode)}`;
  const { itemsTotal, shippingCost, totalAmount, discountAmount } = getOrderPricingBreakdown(order);

  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:10px;">
      <h2 style="color:#4A1521;margin-top:0;">🎉 New Order Received!</h2>
      <p style="color:#555;">A new order has been placed on <strong>The Braj Madhuri</strong>.</p>

      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;background:#fdf8f0;font-weight:bold;width:40%;border-radius:4px;">Order ID</td><td style="padding:8px;">${safeOrderNumber}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Subtotal</td><td style="padding:8px;">₹${itemsTotal}</td></tr>
        ${discountAmount > 0 ? `<tr><td style="padding:8px;background:#fdf8f0;font-weight:bold;color:#2e7d32;">Special Sale Discount</td><td style="padding:8px;background:#fdf8f0;font-weight:bold;color:#2e7d32;">− ₹${discountAmount}</td></tr>` : ''}
        <tr><td style="padding:8px;font-weight:bold;">Shipping Cost</td><td style="padding:8px;">${shippingCost > 0 ? `₹${shippingCost}` : '—'}</td></tr>
        <tr><td style="padding:8px;background:#fdf8f0;font-weight:bold;color:#4A1521;font-size:15px;">Total Amount Paid</td><td style="padding:8px;background:#fdf8f0;font-weight:bold;color:#4A1521;font-size:15px;">₹${totalAmount}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Payment</td><td style="padding:8px;">Online (Razorpay)</td></tr>
      </table>

      <h3 style="color:#C9972A;">Customer Details</h3>
      <table style="width:100%;border-collapse:collapse;margin:8px 0;">
        <tr><td style="padding:6px;font-weight:bold;width:40%;">Name</td><td style="padding:6px;">${safeCustomerName}</td></tr>
        <tr><td style="padding:6px;background:#fdf8f0;font-weight:bold;">Email</td><td style="padding:6px;background:#fdf8f0;">${safeEmail}</td></tr>
        <tr><td style="padding:6px;font-weight:bold;">Phone</td><td style="padding:6px;">${safePhone}</td></tr>
        <tr><td style="padding:6px;background:#fdf8f0;font-weight:bold;">Address</td><td style="padding:6px;background:#fdf8f0;">${safeAddress}</td></tr>
      </table>

      <h3 style="color:#C9972A;">Items Ordered</h3>
      <ul style="padding-left:18px;color:#333;">${itemsHtml}</ul>

      <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;" />
      <p style="font-size:12px;color:#888;">Log into the Admin Dashboard to manage this order.</p>
    </div>`;
}

function buildCustomerHtml(order, itemsHtml) {
  const safeOrderNumber = escapeHtml(order.orderNumber);
  const safeCustomerName = escapeHtml(order.customerName);
  const safeAddress = `${escapeHtml(order.address)}, ${escapeHtml(order.city)}, ${escapeHtml(order.state)} — ${escapeHtml(order.pincode)}`;
  const { itemsTotal, shippingCost, totalAmount, discountAmount } = getOrderPricingBreakdown(order);

  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:10px;">
      <h2 style="color:#4A1521;margin-top:0;">🪷 Thank you for your order!</h2>
      <p style="color:#555;">Dear <strong>${safeCustomerName}</strong>,</p>
      <p style="color:#555;">Your order has been placed successfully and is being processed. Here's a summary:</p>

      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;background:#fdf8f0;font-weight:bold;width:40%;border-radius:4px;">Order ID</td><td style="padding:8px;font-weight:bold;color:#4A1521;">${safeOrderNumber}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Subtotal</td><td style="padding:8px;">₹${itemsTotal}</td></tr>
        ${discountAmount > 0 ? `<tr><td style="padding:8px;background:#fdf8f0;font-weight:bold;color:#2e7d32;">Special Sale Discount</td><td style="padding:8px;background:#fdf8f0;font-weight:bold;color:#2e7d32;">− ₹${discountAmount}</td></tr>` : ''}
        <tr><td style="padding:8px;font-weight:bold;">Shipping Cost</td><td style="padding:8px;">${shippingCost > 0 ? `₹${shippingCost}` : '—'}</td></tr>
        <tr><td style="padding:8px;background:#fdf8f0;font-weight:bold;color:#4A1521;font-size:15px;">Total Amount</td><td style="padding:8px;background:#fdf8f0;font-weight:bold;color:#4A1521;font-size:15px;">₹${totalAmount}</td></tr>
        <tr><td style="padding:8px;background:#fdf8f0;font-weight:bold;">Delivery To</td><td style="padding:8px;background:#fdf8f0;">${safeAddress}</td></tr>
      </table>

      <h3 style="color:#C9972A;">Items Ordered</h3>
      <ul style="padding-left:18px;color:#333;">${itemsHtml}</ul>

      <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;" />
      <p style="font-size:14px;color:#555;">If you have any questions, feel free to reply to this email or contact us on WhatsApp.</p>
      <p style="font-size:14px;color:#4A1521;font-weight:bold;margin-top:10px;">Jai Shri Krishna · Radhe Radhe 🙏</p>
      <p style="font-size:12px;color:#aaa;margin-top:16px;">© The Braj Madhuri</p>
    </div>`;
}

// ─── Build HTML helpers for Contact / Inquiries ──────────────────────────────
function buildContactAdminHtml({ name, email, phone, subject, message }) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message);

  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:10px;">
      <h2 style="color:#4A1521;margin-top:0;">📩 New Website Inquiry</h2>
      <p style="color:#555;">A new message was submitted on <strong>The Braj Madhuri</strong> contact form.</p>

      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;background:#fdf8f0;font-weight:bold;width:30%;border-radius:4px;">Sender Name</td><td style="padding:8px;">${safeName}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Email Address</td><td style="padding:8px;"><a href="mailto:${safeEmail}" style="color:#4A1521;text-decoration:none;">${safeEmail}</a></td></tr>
        <tr><td style="padding:8px;background:#fdf8f0;font-weight:bold;">Phone Number</td><td style="padding:8px;">${safePhone || "Not provided"}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Subject</td><td style="padding:8px;">${safeSubject || "General Inquiry"}</td></tr>
      </table>

      <h3 style="color:#C9972A;">Message Content</h3>
      <div style="padding:16px;background:#f9f9f9;border-left:4px solid #C9972A;white-space:pre-wrap;color:#333;font-size:14px;line-height:1.6;">${safeMessage}</div>

      <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;" />
      <p style="font-size:12px;color:#888;">You can reply directly to this email or send a response to ${safeEmail}.</p>
    </div>`;
}

function buildContactCustomerHtml({ name, subject, message }) {
  const safeName = escapeHtml(name);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message);

  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:10px;">
      <h2 style="color:#4A1521;margin-top:0;">🪷 We've received your message</h2>
      <p style="color:#555;">Dear <strong>${safeName}</strong>,</p>
      <p style="color:#555;">Thank you for reaching out to <strong>The Braj Madhuri</strong>. We have received your message regarding <em>"${safeSubject || "General Inquiry"}"</em> and our team will respond as quickly as possible.</p>

      <h4 style="color:#C9972A;margin-bottom:6px;">Copy of your message:</h4>
      <div style="padding:12px;background:#fdf8f0;border-radius:6px;white-space:pre-wrap;color:#444;font-size:13px;line-height:1.5;">${safeMessage}</div>

      <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;" />
      <p style="font-size:14px;color:#4A1521;font-weight:bold;margin-top:10px;">Jai Shri Krishna · Radhe Radhe 🙏</p>
      <p style="font-size:12px;color:#aaa;margin-top:16px;">© The Braj Madhuri</p>
    </div>`;
}

// ─── Main Exports ─────────────────────────────────────────────────────────────
export const sendOrderEmail = async (order) => {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn("[Email] No EMAIL_USER or EMAIL_PASS in .env — skipping email send.");
    return { success: false, skipped: true };
  }

  const itemsHtml = buildItemsHtml(order);
  const adminEmail = process.env.EMAIL_USER?.trim();
  const customerEmail = order.email?.trim();

  // Send admin notification & customer confirmation concurrently
  const [adminRes, customerRes] = await Promise.allSettled([
    withRetry(
      () =>
        getTransporter().sendMail({
          from: `"The Braj Madhuri" <${adminEmail}>`,
          to: adminEmail,
          subject: `🛍️ New Order [${order.orderNumber}]`,
          html: buildAdminHtml(order, itemsHtml),
        }),
      3,
      1000
    ).then(() => {
      console.log(`[Email] ✅ Admin order email sent for ${order.orderNumber}`);
      return { ok: true };
    }).catch((err) => {
      console.error(`[Email] ❌ Admin order email FAILED for ${order.orderNumber}:`, err.message);
      return { ok: false, error: err.message };
    }),

    customerEmail
      ? withRetry(
          () =>
            getTransporter().sendMail({
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
        })
      : Promise.resolve({ ok: true, skipped: true }),
  ]);

  const adminResult = adminRes.status === 'fulfilled' ? adminRes.value : { ok: false, error: adminRes.reason };
  const customerResult = customerRes.status === 'fulfilled' ? customerRes.value : { ok: false, error: customerRes.reason };

  return {
    success: adminResult.ok,
    admin: adminResult,
    customer: customerResult,
  };
};

export const sendContactEmail = async ({ name, email, phone, subject, message }) => {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn("[Email] No EMAIL_USER or EMAIL_PASS in .env — skipping contact email send.");
    return { success: false, skipped: true, error: "Email credentials not configured on server." };
  }

  const adminEmail = process.env.EMAIL_USER?.trim();
  const customerEmail = email?.trim();

  // 1. Send inquiry notification to admin
  const adminResult = await withRetry(
    () =>
      getTransporter().sendMail({
        from: `"The Braj Madhuri Inquiries" <${adminEmail}>`,
        to: adminEmail,
        replyTo: customerEmail ? `"${name.replace(/[\r\n"]/g, '')}" <${customerEmail}>` : adminEmail,
        subject: `📩 Contact Inquiry: ${subject || "Website Message"} [from ${name}]`,
        html: buildContactAdminHtml({ name, email, phone, subject, message }),
      }),
    3,
    1000
  ).then(() => {
    console.log(`[Email] ✅ Admin contact email sent for message from ${name} (${email})`);
    return { ok: true };
  }).catch((err) => {
    console.error(`[Email] ❌ Admin contact email FAILED:`, err.message);
    return { ok: false, error: err.message };
  });

  // 2. Send receipt auto-reply to customer
  let customerResult = { ok: true, skipped: true };
  if (customerEmail) {
    customerResult = await withRetry(
      () =>
        getTransporter().sendMail({
          from: `"The Braj Madhuri" <${adminEmail}>`,
          to: customerEmail,
          subject: `We've received your message — The Braj Madhuri`,
          html: buildContactCustomerHtml({ name, subject, message }),
        }),
      3,
      1000
    ).then(() => {
      console.log(`[Email] ✅ Customer receipt sent to ${customerEmail}`);
      return { ok: true };
    }).catch((err) => {
      console.error(`[Email] ❌ Customer receipt FAILED to ${customerEmail}:`, err.message);
      return { ok: false, error: err.message };
    });
  }

  return {
    success: adminResult.ok,
    admin: adminResult,
    customer: customerResult,
  };
};

