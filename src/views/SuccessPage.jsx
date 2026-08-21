"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(null);
  
  useEffect(() => {
    const idFromUrl = searchParams?.get("orderId");
    if (idFromUrl) {
      setOrderId(idFromUrl);
    } else {
      setOrderId(null);
    }
  }, [searchParams]);

  return (
    <div style={{
      minHeight: "70vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--cream, #FDFBF7)",
      padding: "40px 20px"
    }}>
      <div className="reveal" style={{
        background: "var(--surface, #ffffff)",
        padding: "50px 40px",
        borderRadius: "16px",
        boxShadow: "0 24px 48px -12px rgba(74, 21, 33, 0.15)",
        textAlign: "center",
        maxWidth: "600px",
        width: "100%",
        border: "1px solid rgba(201, 151, 42, 0.3)"
      }}>
        <div style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "rgba(212, 175, 55, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px"
        }}>
          <svg viewBox="0 0 24 24" width="40" height="40" stroke="var(--gold, #C9972A)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          color: "var(--maroon, #4A1521)",
          fontSize: "36px",
          marginBottom: "16px"
        }}>
          Order Successful!
        </h1>
        
        <p style={{ color: "var(--text-muted, #6B5B53)", fontSize: "16px", lineHeight: "1.6", marginBottom: "24px" }}>
          Thank you for choosing The Braj Madhuri. Your order has been placed successfully and confirmation details have been sent to your email.
        </p>
        
        {orderId ? (
          <div style={{
            background: "#f9f8f6",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "32px",
            border: "1px dashed rgba(201, 151, 42, 0.5)"
          }}>
            <p style={{ margin: "0", fontSize: "14px", color: "var(--text-muted)" }}>Order Reference Number:</p>
            <p style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: "700", color: "var(--maroon)" }}>{orderId}</p>
          </div>
        ) : (
          <div style={{
            background: "#fdf8f0",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "32px",
            border: "1px solid rgba(201, 151, 42, 0.2)",
            color: "var(--text-muted)",
            fontSize: "14px"
          }}>
            Please check your email inbox for your order invoice and tracking updates.
          </div>
        )}
        
        <Link href="/shop" style={{
          display: "inline-block",
          background: "var(--maroon, #4A1521)",
          color: "#fff",
          padding: "16px 40px",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: "600",
          fontFamily: "'Inter', sans-serif",
          boxShadow: "0 8px 24px rgba(74, 21, 33, 0.25)",
          transition: "transform 0.2s, box-shadow 0.2s"
        }}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
