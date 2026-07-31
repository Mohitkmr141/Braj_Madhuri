"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "../context/WishlistContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import "./WishlistPage.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);

export default function WishlistPage() {
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToCart = (item) => {
    addToCart(item);
    removeFromWishlist(item.id, item.size);
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="wishlist-wrapper">
        <div className="wishlist-empty-state reveal">
          <div className="wishlist-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
          <h2 className="wishlist-empty-title">Your Wishlist is Empty</h2>
          <p className="wishlist-empty-subtitle">Explore our premium collections and add your favourite pieces here.</p>
          <Link href="/shop" className="wishlist-shop-btn">
            Explore Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-wrapper reveal">
      <div className="wishlist-header">
        <h1>My Wishlist</h1>
        <p>{wishlistItems.length} item{wishlistItems.length > 1 ? "s" : ""}</p>
      </div>

      <div className="wishlist-grid">
        {wishlistItems.map((item, idx) => (
          <div key={`${item.id}-${item.size}-${idx}`} className="wishlist-card">
            <button
              className="wishlist-remove-btn"
              onClick={() => removeFromWishlist(item.id, item.size)}
              aria-label="Remove from wishlist"
            >
              &times;
            </button>
            <div className="wishlist-img-box">
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 600px) 100vw, 300px"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="wishlist-info">
              <h3 className="wishlist-title">{item.title}</h3>
              <p className="wishlist-price">
                {formatCurrency(item.price)}
                {item.originalPrice && (
                  <span className="wishlist-original-price">
                    {formatCurrency(item.originalPrice)}
                  </span>
                )}
              </p>
              {item.size && (
                <p className="wishlist-meta">Size: {item.size}</p>
              )}
              {item.color && (
                <p className="wishlist-meta">Color: {item.color}</p>
              )}
              <button
                className="wishlist-move-to-cart-btn"
                onClick={() => handleMoveToCart(item)}
              >
                Move to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
