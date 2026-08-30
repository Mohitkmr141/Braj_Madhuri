"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "../context/CartContext.jsx";
import { calculateShippingFee, isDelhiNCR } from "../utils/shippingRules.js";
import "../components/Checkout.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    currency: "INR",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value);

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, cartCount, cartTotal, emptyCart } = useCart();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  
  const [paymentMethod] = useState("online");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastPaymentId, setLastPaymentId] = useState(null); // Stores Razorpay pay_ ID on failure
  const [isRecovering, setIsRecovering] = useState(false);

  const [globalSettings, setGlobalSettings] = useState(null);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.success) setGlobalSettings(d.settings);
    });

    // Preload Razorpay script on checkout mount to avoid network latency at click
    if (!document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const totalOriginalPrice = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const itemOriginal = item.originalPrice ?? item.price ?? 0;
      return acc + itemOriginal * item.quantity;
    }, 0);
  }, [cartItems]);

  const baseDiscount = totalOriginalPrice - cartTotal;
  const specialSaleDiscount = globalSettings?.isSaleActive ? Math.round(cartTotal * (globalSettings.saleDiscountPercentage / 100)) : 0;
  const finalDiscountedCartTotal = cartTotal - specialSaleDiscount;

  // Derive whether address is Delhi-NCR (Delhi + 14 Haryana districts + 8 UP districts)
  const isNCR = useMemo(() => {
    return isDelhiNCR({
      state: formData.state,
      city: formData.city,
      pincode: formData.pincode,
    });
  }, [formData.state, formData.city, formData.pincode]);

  // Derive shipping cost synchronously — ₹79 for Delhi-NCR, ₹119 for Rest of India
  const shippingCost = useMemo(() => {
    return calculateShippingFee({
      state: formData.state,
      city: formData.city,
      pincode: formData.pincode,
    });
  }, [formData.state, formData.city, formData.pincode]);

  const finalTotalAmount = finalDiscountedCartTotal + shippingCost;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      // If already loaded and available, resolve immediately
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      // If script tag exists but Razorpay not yet on window, wait for its load
      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(true));
        existing.addEventListener('error', () => resolve(false));
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // ── Self-service order recovery ─────────────────────────────────────────────
  // Called when a customer paid but never got a confirmation (browser crash/close)
  const recoverOrder = async () => {
    if (!lastPaymentId) return;
    setIsRecovering(true);
    setError("");
    try {
      const res = await fetch("/api/recover-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razorpayPaymentId: lastPaymentId }),
      });
      const data = await res.json();
      if (data.success) {
        emptyCart();
        router.push(`/success?orderId=${data.orderNumber}`);
      } else {
        setError(data.error || "Could not recover your order. Please contact support with your Payment ID.");
      }
    } catch (err) {
      setError("Network error during recovery. Please contact support with your Payment ID: " + lastPaymentId);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (!formData.firstName || !formData.address || !formData.city || !formData.pincode || !formData.phone || !formData.email || !formData.state) {
      setError("Please fill in all required fields.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Phone validation (10 digits)
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Pincode validation (6 digits)
    const pincodeDigits = formData.pincode.replace(/\D/g, '');
    if (pincodeDigits.length !== 6) {
      setError("Please enter a valid 6-digit pincode.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    
    setIsSubmitting(true);
    
    const res = await loadRazorpayScript();
    if (!res) {
      setError("Razorpay SDK failed to load. Are you online?");
      setIsSubmitting(false);
      return;
    }
    
    try {
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItems, state: formData.state, formData, expectedTotal: finalTotalAmount }),
      });
      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        setError(errData.error || "Failed to create payment order. Please try again.");
        if (errData.priceChanged && errData.updatedCartItems) {
          localStorage.setItem("bm_cart_items", JSON.stringify(errData.updatedCartItems));
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        }
        setIsSubmitting(false);
        return;
      }
      const orderData = await orderRes.json();
      
      if (!orderData.success) {
        setError(orderData.error || "Failed to create order.");
        setIsSubmitting(false);
        return;
      }
      
      const options = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "The Braj Madhuri",
        description: "Online Payment",
        order_id: orderData.order.id,
        handler: async function (response) {
          // Save the payment ID immediately — if anything crashes below,
          // the customer can use this to recover their order
          const capturedPaymentId = response.razorpay_payment_id;
          setLastPaymentId(capturedPaymentId);
          try {
            const verifyRes = await fetch("/api/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                formData,
                cartItems,
                cartTotal: finalTotalAmount,
                shippingCost,
                paymentMethod,
                orderNumber: orderData.orderNumber,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (!verifyRes.ok) {
              const errData = await verifyRes.json().catch(() => ({}));
              setError(errData.error || `Order verification failed. Your payment was received (ID: ${capturedPaymentId}). Click "Recover My Order" below.`);
              setIsSubmitting(false);
              return;
            }
            const data = await verifyRes.json();
            if (data.success) {
              emptyCart();
              router.push(`/success?orderId=${data.orderNumber}`);
            } else {
              setError(data.error || `Payment verification failed. Your payment was received (ID: ${capturedPaymentId}). Click "Recover My Order" below.`);
              setIsSubmitting(false);
            }
          } catch (err) {
            console.error(err);
            setError(`An unexpected error occurred. Your payment was received (ID: ${capturedPaymentId}). Click "Recover My Order" below to confirm your order.`);
            setIsSubmitting(false);
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#c9972a", 
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
          }
        }
      };
      
      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response){
        setError(`Payment Failed: ${response.error.description}`);
        setIsSubmitting(false);
      });
      try {
        rzp1.open();
      } catch (openErr) {
        console.error('[Razorpay] rzp.open() failed:', openErr);
        setError('Could not open payment gateway. Please refresh the page and try again.');
        setIsSubmitting(false);
      }
      
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (cartCount === 0 && !isSubmitting) {
    return (
      <div className="checkout-wrapper">
        <div className="checkout-container" style={{ display: 'block', textAlign: 'center', paddingTop: '100px' }}>
          <h2>Your cart is empty.</h2>
          <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>You need items in your cart to checkout.</p>
          <button 
            className="complete-order-btn" 
            style={{ maxWidth: '300px', margin: '30px auto' }}
            onClick={() => router.push("/shop")}
          >
            Return to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-wrapper reveal">
      <form onSubmit={handleSubmit} className="checkout-container">
        
        {/* Left Column: Forms */}
        <div className="checkout-main">
          <div className="checkout-header">
            <h1>Secure Checkout</h1>
            <p>Your details are protected with 256-bit SSL encryption.</p>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
              {lastPaymentId && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                    Your Payment ID: <strong style={{ fontFamily: 'monospace' }}>{lastPaymentId}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={recoverOrder}
                    disabled={isRecovering}
                    style={{
                      background: '#4A1521',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: isRecovering ? 'not-allowed' : 'pointer',
                      opacity: isRecovering ? 0.7 : 1,
                    }}
                  >
                    {isRecovering ? '⏳ Recovering...' : '🔄 Recover My Order'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Shipping Address */}
          <div className="checkout-section">
            <h2>
              <span className="checkout-section-number">1</span>
              Shipping Address
            </h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  autoComplete="given-name"
                  placeholder="Rahul"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  autoComplete="family-name"
                  placeholder="Sharma"
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="phone">Phone Number (10 Digits) *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="address">Address (House No, Building, Street) *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  autoComplete="street-address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="e.g. 14, Shivaji Nagar, MG Road"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  autoComplete="address-level2"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="e.g. Mathura"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="state">State *</label>
                <select
                  id="state"
                  name="state"
                  autoComplete="address-level1"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select State / UT</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st} {st === 'Delhi' ? '(₹79 Shipping)' : (st === 'Haryana' || st === 'Uttar Pradesh') ? '(₹79 NCR / ₹119 Other)' : '(₹119 Shipping)'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group full-width">
                <label htmlFor="pincode">Pincode *</label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoComplete="postal-code"
                  placeholder="6-digit pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="checkout-section">
            <h2>
              <span className="checkout-section-number">2</span>
              Payment Method
            </h2>
            <div className="payment-options">
              <label className={`payment-option ${paymentMethod === 'online' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="online" 
                  checked={paymentMethod === 'online'} 
                  readOnly 
                />
                <div>
                  <span className="payment-option-label">🔒 Online Payment (Razorpay)</span>
                  <span className="payment-option-desc">Pay securely using UPI, Credit/Debit Card, Wallets, or Netbanking. Your data is 100% safe.</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="checkout-summary">
          <div className="checkout-summary-card">
            <div className="checkout-summary-header">
              <h3>Order Summary ({cartCount} item{cartCount > 1 ? 's' : ''})</h3>
            </div>
            <div className="checkout-summary-body">

              {/* Item list */}
              <div className="checkout-summary-items">
                {cartItems.map((item) => (
                  <div key={`${item.id}-${item.size || ''}-${item.color || ''}`} className="checkout-summary-item">
                    <div className="checkout-summary-item-img">
                      <Image
                        src={item.image || '/header-banner.jpg'}
                        alt={item.title}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="56px"
                      />
                    </div>
                    <div className="checkout-summary-item-info">
                      <div className="checkout-summary-item-title">{item.title}</div>
                      {(item.size || item.color) && (
                        <div className="checkout-summary-item-meta">
                          {item.size && `Size: ${item.size}`}{item.size && item.color ? ' · ' : ''}{item.color && `Color: ${item.color}`} · Qty: {item.quantity}
                        </div>
                      )}
                      {!item.size && !item.color && (
                        <div className="checkout-summary-item-meta">Qty: {item.quantity}</div>
                      )}
                      <div className="checkout-summary-item-price">{formatCurrency((item.price ?? 0) * item.quantity)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="checkout-summary-divider" />

              <div className="checkout-summary-row">
                <span>Items ({cartCount})</span>
                <span>{formatCurrency(totalOriginalPrice)}</span>
              </div>
              <div className="checkout-summary-row checkout-summary-row--green">
                <span>Product Discount</span>
                <span>− {formatCurrency(baseDiscount)}</span>
              </div>
              {specialSaleDiscount > 0 && (
                <div className="checkout-summary-row checkout-summary-row--green">
                  <span>{globalSettings?.saleDiscountPercentage}% Special Sale</span>
                  <span>− {formatCurrency(specialSaleDiscount)}</span>
                </div>
              )}
              <div className="checkout-summary-row">
                <div>
                  <span>Delivery Charges</span>
                  {shippingCost > 0 && isNCR && (
                    <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600', marginTop: '2px' }}>
                      ✨ Delhi-NCR rate (₹79)
                    </div>
                  )}
                </div>
                <span>
                  {shippingCost > 0 ? (
                    formatCurrency(shippingCost)
                  ) : (
                    <span style={{ color: '#9a7c50', fontStyle: 'italic', fontSize: '12px' }}>Enter address</span>
                  )}
                </span>
              </div>
              
              <div className="checkout-summary-total">
                <span>Total Amount</span>
                <span style={{ color: 'var(--maroon, #4a1521)' }}>{formatCurrency(finalTotalAmount)}</span>
              </div>
              
              <button 
                type="submit" 
                className="complete-order-btn" 
                disabled={isSubmitting}
              >
                {isSubmitting ? '⏳ Processing...' : '🔒 Complete Order'}
              </button>
            </div>

            {/* Trust badges */}
            <div className="checkout-trust">
              <div className="checkout-trust-item">🔒 SSL Secure</div>
              <div className="checkout-trust-item">🛡️ Razorpay</div>
              <div className="checkout-trust-item">↩️ Easy Returns</div>
            </div>
          </div>
        </div>
        
      </form>
    </div>
  );
}


