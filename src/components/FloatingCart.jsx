import React from "react";
import Link from "next/link";

const FloatingCart = ({ cartCount = 0, cartTotal = 0 }) => {
  return (
    <Link
      className="float-cart"
      href="/shop"
      title="View cart"
      aria-label={
        cartCount > 0
          ? `View cart: ${cartCount} items, INR ${cartTotal.toLocaleString("en-IN")}`
          : "Browse the collection. Your cart is empty."
      }
    >
      {cartCount > 0 ? `INR ${cartTotal.toLocaleString("en-IN")}` : "Cart"}
      {cartCount > 0 && (
        <span className="float-cart-badge" aria-hidden="true">
          {cartCount}
        </span>
      )}
    </Link>
  );
};

export default FloatingCart;
