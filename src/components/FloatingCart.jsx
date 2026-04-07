import React from "react";

const FloatingCart = ({ cartCount }) => {
  return (
    <button className="float-cart" title="View Cart">
      🛒
      <span className="float-cart-badge">{cartCount}</span>
    </button>
  );
};

export default FloatingCart;
