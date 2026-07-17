"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "../context/CartContext.jsx";
import "../components/CartPage.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);

export default function CartPage() {
  const { cartItems, cartCount, cartTotal, updateQuantity, removeFromCart } = useCart();

  const totalOriginalPrice = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      // If no originalPrice is available, fallback to current price to avoid zero-savings bugs
      const itemOriginal = item.originalPrice || item.price || 250;
      return acc + itemOriginal * item.quantity;
    }, 0);
  }, [cartItems]);

  const totalDiscount = totalOriginalPrice - cartTotal;

  if (cartCount === 0) {
    return (
      <div className="cart-page-wrapper">
        <div className="cart-empty reveal">
          <h1 className="cart-empty-title">Your Cart is Empty</h1>
          <p className="cart-empty-subtitle">Looks like you haven&apos;t added anything to your cart yet.</p>
          <Link href="/shop" className="cart-empty-btn">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-wrapper">
      <div className="cart-page-container reveal">
        {/* Left Column */}
        <div className="cart-items-section">
          <div className="cart-header">
            <h1>My Cart ({cartCount})</h1>
          </div>
          
          <div className="cart-items-list">
            {cartItems.map((item) => {
              const itemKey = `${item.id}-${item.size || 'default'}`;
              return (
                <div key={itemKey} className="cart-item-card">
                  <div className="cart-item-img">
                    <Image
                      src={item.image || "/header-banner.jpg"}
                      alt={item.title}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="120px"
                    />
                  </div>
                  <div className="cart-item-details">
                    <h3 className="cart-item-title">{item.title}</h3>
                    {item.size && <div className="cart-item-size">Size: {item.size}</div>}
                    
                    <div className="cart-item-pricing">
                      <span className="cart-item-price">{formatCurrency(item.price || 250)}</span>
                      {item.originalPrice && (
                        <span className="cart-item-original">{formatCurrency(item.originalPrice)}</span>
                      )}
                      {item.originalPrice && item.price && (
                        <span className="cart-item-discount">
                          {Math.round((1 - item.price / item.originalPrice) * 100)}% Off
                        </span>
                      )}
                    </div>
                    
                    <div className="cart-item-actions">
                      <div className="qty-controls">
                        <button 
                          className="qty-btn" 
                          onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          –
                        </button>
                        <input 
                          type="text" 
                          className="qty-input" 
                          value={item.quantity} 
                          readOnly 
                          aria-label="Quantity" 
                        />
                        <button 
                          className="qty-btn" 
                          onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button 
                        className="cart-remove-btn" 
                        onClick={() => removeFromCart(item.id, item.size)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="cart-summary-section">
          <div className="cart-summary-header">
            <h2>Price Details</h2>
          </div>
          <div className="cart-summary-body">
            <div className="summary-row">
              <span>Price ({cartCount} item{cartCount > 1 ? 's' : ''})</span>
              <span>{formatCurrency(totalOriginalPrice)}</span>
            </div>
            <div className="summary-row summary-row--green">
              <span>Discount</span>
              <span>− {formatCurrency(totalDiscount)}</span>
            </div>
            <div className="summary-row" style={{ fontSize: '14px' }}>
              <span>Delivery Charges</span>
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Calculated at checkout</span>
            </div>
            
            <div className="summary-divider" />
            
            <div className="summary-total">
              <span>Total Amount</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            
            <Link href="/checkout" className="place-order-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Place Order
            </Link>
          </div>
          {totalDiscount > 0 && (
            <div className="cart-savings-msg">
              You will save {formatCurrency(totalDiscount)} on this order
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
