"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "../context/CartContext.jsx";
import "../components/CartPage.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    currency: "INR",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
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

  const hasOutOfStockItems = useMemo(() => {
    return cartItems.some((item) => {
      const itemStock = typeof item.maxStock === 'number' ? item.maxStock : (typeof item.stock === 'number' ? item.stock : 9999);
      return itemStock <= 0;
    });
  }, [cartItems]);

  const totalOriginalPrice = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      // If no originalPrice is available, fallback to current price to avoid zero-savings bugs
      const itemOriginal = item.originalPrice ?? item.price ?? 0;
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
          
          <div className="cart-items-list">
            {cartItems.map((item) => {
              const itemKey = `${item.id}-${item.size || 'default'}-${item.color || 'default'}`;
              const itemStock = typeof item.maxStock === 'number' ? item.maxStock : (typeof item.stock === 'number' ? item.stock : 9999);
              const isOutOfStock = itemStock <= 0;
              const isMaxReached = item.quantity >= itemStock && itemStock < 9999;
              const isLowStock = !isMaxReached && itemStock > 0 && itemStock <= 3;

              return (
                <div key={itemKey} className="cart-item-card" style={isOutOfStock ? { opacity: 0.7, background: '#fafafa' } : {}}>
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

                    {isOutOfStock && (
                      <span className="cart-stock-badge cart-stock-badge--soldout">
                        ⚠️ Sold Out — Please Remove
                      </span>
                    )}
                    {isMaxReached && !isOutOfStock && (
                      <span className="cart-stock-badge cart-stock-badge--max">
                        Max Available Stock ({itemStock})
                      </span>
                    )}
                    {isLowStock && (
                      <span className="cart-stock-badge cart-stock-badge--low">
                        Only {itemStock} Left in Stock
                      </span>
                    )}
                    
                    <div className="cart-item-pricing">
                      <span className="cart-item-price">{formatCurrency(item.price ?? 0)}</span>
                      {item.originalPrice && (
                        <span className="cart-item-original">{formatCurrency(item.originalPrice)}</span>
                      )}
                      {item.originalPrice && item.price && item.originalPrice > item.price && (
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
                          className={`qty-btn ${isMaxReached || isOutOfStock ? 'qty-btn--disabled' : ''}`}
                          onClick={() => updateQuantity(item.id, item.size, item.quantity + 1, item.color)}
                          disabled={isMaxReached || isOutOfStock}
                          aria-label="Increase quantity"
                          title={isMaxReached ? `Maximum quantity of ${itemStock} reached` : 'Increase quantity'}
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
            {hasOutOfStockItems && (
              <div className="cart-alert-warning">
                <span>⚠️ One or more items are out of stock. Please remove them to place your order.</span>
              </div>
            )}

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
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: "'Inter', sans-serif" }}>Calculated at checkout</span>
            </div>
            
            <div className="summary-divider" />
            
            <div className="summary-total">
              <span>Total Amount</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
            
            {hasOutOfStockItems ? (
              <button 
                type="button" 
                disabled 
                className="place-order-btn place-order-btn--disabled" 
                style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: '16px' }}
              >
                Remove Sold Out Items to Checkout
              </button>
            ) : (
              <Link href="/checkout" className="place-order-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                Place Order
              </Link>
            )}
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
