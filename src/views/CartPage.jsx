"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { cartItems, cartCount, cartTotal, updateQuantity, removeFromCart } = useCart();

  const [globalSettings, setGlobalSettings] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showPriceDetailsModal, setShowPriceDetailsModal] = useState(false);

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
      const itemOriginal = item.originalPrice ?? item.price ?? 0;
      return acc + itemOriginal * item.quantity;
    }, 0);
  }, [cartItems]);

  const baseDiscount = totalOriginalPrice - cartTotal;
  const specialSaleDiscount = globalSettings?.isSaleActive ? Math.round(cartTotal * (globalSettings.saleDiscountPercentage / 100)) : 0;
  const totalDiscount = baseDiscount + specialSaleDiscount;
  const finalTotal = cartTotal - specialSaleDiscount;

  const handleProceedToCheckout = (e) => {
    if (e) e.preventDefault();
    if (hasOutOfStockItems || isTransitioning) return;
    setIsTransitioning(true);
    router.push("/checkout");
  };

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
          <p className="cart-empty-subtitle">Looks like you haven&apos;t added anything to your cart yet. Discover our premium devotional collections.</p>
          <Link href="/shop" className="cart-empty-btn">
            Explore Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-wrapper">
      {/* Flipkart & Amazon style Progress Stepper */}
      <div className="cart-progress-header">
        <div className="cart-progress-track">
          <div className="cart-step-node active">
            <div className="cart-step-bubble">1</div>
            <span className="cart-step-name">My Bag</span>
          </div>
          <div className="cart-step-line" />
          <div className="cart-step-node">
            <div className="cart-step-bubble">2</div>
            <span className="cart-step-name">Address</span>
          </div>
          <div className="cart-step-line" />
          <div className="cart-step-node">
            <div className="cart-step-bubble">3</div>
            <span className="cart-step-name">Payment</span>
          </div>
        </div>
      </div>

      <div className="cart-page-container reveal">
        {/* Left Column: Cart Items */}
        <div className="cart-items-section">
          <div className="cart-header">
            <div className="cart-header-title-group">
              <h1>Shopping Bag</h1>
              <span className="cart-header-count">{cartCount} {cartCount === 1 ? 'item' : 'items'}</span>
            </div>
            <div className="cart-header-trust">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>100% Genuine Products</span>
            </div>
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
                    {(item.size || item.color) && (
                      <div className="cart-item-variants">
                        {item.size && <span className="cart-item-size">Size: {item.size}</span>}
                        {item.color && <span className="cart-item-size">Color: {item.color}</span>}
                      </div>
                    )}

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
                      {item.originalPrice && item.originalPrice > (item.price ?? 0) && (
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

        {/* Right Column: Synchronized Price Details */}
        <div className="cart-summary-section">
          <div className="cart-summary-card">
            <div className="cart-summary-header">
              <h2>Price Details ({cartCount} {cartCount === 1 ? 'Item' : 'Items'})</h2>
            </div>
            <div className="cart-summary-body">
              {hasOutOfStockItems && (
                <div className="cart-alert-warning">
                  <span>⚠️</span>
                  <span>One or more items are out of stock. Please remove them to place your order.</span>
                </div>
              )}

              <div className="summary-row">
                <span>Total MRP</span>
                <span>{formatCurrency(totalOriginalPrice)}</span>
              </div>
              
              {baseDiscount > 0 && (
                <div className="summary-row summary-row--green">
                  <span>Discount on MRP</span>
                  <span>− {formatCurrency(baseDiscount)}</span>
                </div>
              )}

              {specialSaleDiscount > 0 && (
                <div className="summary-row summary-row--green">
                  <span>Special Sale ({globalSettings?.saleDiscountPercentage}%)</span>
                  <span>− {formatCurrency(specialSaleDiscount)}</span>
                </div>
              )}

              <div className="summary-row">
                <span>Delivery Fee</span>
                <span className="summary-delivery-note">Calculated at Address</span>
              </div>
              
              <div className="summary-divider" />
              
              <div className="summary-total">
                <span>Total Amount</span>
                <span className="summary-total-price">{formatCurrency(finalTotal)}</span>
              </div>
              
              {hasOutOfStockItems ? (
                <button 
                  type="button" 
                  disabled 
                  className="place-order-btn place-order-btn--disabled" 
                >
                  Remove Sold Out Items
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={handleProceedToCheckout} 
                  className={`place-order-btn ${isTransitioning ? 'place-order-btn--loading' : ''}`}
                  disabled={isTransitioning}
                >
                  {isTransitioning ? (
                    <span className="btn-spinner-content">
                      <span className="btn-spinner" /> Proceeding to Checkout...
                    </span>
                  ) : (
                    <span>Proceed to Buy ➔</span>
                  )}
                </button>
              )}
            </div>

            {totalDiscount > 0 && (
              <div className="cart-savings-msg">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l2 2 4-4" />
                </svg>
                <span>You will save {formatCurrency(totalDiscount)} on this order</span>
              </div>
            )}

            <div className="cart-trust-strip">
              <div className="cart-trust-item">
                <span className="trust-icon">🛡️</span>
                <span>Safe Payments</span>
              </div>
              <div className="cart-trust-item">
                <span className="trust-icon">🚚</span>
                <span>Fast Shipping</span>
              </div>
              <div className="cart-trust-item">
                <span className="trust-icon">🪷</span>
                <span>Original Braj</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar (Flipkart / Amazon style) */}
      <div className="cart-mobile-sticky-bar">
        <div className="cart-mobile-price-peek" onClick={() => setShowPriceDetailsModal(!showPriceDetailsModal)}>
          <div className="mobile-total-label">Total Amount</div>
          <div className="mobile-total-price">
            {formatCurrency(finalTotal)}
            <span className="mobile-view-breakup">View Details ▴</span>
          </div>
        </div>

        {hasOutOfStockItems ? (
          <button 
            type="button" 
            disabled 
            className="cart-mobile-checkout-btn cart-mobile-checkout-btn--disabled"
          >
            Remove Sold Out Items
          </button>
        ) : (
          <button 
            type="button" 
            onClick={handleProceedToCheckout} 
            disabled={isTransitioning}
            className="cart-mobile-checkout-btn"
          >
            {isTransitioning ? "Proceeding..." : "Proceed to Buy ➔"}
          </button>
        )}
      </div>

      {/* Mobile Price Details Bottom Sheet */}
      {showPriceDetailsModal && (
        <div className="cart-modal-backdrop" onClick={() => setShowPriceDetailsModal(false)}>
          <div className="cart-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="cart-modal-header">
              <h3>Price Breakdown</h3>
              <button className="cart-modal-close" onClick={() => setShowPriceDetailsModal(false)}>✕</button>
            </div>
            <div className="cart-modal-body">
              <div className="summary-row">
                <span>Total MRP ({cartCount} items)</span>
                <span>{formatCurrency(totalOriginalPrice)}</span>
              </div>
              {baseDiscount > 0 && (
                <div className="summary-row summary-row--green">
                  <span>Product Discount</span>
                  <span>− {formatCurrency(baseDiscount)}</span>
                </div>
              )}
              {specialSaleDiscount > 0 && (
                <div className="summary-row summary-row--green">
                  <span>Special Sale</span>
                  <span>− {formatCurrency(specialSaleDiscount)}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Delivery Charges</span>
                <span style={{ color: '#7a4f28', fontStyle: 'italic' }}>Calculated at Address</span>
              </div>
              <div className="summary-divider" />
              <div className="summary-total">
                <span>Final Total</span>
                <span>{formatCurrency(finalTotal)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="cart-modal-savings">
                  🎉 Total Savings: {formatCurrency(totalDiscount)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

