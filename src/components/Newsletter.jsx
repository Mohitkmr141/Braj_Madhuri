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
      <h2>Join Our Devotional Community</h2>
      <p>
        Get updates on new arrivals, divine offers, and spiritual insights from
        The Braj Madhuri.
      </p>
      <form
        className="newsletter-form"
        action="mailto:brajmadhuriofficial@gmail.com"
        method="post"
        encType="text/plain"
      >
        <input
          type="email"
          name="email"
          className="newsletter-input"
          placeholder="Enter your email address..."
          autoComplete="email"
          required
        />
        <button className="newsletter-btn" type="submit">
          Subscribe
        </button>
      </form>
    </section>
  );
};

export default Newsletter;
