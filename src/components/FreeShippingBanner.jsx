import React from "react";
import "./FreeShippingBanner.css";

export default function FreeShippingBanner({ cartTotal }) {
  const threshold = 999;
  const isFreeShipping = cartTotal >= threshold;
  const amountNeeded = threshold - cartTotal;

  if (cartTotal === 0) return null;

  return (
    <div className={`shipping-banner ${isFreeShipping ? "shipping-banner--success" : ""}`}>
      <div className="shipping-banner-icon">
        {isFreeShipping ? (
          <span role="img" aria-label="unlocked" style={{ fontSize: "24px" }}>✅</span>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 10H19C20.1046 10 21 10.8954 21 12V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V12C3 10.8954 3.89543 10 5 10H7V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V10ZM15 10V7C15 5.34315 13.6569 4 12 4C10.3431 4 9 5.34315 9 7V10H15ZM12 17.5C12.8284 17.5 13.5 16.8284 13.5 16C13.5 15.1716 12.8284 14.5 12 14.5C11.1716 14.5 10.5 15.1716 10.5 16C10.5 16.8284 11.1716 17.5 12 17.5Z" fill="var(--saffron, #E8721A)"/>
          </svg>
        )}
      </div>
      <div className="shipping-banner-content">
        {isFreeShipping ? (
          <p>You have unlocked <strong>FREE delivery!</strong></p>
        ) : (
          <p>
            Add items worth <strong className="shipping-banner-amount">₹{amountNeeded} more</strong> <br/>
            to unlock FREE delivery
          </p>
        )}
      </div>
      {!isFreeShipping && (
        <div className="shipping-banner-price-tag">
          ₹{amountNeeded}
        </div>
      )}
    </div>
  );
}
