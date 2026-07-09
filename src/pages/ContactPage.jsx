import React from "react";

const contactMethods = [
  {
    title: "WhatsApp",
    description:
      "Reach out to us directly for product questions and order help.",
    actionLabel: "+91 84489 04455",
    href: "https://wa.me/918448904455", // Uses a direct WhatsApp link
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
    href: null, // No link needed for hours
  },
];

function ContactPage() {
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

        <div className="contact-grid">
          {contactMethods.map((method) => (
            <article className="contact-card reveal" key={method.title}>
              <h3>{method.title}</h3>
              <p>{method.description}</p>

              {/* Conditionally render a link or standard text depending on if an href exists */}
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
      </section>
    </main>
  );
}

export default ContactPage;
