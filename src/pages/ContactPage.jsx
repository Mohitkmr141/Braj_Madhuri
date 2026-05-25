import React from "react";

const contactMethods = [
  {
    title: "Call Us",
    description: "Speak with us directly for product questions and order help.",
    actionLabel: "+91 84489 04455",
    href: "tel:+918448904455",
  },
  {
    title: "Email",
    description: "Share your enquiry, wishlist, or bulk order requirement.",
    actionLabel: "brajmadhuriofficial@gmail.com",
    href: "mailto:brajmadhuriofficial@gmail.com",
  },
  {
    title: "Instagram",
    description: "Browse updates and message us for the latest arrivals.",
    actionLabel: "@brajmadhuri.official",
    href: "https://www.instagram.com/brajmadhuri.official",
  },
];

function ContactPage() {
  return (
    <main className="page-shell">
      <section className="page-hero page-hero--contact">
        <div className="page-hero__content reveal">
          <span className="section-eyebrow">Contact</span>
          <h1 className="page-hero__title">We’re here to help with seva essentials.</h1>
          <p className="page-hero__body">
            Reach out for product guidance, gifting suggestions, devotional
            combos, and order support through the channel that works best for
            you.
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
              <a
                className="contact-card__link"
                href={method.href}
                target={method.href.startsWith("https") ? "_blank" : undefined}
                rel={method.href.startsWith("https") ? "noreferrer" : undefined}
              >
                {method.actionLabel}
              </a>
            </article>
          ))}
        </div>

        <div className="contact-note reveal">
          <h3>Order support made simple</h3>
          <p>
            If you are unsure which items to choose, contact us with your seva
            requirement and we will help you find a suitable collection or combo.
          </p>
        </div>
      </section>
    </main>
  );
}

export default ContactPage;
