import React from "react";
import Link from "next/link";

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
          <Link className="btn-primary" href="/shop">
            Shop Collection
          </Link>
          <Link className="btn-outline" href="/about">
            Our Story
          </Link>
        </div>
      </div>


    </section>
  );
}

export default Hero;
