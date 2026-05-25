import React, { useState } from "react";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setStatus("Please enter an email address before subscribing.");
      return;
    }

    const subject = encodeURIComponent(
      "Newsletter subscription request - The Braj Madhuri",
    );
    const body = encodeURIComponent(
      `Please add this email address to your devotional community updates list:\n\n${trimmedEmail}`,
    );

    window.location.href = `mailto:brajmadhuriofficial@gmail.com?subject=${subject}&body=${body}`;
    setStatus("Your email app should open with a subscription request.");
    setEmail("");
  };

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
      <form className="newsletter-form" onSubmit={handleSubmit}>
        <label className="visually-hidden" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          className="newsletter-input"
          placeholder="Enter your email address..."
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status) {
              setStatus("");
            }
          }}
          required
        />
        <button className="newsletter-btn" type="submit">
          Subscribe
        </button>
      </form>
      {status && (
        <p className="newsletter-status" aria-live="polite">
          {status}
        </p>
      )}
    </section>
  );
};

export default Newsletter;
