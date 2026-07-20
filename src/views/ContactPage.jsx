import React, { useState } from "react";

const contactMethods = [
  {
    title: "WhatsApp",
    description:
      "Reach out to us directly for product questions and order help.",
    actionLabel: "+91 84489 04455",
    href: "https://wa.me/918448904455",
  },
  {
    title: "Email",
    description: "Share your enquiry, wishlist, or bulk order requirement.",
    actionLabel: "brajmadhuriofficial@gmail.com",
    href: "mailto:brajmadhuriofficial@gmail.com",
  },
  {
    title: "Customer Support Hours",
    description:
      "We strive to respond to all inquiries as quickly as possible.",
    actionLabel: "Mon – Sun | 10:00 AM – 8:00 PM (IST)",
    href: null,
  },
  {
    title: "Instagram",
    description: "Follow us for new arrivals, divine offers, and spiritual insights.",
    actionLabel: "@brajmadhuri.official",
    href: "https://www.instagram.com/brajmadhuri.official",
  },
];

function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });
  const [status, setStatus] = useState({ submitting: false, success: false, error: null });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ submitting: true, success: false, error: null });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send message.");
      }

      setStatus({ submitting: false, success: true, error: null });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "General Inquiry",
        message: "",
      });
    } catch (err) {
      setStatus({ submitting: false, success: false, error: err.message });
    }
  };

  return (
    <main className="page-shell">
      <section className="page-hero page-hero--contact">
        <div className="page-hero__content reveal">
          <span className="section-eyebrow">Contact</span>
          <h1 className="page-hero__title">
            We’re here to help with seva essentials.
          </h1>
          <p className="page-hero__body">
            We would be delighted to assist you with any questions regarding our
            products, orders, shipping, or devotional requirements.
            <br />
            <br />
            Whether you are looking for a specific item from Braj Dham, need
            help choosing the right seva essentials, or have a query about an
            existing order, feel free to reach out to us. We are always happy to
            serve devotees and help bring the blessings of Braj Dham to your
            home.
          </p>
        </div>
      </section>

      <section className="contact-section">
        <div className="section-header">
          <span className="section-eyebrow">Get In Touch</span>
          <h2 className="section-title">Connect with The Braj Madhuri</h2>
          <div className="section-divider" />
        </div>

        <div className="contact-container">
          {/* Quick Info Grid */}
          <div className="contact-grid">
            {contactMethods.map((method) => (
              <article className="contact-card reveal" key={method.title}>
                <h3>{method.title}</h3>
                <p>{method.description}</p>

                {method.href ? (
                  <a
                    className="contact-card__link"
                    href={method.href}
                    target={
                      method.href.startsWith("https") ? "_blank" : undefined
                    }
                    rel={
                      method.href.startsWith("https") ? "noreferrer" : undefined
                    }
                  >
                    {method.actionLabel}
                  </a>
                ) : (
                  <span
                    className="contact-card__link"
                    style={{ display: "inline-block", fontWeight: 600 }}
                  >
                    {method.actionLabel}
                  </span>
                )}
              </article>
            ))}
          </div>

          {/* Contact & Inquiry Form */}
          <div className="contact-form-wrapper reveal">
            <div className="contact-form-card">
              <div className="contact-form-card__header">
                <span className="contact-form-badge">🪷 Direct Inquiry</span>
                <h2>Send Us a Message</h2>
                <p>Have a question or request? Fill out the form below to reach us directly.</p>
              </div>

              {status.success ? (
                <div className="contact-status-alert contact-status-alert--success">
                  <div className="contact-status-icon">✨</div>
                  <div>
                    <h4>Message Sent Successfully!</h4>
                    <p>Thank you for contacting us. A confirmation email has been sent to your address, and our team will get back to you shortly.</p>
                    <button
                      className="contact-btn contact-btn--outline"
                      onClick={() => setStatus((prev) => ({ ...prev, success: false }))}
                      style={{ marginTop: "12px" }}
                    >
                      Send Another Message
                    </button>
                  </div>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                  {status.error && (
                    <div className="contact-status-alert contact-status-alert--error">
                      ⚠️ {status.error}
                    </div>
                  )}

                  <div className="contact-form-row">
                    <div className="contact-field">
                      <label htmlFor="name">Your Name <span className="required-star">*</span></label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        placeholder="e.g. Radhika Sharma"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="contact-field">
                      <label htmlFor="email">Email Address <span className="required-star">*</span></label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        placeholder="e.g. radhika@example.com"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="contact-form-row">
                    <div className="contact-field">
                      <label htmlFor="phone">Phone Number (Optional)</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="contact-field">
                      <label htmlFor="subject">Topic / Subject</label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                      >
                        <option value="General Inquiry">General Inquiry</option>
                        <option value="Order Status & Delivery">Order Status & Delivery</option>
                        <option value="Bulk Order & Wishlist">Bulk Order / Special Request</option>
                        <option value="Product Seva Guidance">Product Seva Guidance</option>
                      </select>
                    </div>
                  </div>

                  <div className="contact-field">
                    <label htmlFor="message">Message <span className="required-star">*</span></label>
                    <textarea
                      id="message"
                      name="message"
                      rows="5"
                      required
                      placeholder="Write your query or message here…"
                      value={formData.message}
                      onChange={handleChange}
                    />
                  </div>

                  <button
                    type="submit"
                    className="contact-submit-btn"
                    disabled={status.submitting}
                  >
                    {status.submitting ? (
                      <>
                        <span className="contact-spinner" /> Sending Message…
                      </>
                    ) : (
                      <>Send Message 🪷</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ContactPage;

