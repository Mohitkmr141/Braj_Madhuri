import React from "react";

const specials = [
  ["Nidhivan Perfume", "INR 120 - INR 200"],
  ["Vrindavan Flower Attar", "INR 150 - INR 450"],
  ["Kunj Galiyan Perfume", "INR 250"],
  ["Brij Raj Attar", "INR 230 - INR 850"],
];

const FeaturedBanner = () => {
  return (
    <section className="featured-banner">
      <div className="featured-inner">
        <div className="featured-text">
          <span className="section-eyebrow">Vrindavan Specials</span>
          <h2 className="section-title">
            Sacred <em>Scents</em> of Braj
          </h2>
          <p className="featured-desc">
            Experience gentle devotional fragrances inspired by Vrindavan's
            lanes, ghats, temples, and daily seva traditions.
          </p>
          <a href="#collections" className="btn-primary">
            Explore Specials
          </a>
        </div>
        <div className="featured-products">
          {specials.map(([name, price]) => (
            <div className="featured-prod reveal" key={name}>
              <div className="featured-prod-icon" aria-hidden="true">
                *
              </div>
              <div className="featured-prod-name">{name}</div>
              <div className="featured-prod-price">{price}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedBanner;
