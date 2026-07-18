"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "../context/CartContext.jsx";
import "../components/Checkout.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);

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
  const [shippingCost, setShippingCost] = useState(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalOriginalPrice = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const itemOriginal = item.originalPrice || item.price || 250;
      return acc + itemOriginal * item.quantity;
    }, 0);
  }, [cartItems]);

  const totalDiscount = totalOriginalPrice - cartTotal;
  const finalTotalAmount = cartTotal + shippingCost;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-calculate shipping cost on state change
    if (name === "state") {
      if (value === "Delhi") {
        setShippingCost(79);
      } else if (value) {
        setShippingCost(119);
      } else {
        setShippingCost(0);
      }
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
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
    
    // Simple Validation
    if (!formData.firstName || !formData.address || !formData.city || !formData.pincode || !formData.phone) {
      setError("Please fill in all required fields.");
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
        body: JSON.stringify({ amount: finalTotalAmount }),
      });
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
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
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
          
          {error && <div className="error-message">{error}</div>}

          {/* Shipping Address */}
          <div className="checkout-section">
            <h2>Shipping Address</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} />
              </div>
              <div className="form-group full-width">
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} />
              </div>
              <div className="form-group full-width">
                <label htmlFor="phone">Phone Number *</label>
                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required />
              </div>
              <div className="form-group full-width">
                <label htmlFor="address">Address (House No, Building, Street) *</label>
                <input type="text" id="address" name="address" value={formData.address} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input type="text" id="city" name="city" value={formData.city} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="state">State *</label>
                <select id="state" name="state" value={formData.state} onChange={handleInputChange} required>
                  <option value="">Select State</option>
                  <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Assam">Assam</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Chandigarh">Chandigarh</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Goa">Goa</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Himachal Pradesh">Himachal Pradesh</option>
                  <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Ladakh">Ladakh</option>
                  <option value="Lakshadweep">Lakshadweep</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Puducherry">Puducherry</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                  <option value="West Bengal">West Bengal</option>
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="pincode">Pincode *</label>
                <input type="text" id="pincode" name="pincode" value={formData.pincode} onChange={handleInputChange} required />
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
                <span>Discount</span>
                <span>− {formatCurrency(totalDiscount)}</span>
              </div>
              <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                <span>Delivery Charges</span>
                <span>{shippingCost > 0 ? formatCurrency(shippingCost) : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '14px' }}>Select state to calculate</span>}</span>
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
