"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "../context/CartContext.jsx";
import FreeShippingBanner from "../components/FreeShippingBanner.jsx";
import "../components/Checkout.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
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
      const itemOriginal = item.originalPrice || item.price || 250;
      return acc + itemOriginal * item.quantity;
    }, 0);
  }, [cartItems]);

  const baseDiscount = totalOriginalPrice - cartTotal;
  const specialSaleDiscount = globalSettings?.isSaleActive ? Math.round(cartTotal * (globalSettings.saleDiscountPercentage / 100)) : 0;
  const totalDiscount = baseDiscount + specialSaleDiscount;
  const finalDiscountedCartTotal = cartTotal - specialSaleDiscount;

  // Derive shipping cost synchronously — no extra render cycle
  const shippingCost = useMemo(() => {
    if (finalDiscountedCartTotal >= 999) return 0;
    const { state } = formData;
    if (state === "Delhi" || state === "Delhi NCR") return 79;
    if (state) return 119;
    return 0;
  }, [formData.state, finalDiscountedCartTotal]);

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
        body: JSON.stringify({ cartItems, state: formData.state, formData }),
      });
      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        setError(errData.error || "Failed to create payment order. Please try again.");
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
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "The Braj Madhuri",
        description: "Online Payment",
        order_id: orderData.order.id,
        handler: async function (response) {
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
              setError(errData.error || "Order verification failed. Please contact support.");
              setIsSubmitting(false);
              return;
            }
            const data = await verifyRes.json();
            if (data.success) {
              emptyCart();
              router.push(`/success?orderId=${data.orderNumber}`);
            } else {
              setError(data.error || "Payment verification failed.");
              setIsSubmitting(false);
            }
          } catch (err) {
            console.error(err);
            setError("An unexpected error occurred during verification.");
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
      rzp1.open();
      
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
            <p>Please enter your shipping and payment details.</p>
          </div>
          
          <FreeShippingBanner cartTotal={finalDiscountedCartTotal} />
          
          {error && <div className="error-message">{error}</div>}

          {/* Shipping Address */}
          <div className="checkout-section">
            <h2>Shipping Address</h2>
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
                  placeholder="e.g. 9876543210"
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
                      {st} {finalDiscountedCartTotal >= 999 ? '(Free Delivery)' : (st === 'Delhi' || st === 'Delhi NCR') ? '(₹79 Shipping)' : '(₹119 Shipping)'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
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
            <h2>Payment Method</h2>
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
                  <span className="payment-option-label">Online Payment</span>
                  <span className="payment-option-desc">Pay securely using UPI, Credit/Debit Card, or Netbanking.</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="checkout-sidebar">
          <div className="checkout-section checkout-summary">
            <h2>Order Summary</h2>
            
            <div className="cart-summary-body">
              <div className="summary-row">
                <span>Items ({cartCount})</span>
                <span>{formatCurrency(totalOriginalPrice)}</span>
              </div>
              <div className="summary-row summary-row--green" style={{ color: '#2e7d32', display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                <span>Product Discount</span>
                <span>− {formatCurrency(baseDiscount)}</span>
              </div>
              {specialSaleDiscount > 0 && (
                <div className="summary-row summary-row--green" style={{ color: '#2e7d32', display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                  <span>{globalSettings?.saleDiscountPercentage}% Special Sale</span>
                  <span>− {formatCurrency(specialSaleDiscount)}</span>
                </div>
              )}
              <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                <span>Delivery Charges</span>
                <span>
                  {finalDiscountedCartTotal >= 999 ? (
                    <span style={{ color: '#2e7d32', fontWeight: '600' }}>Free</span>
                  ) : shippingCost > 0 ? (
                    formatCurrency(shippingCost)
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>Select state to calculate</span>
                  )}
                </span>
              </div>
              
              <div style={{ height: '1px', background: 'rgba(0,0,0,0.1)', margin: '16px 0' }} />
              
              <div className="summary-total" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '18px', color: 'var(--maroon)' }}>
                <span>Total Amount</span>
                <span>{formatCurrency(finalTotalAmount)}</span>
              </div>
              
              <button 
                type="submit" 
                className="complete-order-btn" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Complete Order"}
              </button>
            </div>
          </div>
        </div>
        
      </form>
    </div>
  );
}
