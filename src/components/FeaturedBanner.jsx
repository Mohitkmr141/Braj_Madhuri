import React from "react";

const FeaturedBanner = () => {
  return (
    <section className="featured-banner">
      <div className="featured-inner">
        <div className="featured-text">
          <span className="section-eyebrow">Vrindavan Specials</span>
          <h2 className="section-title">
            Sacred <em>Scents</em> of the Holy Dham
          </h2>
          <p className="featured-desc">
            Experience the divine aromas that have blessed Vrindavan for
            centuries. Our Vrindavan Special collection captures the essence of
            Nidhivan, Kunj Galiyan, and the sacred ghats — brought to your home
            with devotion.
          </p>
          <a href="#" className="btn-primary">
            EXPLORE VRINDAVAN SPECIALS
          </a>
        </div>
        <div className="featured-products">
          <div className="featured-prod">
            <div className="featured-prod-icon">🌳</div>
            <div className="featured-prod-name">Nidhivan Perfume</div>
            <div className="featured-prod-price">₹120 – ₹200</div>
          </div>
          <div className="featured-prod">
            <div className="featured-prod-icon">🌺</div>
            <div className="featured-prod-name">Vrindavan Flower Attar</div>
            <div className="featured-prod-price">₹150 – ₹450</div>
          </div>
          <div className="featured-prod">
            <div className="featured-prod-icon">🏛️</div>
            <div className="featured-prod-name">Kunj Galiyan Perfume</div>
            <div className="featured-prod-price">₹250</div>
          </div>
          <div className="featured-prod">
            <div className="featured-prod-icon">🌧️</div>
            <div className="featured-prod-name">Brij Raj Attar</div>
            <div className="featured-prod-price">₹230 – ₹850</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedBanner;
