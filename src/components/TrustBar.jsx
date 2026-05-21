import React from "react";

const TrustBar = () => {
  return (
    <div className="trust-bar">
      <div className="trust-item">
        <span className="trust-icon" aria-hidden="true">
          +
        </span>
        Free Shipping Above INR 199
      </div>
      <div className="trust-item">
        <span className="trust-icon" aria-hidden="true">
          %
        </span>
        100% Natural Products
      </div>
      <div className="trust-item">
        <span className="trust-icon" aria-hidden="true">
          *
        </span>
        Made With Devotion in Vrindavan
      </div>
    </div>
  );
};

export default TrustBar;
