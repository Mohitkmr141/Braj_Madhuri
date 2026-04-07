import React from "react";

const Newsletter = () => {
  return (
    <section className="newsletter">
      <span
        className="section-eyebrow"
        style={{ color: "rgba(201,151,42,0.7)" }}
      >
        Stay Blessed
      </span>
      <h2>🪷 Join Our Devotional Community</h2>
      <p>
        Get updates on new arrivals, divine offers, and spiritual insights from
        Vrindavan Mahak
      </p>
      <div className="newsletter-form">
        <input
          type="email"
          className="newsletter-input"
          placeholder="Enter your email address…"
        />
        <button className="newsletter-btn">SUBSCRIBE</button>
      </div>
    </section>
  );
};

export default Newsletter;
