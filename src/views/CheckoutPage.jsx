"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useCart } from "../context/CartContext.jsx";
import { calculateShippingFee, isDelhiNCR } from "../utils/shippingRules.js";
import CheckoutHeader from "../components/CheckoutHeader.jsx";
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
  const { data: session } = useSession();
  const { cartItems, cartCount, cartTotal, emptyCart } = useCart();
  
  // Prevent hydration flash before client-side cart is loaded
  const [isMounted, setIsMounted] = useState(false);

  // Accordion Step State: 1 = Address, 2 = Order Summary, 3 = Payment
  const [currentStep, setCurrentStep] = useState(1);

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
  const [lastPaymentId, setLastPaymentId] = useState(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [showMobileBreakdown, setShowMobileBreakdown] = useState(false);

  const [globalSettings, setGlobalSettings] = useState(null);

  useEffect(() => {
    setIsMounted(true);

    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d.success) setGlobalSettings(d.settings);
      })
      .catch(e => {
        console.error("Failed to load settings:", e);
      });

    // Try prefilling from localStorage or session
    try {
      const saved = localStorage.getItem("bm_saved_address");
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } else if (session?.user) {
        const nameParts = (session.user.name || "").split(" ");
        setFormData(prev => ({
          ...prev,
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: session.user.email || "",
        }));
      }
    } catch (e) {
      console.error("Failed to load saved address:", e);
    }

    // Preload Razorpay script on checkout mount
    if (!document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [session]);

  const totalOriginalPrice = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const itemOriginal = item.originalPrice ?? item.price ?? 0;
      return acc + itemOriginal * (item.quantity || 1);
    }, 0);
  }, [cartItems]);

  const baseDiscount = Math.max(0, totalOriginalPrice - cartTotal);
  const specialSaleDiscount = (globalSettings?.isSaleActive && globalSettings?.saleDiscountPercentage > 0)
    ? Math.round(cartTotal * (Number(globalSettings.saleDiscountPercentage) / 100))
    : 0;
  const totalDiscount = baseDiscount + specialSaleDiscount;
  const finalDiscountedCartTotal = Math.max(0, cartTotal - specialSaleDiscount);

  // Derive whether address is Delhi-NCR
  const isNCR = useMemo(() => {
    return isDelhiNCR({
      state: formData.state,
      city: formData.city,
      pincode: formData.pincode,
    });
  }, [formData.state, formData.city, formData.pincode]);

  // Derive shipping cost: ₹79 for Delhi-NCR, ₹119 for Rest of India
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
    if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setFormData(prev => ({ ...prev, phone: digits }));
      return;
    }
    if (name === "pincode") {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      setFormData(prev => ({ ...prev, pincode: digits }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
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

  // ── Validate and Confirm Address Step ──────────────────────────────────────
  const handleConfirmAddress = (e) => {
    if (e) e.preventDefault();
    setError("");

    const cleanFirstName = (formData.firstName || "").trim();
    const cleanLastName = (formData.lastName || "").trim();
    const cleanEmail = (formData.email || "").trim();
    const cleanPhone = (formData.phone || "").replace(/\D/g, "");
    const cleanAddress = (formData.address || "").trim();
    const cleanCity = (formData.city || "").trim();
    const cleanState = (formData.state || "").trim();
    const cleanPincode = (formData.pincode || "").replace(/\D/g, "");

    if (!cleanFirstName || !cleanAddress || !cleanCity || !cleanPincode || !cleanPhone || !cleanEmail || !cleanState) {
      setError("Please fill in all required address fields.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (cleanPincode.length !== 6) {
      setError("Please enter a valid 6-digit pincode.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const sanitizedData = {
      firstName: cleanFirstName,
      lastName: cleanLastName,
      email: cleanEmail,
      phone: cleanPhone,
      address: cleanAddress,
      city: cleanCity,
      state: cleanState,
      pincode: cleanPincode,
    };

    setFormData(sanitizedData);

    // Save to localStorage for convenience
    try {
      localStorage.setItem("bm_saved_address", JSON.stringify(sanitizedData));
    } catch (err) {
      console.error("Failed to save address to localStorage:", err);
    }

    // Proceed to Step 2 (Order Summary)
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Self-service order recovery ─────────────────────────────────────────────
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
      console.error("[RecoverOrder] Error:", err);
      setError("Network error during recovery. Please contact support with your Payment ID: " + lastPaymentId);
    } finally {
      setIsRecovering(false);
    }
  };

  // ── Trigger Razorpay Payment (Step 3) ──────────────────────────────────────
  const handlePaymentSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    
    // Double check validation
    const cleanFirstName = (formData.firstName || "").trim();
    const cleanAddress = (formData.address || "").trim();
    const cleanCity = (formData.city || "").trim();
    const cleanPincode = (formData.pincode || "").replace(/\D/g, "");
    const cleanPhone = (formData.phone || "").replace(/\D/g, "");
    const cleanEmail = (formData.email || "").trim();
    const cleanState = (formData.state || "").trim();

    if (!cleanFirstName || !cleanAddress || !cleanCity || !cleanPincode || !cleanPhone || !cleanEmail || !cleanState) {
      setError("Please fill in all required shipping address fields.");
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    
    setIsSubmitting(true);
    
    const res = await loadRazorpayScript();
    if (!res) {
      setError("Razorpay SDK failed to load. Please check your internet connection.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setIsSubmitting(false);
      return;
    }
    
    try {
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          cartItems, 
          state: cleanState, 
          formData: { ...formData, firstName: cleanFirstName, email: cleanEmail, phone: cleanPhone, address: cleanAddress, city: cleanCity, state: cleanState, pincode: cleanPincode }, 
          expectedTotal: finalTotalAmount 
        }),
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        setError(errData.error || "Failed to create payment order. Please try again.");
        window.scrollTo({ top: 0, behavior: "smooth" });
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
        window.scrollTo({ top: 0, behavior: "smooth" });
        setIsSubmitting(false);
        return;
      }

      const razorpayKey = orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        setError("Payment gateway key is not configured. Please contact support.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        setIsSubmitting(false);
        return;
      }
      
      const options = {
        key: razorpayKey, 
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "The Braj Madhuri",
        description: "Devotional Essentials Order",
        order_id: orderData.order.id,
        handler: async function (response) {
          const capturedPaymentId = response.razorpay_payment_id;
          setLastPaymentId(capturedPaymentId);
          try {
            const verifyRes = await fetch("/api/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                formData: { ...formData, firstName: cleanFirstName, email: cleanEmail, phone: cleanPhone, address: cleanAddress, city: cleanCity, state: cleanState, pincode: cleanPincode },
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
              window.scrollTo({ top: 0, behavior: "smooth" });
              setIsSubmitting(false);
              return;
            }

            const data = await verifyRes.json();
            if (data.success) {
              emptyCart();
              router.push(`/success?orderId=${data.orderNumber}`);
            } else {
              setError(data.error || `Payment verification failed. Your payment was received (ID: ${capturedPaymentId}). Click "Recover My Order" below.`);
              window.scrollTo({ top: 0, behavior: "smooth" });
              setIsSubmitting(false);
            }
          } catch (err) {
            console.error("[Verification Error]:", err);
            setError(`An unexpected error occurred. Your payment was received (ID: ${capturedPaymentId}). Click "Recover My Order" below to confirm your order.`);
            window.scrollTo({ top: 0, behavior: "smooth" });
            setIsSubmitting(false);
          }
        },
        prefill: {
          name: `${cleanFirstName} ${formData.lastName || ""}`.trim(),
          email: cleanEmail,
          contact: cleanPhone,
        },
        theme: {
          color: "#4A1521", 
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
          }
        }
      };
      
      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response){
        const desc = response?.error?.description || response?.error?.reason || response?.error?.message || "Transaction was not completed.";
        setError(`Payment Failed: ${desc}`);
        window.scrollTo({ top: 0, behavior: "smooth" });
        setIsSubmitting(false);
      });

      try {
        rzp1.open();
      } catch (openErr) {
        console.error('[Razorpay] rzp.open() failed:', openErr);
        setError('Could not open payment gateway. Please refresh the page and try again.');
        window.scrollTo({ top: 0, behavior: "smooth" });
        setIsSubmitting(false);
      }
      
    } catch (err) {
      console.error("[Payment Submit Error]:", err);
      setError("An unexpected error occurred while initiating payment. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setIsSubmitting(false);
    }
  };

  // Initial client mount skeleton
  if (!isMounted) {
    return (
      <div className="checkout-page-root">
        <CheckoutHeader activeStep={2} />
        <div className="checkout-wrapper" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "36px", height: "36px", border: "3px solid #E8C96B", borderTopColor: "#4A1521", borderRadius: "50%", animation: "bmSpin 0.8s linear infinite" }} />
          <style>{`@keyframes bmSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (cartCount === 0 && !isSubmitting) {
    return (
      <div className="checkout-wrapper">
        <CheckoutHeader activeStep={1} />
        <div className="checkout-empty-state">
          <h2>Your bag is empty</h2>
          <p>You need items in your cart to proceed with checkout.</p>
          <button 
            type="button"
            className="checkout-return-btn" 
            onClick={() => router.push("/shop")}
          >
            Explore Devotional Collection
          </button>
        </div>
      </div>
    );
  }

  // Header active step: 1 (Bag) -> 2 (Address) -> 3 (Summary) -> 4 (Payment)
  const headerActiveStep = currentStep + 1;

  return (
    <div className="checkout-page-root">
      {/* Flipkart & Amazon Style Dedicated Checkout Header */}
      <CheckoutHeader 
        activeStep={headerActiveStep} 
        onStepClick={(stepIndex) => setCurrentStep(stepIndex)} 
      />

      <div className="checkout-wrapper reveal">
        <div className="checkout-container">
          
          {/* Left Column: Multi-Step Accordion Flow */}
          <div className="checkout-main">
            {error && (
              <div className="checkout-error-banner">
                <div className="checkout-error-icon">⚠️</div>
                <div className="checkout-error-content">
                  <div>{error}</div>
                  {lastPaymentId && (
                    <div className="checkout-recovery-box">
                      <div>Payment Reference: <code>{lastPaymentId}</code></div>
                      <button
                        type="button"
                        onClick={recoverOrder}
                        disabled={isRecovering}
                        className="checkout-recovery-btn"
                      >
                        {isRecovering ? '⏳ Recovering...' : '🔄 Recover My Order'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════ STEP 1: DELIVERY ADDRESS ════ */}
            <div className={`checkout-accordion-card ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <div className="checkout-step-header" onClick={() => currentStep > 1 && setCurrentStep(1)}>
                <div className="checkout-step-title-group">
                  <span className={`checkout-step-badge ${currentStep > 1 ? 'completed' : ''}`}>
                    {currentStep > 1 ? '✓' : '1'}
                  </span>
                  <div className="checkout-step-heading-wrap">
                    <h3>Delivery Address</h3>
                    {currentStep > 1 && (
                      <span className="checkout-step-subtitle">
                        {formData.firstName} {formData.lastName} · {formData.city}, {formData.state} - {formData.pincode}
                      </span>
                    )}
                  </div>
                </div>
                {currentStep > 1 && (
                  <button 
                    type="button" 
                    className="checkout-change-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentStep(1);
                    }}
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Step 1 Active Form */}
              {currentStep === 1 && (
                <div className="checkout-step-content">
                  <form onSubmit={handleConfirmAddress}>
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
                          placeholder="e.g. Rahul"
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
                          placeholder="e.g. Sharma"
                        />
                      </div>
                      <div className="form-group full-width">
                        <label htmlFor="email">Email Address (for order confirmation) *</label>
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
                        <label htmlFor="phone">Mobile Number (10 Digits) *</label>
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
                        <label htmlFor="address">Address (Flat / House No / Building / Street) *</label>
                        <input
                          type="text"
                          id="address"
                          name="address"
                          autoComplete="street-address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="e.g. Flat 302, Radha Krishna Heights, Raman Reti"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="city">City / District *</label>
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
                              {st} {st === 'Delhi' ? '(₹79 NCR Shipping)' : (st === 'Haryana' || st === 'Uttar Pradesh') ? '(₹79 NCR / ₹119 Other)' : '(₹119 Shipping)'}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group full-width">
                        <label htmlFor="pincode">6-Digit Pincode *</label>
                        <input
                          type="text"
                          id="pincode"
                          name="pincode"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          autoComplete="postal-code"
                          placeholder="e.g. 281121"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Dynamic NCR Delivery Tag */}
                    {formData.state && (
                      <div className={`checkout-delivery-zone-badge ${isNCR ? 'ncr' : 'national'}`}>
                        {isNCR ? (
                          <>✨ <strong>Delhi-NCR Express Logistics Zone (₹79 Shipping)</strong></>
                        ) : (
                          <>🚚 <strong>All-India Standard Logistics Zone (₹119 Shipping)</strong></>
                        )}
                      </div>
                    )}

                    <div className="checkout-step-actions">
                      <button type="submit" className="checkout-step-next-btn">
                        Deliver to this Address & Continue ➔
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* ════ STEP 2: ORDER SUMMARY / ITEMS REVIEW ════ */}
            <div className={`checkout-accordion-card ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''} ${currentStep < 2 ? 'disabled' : ''}`}>
              <div className="checkout-step-header" onClick={() => currentStep > 2 && setCurrentStep(2)}>
                <div className="checkout-step-title-group">
                  <span className={`checkout-step-badge ${currentStep > 2 ? 'completed' : ''}`}>
                    {currentStep > 2 ? '✓' : '2'}
                  </span>
                  <div className="checkout-step-heading-wrap">
                    <h3>Order Summary</h3>
                    {currentStep !== 2 && (
                      <span className="checkout-step-subtitle">
                        {cartCount} {cartCount === 1 ? 'item' : 'items'} in your devotional order
                      </span>
                    )}
                  </div>
                </div>
                {currentStep > 2 && (
                  <button 
                    type="button" 
                    className="checkout-change-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentStep(2);
                    }}
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Step 2 Active Item List */}
              {currentStep === 2 && (
                <div className="checkout-step-content">
                  <div className="checkout-review-items">
                    {cartItems.map((item) => (
                      <div key={`${item.id}-${item.size || ''}-${item.color || ''}`} className="checkout-review-item">
                        <div className="checkout-review-img">
                          <Image
                            src={item.image || '/header-banner.jpg'}
                            alt={item.title || 'Devotional item'}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="72px"
                          />
                        </div>
                        <div className="checkout-review-info">
                          <div className="checkout-review-title">{item.title}</div>
                          {(item.size || item.color) && (
                            <div className="checkout-review-meta">
                              {item.size && <span className="review-meta-tag">Size: {item.size}</span>}
                              {item.color && <span className="review-meta-tag">Color: {item.color}</span>}
                            </div>
                          )}
                          <div className="checkout-review-pricing">
                            <span className="review-price">{formatCurrency(item.price ?? 0)}</span>
                            <span className="review-qty">× {item.quantity || 1}</span>
                            <span className="review-total">= {formatCurrency((item.price ?? 0) * (item.quantity || 1))}</span>
                          </div>
                          <div className="checkout-delivery-timeline">
                            🚚 Estimated Delivery: <strong>3–5 Business Days</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="checkout-step-note">
                    📧 Order confirmation and tracking updates will be sent to <strong>{formData.email || 'your email'}</strong>
                  </div>

                  <div className="checkout-step-actions">
                    <button 
                      type="button" 
                      onClick={() => {
                        setCurrentStep(3);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }} 
                      className="checkout-step-next-btn"
                    >
                      Proceed to Payment Options ➔
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ════ STEP 3: PAYMENT OPTIONS ════ */}
            <div className={`checkout-accordion-card ${currentStep === 3 ? 'active' : ''} ${currentStep < 3 ? 'disabled' : ''}`}>
              <div className="checkout-step-header">
                <div className="checkout-step-title-group">
                  <span className="checkout-step-badge">3</span>
                  <div className="checkout-step-heading-wrap">
                    <h3>Payment Options</h3>
                    {currentStep === 3 && (
                      <span className="checkout-step-subtitle">
                        100% Safe & Secure Online Payment (Razorpay)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 3 Active Payment Form */}
              {currentStep === 3 && (
                <div className="checkout-step-content">
                  <div className="checkout-payment-card selected">
                    <div className="payment-card-header">
                      <div className="payment-card-icon">🔒</div>
                      <div className="payment-card-details">
                        <div className="payment-card-title">Razorpay Secure Online Checkout</div>
                        <div className="payment-card-desc">
                          UPI (Google Pay, PhonePe, Paytm, BHIM), Cards (Visa, Mastercard, RuPay), NetBanking & Wallets
                        </div>
                      </div>
                      <div className="payment-secure-tag">100% SECURE</div>
                    </div>

                    <div className="payment-supported-strip">
                      <span>UPI</span>
                      <span>•</span>
                      <span>Google Pay</span>
                      <span>•</span>
                      <span>PhonePe</span>
                      <span>•</span>
                      <span>Paytm</span>
                      <span>•</span>
                      <span>Cards & NetBanking</span>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={handlePaymentSubmit} 
                    className="checkout-complete-btn" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="btn-spinner-content">
                        <span className="btn-spinner" /> Processing Payment...
                      </span>
                    ) : (
                      <span>🔒 Complete Order & Pay {formatCurrency(finalTotalAmount)}</span>
                    )}
                  </button>

                  <div className="checkout-guarantee-note">
                    🛡️ Your transaction is encrypted with 256-bit SSL encryption. We never store card details.
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Synchronized Price Details Card */}
          <div className="checkout-summary">
            <div className="checkout-summary-card">
              <div className="checkout-summary-header">
                <h3>Price Details ({cartCount} {cartCount === 1 ? 'Item' : 'Items'})</h3>
              </div>
              <div className="checkout-summary-body">
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
                  <div>
                    <span>Delivery Charges</span>
                    {shippingCost > 0 && isNCR && (
                      <div className="summary-sub-tag">✨ Delhi-NCR Logistics Rate</div>
                    )}
                  </div>
                  <span>
                    {shippingCost > 0 ? (
                      formatCurrency(shippingCost)
                    ) : (
                      <span className="summary-delivery-note">Enter address</span>
                    )}
                  </span>
                </div>
                
                <div className="summary-divider" />

                <div className="summary-total">
                  <span>Total Payable</span>
                  <span className="summary-total-price">{formatCurrency(finalTotalAmount)}</span>
                </div>

                {totalDiscount > 0 && (
                  <div className="checkout-savings-msg">
                    🎉 You are saving {formatCurrency(totalDiscount)} on this order
                  </div>
                )}
              </div>

              {/* Trust badges */}
              <div className="checkout-trust-box">
                <div className="checkout-trust-item">
                  <span>🔒</span>
                  <span>256-bit SSL</span>
                </div>
                <div className="checkout-trust-item">
                  <span>🛡️</span>
                  <span>Razorpay Verified</span>
                </div>
                <div className="checkout-trust-item">
                  <span>🪷</span>
                  <span>100% Authentic</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="checkout-mobile-sticky-bar">
        <div className="checkout-mobile-price-peek" onClick={() => setShowMobileBreakdown(!showMobileBreakdown)}>
          <div className="mobile-total-label">Payable Amount</div>
          <div className="mobile-total-price">
            {formatCurrency(finalTotalAmount)}
            <span className="mobile-view-breakup">View Details ▴</span>
          </div>
        </div>

        {currentStep === 1 && (
          <button 
            type="button" 
            onClick={handleConfirmAddress} 
            className="checkout-mobile-action-btn"
          >
            Deliver Here ➔
          </button>
        )}

        {currentStep === 2 && (
          <button 
            type="button" 
            onClick={() => {
              setCurrentStep(3);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }} 
            className="checkout-mobile-action-btn"
          >
            Continue ➔
          </button>
        )}

        {currentStep === 3 && (
          <button 
            type="button" 
            onClick={handlePaymentSubmit} 
            disabled={isSubmitting}
            className="checkout-mobile-action-btn checkout-mobile-action-btn--pay"
          >
            {isSubmitting ? "Processing..." : `Pay ${formatCurrency(finalTotalAmount)}`}
          </button>
        )}
      </div>

      {/* Mobile Breakdown Modal */}
      {showMobileBreakdown && (
        <div className="checkout-modal-backdrop" onClick={() => setShowMobileBreakdown(false)}>
          <div className="checkout-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="checkout-modal-header">
              <h3>Price Breakdown</h3>
              <button type="button" className="checkout-modal-close" onClick={() => setShowMobileBreakdown(false)}>✕</button>
            </div>
            <div className="checkout-modal-body">
              <div className="summary-row">
                <span>Total MRP ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
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
                <span>{shippingCost > 0 ? formatCurrency(shippingCost) : 'Enter address'}</span>
              </div>
              <div className="summary-divider" />
              <div className="summary-total">
                <span>Total Payable</span>
                <span>{formatCurrency(finalTotalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
