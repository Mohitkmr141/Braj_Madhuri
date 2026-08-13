"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "../context/CartContext.jsx";
import FreeShippingBanner from "../components/FreeShippingBanner.jsx";
import "../components/CartPage.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);

export default function CartPage() {
  const { cartItems, cartCount, cartTotal, updateQuantity, removeFromCart } = useCart();

  const [globalSettings, setGlobalSettings] = useState(null);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.success) setGlobalSettings(d.settings);
    });
  }, []);

  const totalOriginalPrice = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      // If no originalPrice is available, fallback to current price to avoid zero-savings bugs
      const itemOriginal = item.originalPrice || item.price || 250;
      return acc + itemOriginal * item.quantity;
    }, 0);
  }, [cartItems]);

  const baseDiscount = totalOriginalPrice - cartTotal;
  const specialSaleDiscount = globalSettings?.isSaleActive ? Math.round(cartTotal * (globalSettings.saleDiscountPercentage / 100)) : 0;
  const totalDiscount = baseDiscount + specialSaleDiscount;
  const finalTotal = cartTotal - specialSaleDiscount;

  if (cartCount === 0) {
    return (
      <div className="cart-page-wrapper">
        <div className="cart-empty reveal">
          <div className="cart-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
          <h1 className="cart-empty-title">Your Cart is Empty</h1>
          <p className="cart-empty-subtitle">Looks like you haven&apos;t added anything to your cart yet. Discover our premium collections.</p>
          <Link href="/shop" className="cart-empty-btn">
            Explore Collection
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
          <FreeShippingBanner cartTotal={finalTotal} />
          
          <div className="cart-items-list">
            {cartItems.map((item) => {
              const itemKey = `${item.id}-${item.size || 'default'}-${item.color || 'default'}`;
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
                    {item.color && <div className="cart-item-size">Color: {item.color}</div>}
                    
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
                          onClick={() => updateQuantity(item.id, item.size, item.quantity - 1, item.color)}
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
                          onClick={() => updateQuantity(item.id, item.size, item.quantity + 1, item.color)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button 
                        className="cart-remove-btn" 
                        onClick={() => removeFromCart(item.id, item.size, item.color)}
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
              <span>Product Discount</span>
              <span>− {formatCurrency(baseDiscount)}</span>
            </div>
            {specialSaleDiscount > 0 && (
              <div className="summary-row summary-row--green">
                <span>{globalSettings?.saleDiscountPercentage}% Special Sale</span>
                <span>− {formatCurrency(specialSaleDiscount)}</span>
              </div>
            )}
            <div className="summary-row" style={{ fontSize: '14px' }}>
              <span>Delivery Charges</span>
              {cartTotal >= 999 ? (
                <span style={{ color: '#2e7d32', fontWeight: '600' }}>Free</span>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: "'Inter', sans-serif" }}>Calculated at checkout</span>
              )}
            </div>
            
            <div className="summary-divider" />
            
            <div className="summary-total">
              <span>Total Amount</span>
              <span>{formatCurrency(finalTotal)}</span>
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
