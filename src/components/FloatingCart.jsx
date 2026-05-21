import React from "react";

const FloatingCart = ({ cartCount = 0, cartTotal = 0 }) => {
  return (
    <a
      className="float-cart"
      href="#collections"
      title="View cart"
      aria-label={`View cart: ${cartCount} items, INR ${cartTotal.toLocaleString("en-IN")}`}
    >
      {cartCount > 0 ? `INR ${cartTotal.toLocaleString("en-IN")}` : "Cart"}
      <span className="float-cart-badge">{cartCount}</span>
    </a>
  );
};

export default FloatingCart;
