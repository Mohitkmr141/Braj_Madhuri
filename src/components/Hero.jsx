import React from "react";

function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-pattern" aria-hidden="true" />
      <div className="hero-circle-1" aria-hidden="true" />
      <div className="hero-circle-2" aria-hidden="true" />

      <div className="hero-content">
        <span className="hero-badge">From Braj, made for seva</span>
        <h1 className="hero-title">
          The Braj <span>Madhuri</span>
        </h1>
        <p className="hero-subtitle-devanagari">Radhe Radhe</p>
        <p className="hero-desc">
          Devotional essentials, pooja fragrances, poshak, mala, dhoop, and
          daily seva products curated with purity and care.
        </p>
        <div className="hero-ctas">
          <a className="btn-primary" href="#collections">
            Shop Collection
          </a>
          <a className="btn-outline" href="#story">
            Our Story
          </a>
        </div>
      </div>

      <div className="hero-stats" aria-label="Store highlights">
        <div className="stat">
          <span className="stat-num">100+</span>
          <span className="stat-label">Products</span>
        </div>
        <div className="stat">
          <span className="stat-num">4.9</span>
          <span className="stat-label">Rating</span>
        </div>
        <div className="stat">
          <span className="stat-num">India</span>
          <span className="stat-label">Delivery</span>
        </div>
      </div>
    </section>
  );
}

export default Hero;
