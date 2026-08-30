"use client";

import React from "react";
import Link from "next/link";
import "./CheckoutHeader.css";

export default function CheckoutHeader({ activeStep = 2, onStepClick }) {
  const steps = [
    { id: 1, label: "Bag", href: "/cart" },
    { id: 2, label: "Address", stepKey: 1 },
    { id: 3, label: "Summary", stepKey: 2 },
    { id: 4, label: "Payment", stepKey: 3 },
  ];

  return (
    <header className="checkout-nav-header" role="banner">
      <div className="checkout-nav-container">
        {/* Brand Logo & Back to Cart */}
        <div className="checkout-brand-group">
          <Link href="/cart" className="checkout-back-link" title="Return to Cart">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="checkout-back-text">Back to Cart</span>
          </Link>
          <div className="checkout-brand-divider" />
          <Link href="/" className="checkout-brand-logo">
            <span className="checkout-brand-name">The Braj Madhuri</span>
          </Link>
        </div>

        {/* Stepper Progress */}
        <div className="checkout-stepper-track" aria-label="Checkout Progress">
          {steps.map((step, idx) => {
            const isCompleted = activeStep > step.id;
            const isActive = activeStep === step.id;
            const isClickable = step.href || (onStepClick && isCompleted);

            return (
              <React.Fragment key={step.id}>
                <div
                  className={`checkout-step-node ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""} ${isClickable ? "clickable" : ""}`}
                  onClick={() => {
                    if (step.href) {
                      window.location.href = step.href;
                    } else if (onStepClick && isCompleted && step.stepKey) {
                      onStepClick(step.stepKey);
                    }
                  }}
                >
                  <div className="checkout-step-bubble">
                    {isCompleted ? (
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>
                  <span className="checkout-step-name">{step.label}</span>
                </div>

                {idx < steps.length - 1 && (
                  <div className={`checkout-step-line ${activeStep > step.id ? "filled" : ""}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* 100% Safe Badge */}
        <div className="checkout-trust-badge">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <div className="checkout-trust-text">
            <span className="checkout-trust-title">100% SECURE</span>
            <span className="checkout-trust-sub">Payments</span>
          </div>
        </div>
      </div>
    </header>
  );
}
