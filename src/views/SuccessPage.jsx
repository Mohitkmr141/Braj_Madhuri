"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value || 0);

const formatDate = (isoString) => {
  if (!isoString) return "Just now";
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const idFromUrl = searchParams?.get("orderId");
    if (idFromUrl) {
      setOrderId(idFromUrl);
      fetchOrderDetails(idFromUrl);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const fetchOrderDetails = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
        }
      }
    } catch (err) {
      console.error("Error fetching order receipt:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOrderNumber = () => {
    if (!orderId && !order?.orderNumber) return;
    const textToCopy = order?.orderNumber || orderId;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Compute breakdown
  const cartItems = order?.cartItems || [];
  const itemsSubtotal = cartItems.reduce(
    (acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 1),
    0
  );
  const shippingCost = Number(order?.shippingCost) || 0;
  const totalPaid = Number(order?.totalAmount) || itemsSubtotal + shippingCost;
  const discountAmount = Math.max(0, Math.round(itemsSubtotal + shippingCost - totalPaid));

  return (
    <div className="success-page-wrapper">
      <style jsx>{`
        .success-page-wrapper {
          min-height: 85vh;
          background: var(--cream, #FDFBF7);
          padding: 40px 16px 80px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .success-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid rgba(201, 151, 42, 0.25);
          box-shadow: 0 16px 40px -10px rgba(74, 21, 33, 0.08);
          max-width: 820px;
          width: 100%;
          overflow: hidden;
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .success-header-banner {
          background: linear-gradient(135deg, #4A1521 0%, #2A0910 100%);
          padding: 36px 28px;
          text-align: center;
          color: #ffffff;
          position: relative;
        }

        .success-icon-badge {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(201, 151, 42, 0.2);
          border: 2px solid #C9972A;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
        }

        .success-title {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 700;
          color: #F8E7C9;
          margin: 0 0 8px;
          letter-spacing: 0.5px;
        }

        .success-subtitle {
          color: #E2D5CD;
          font-size: 15px;
          line-height: 1.5;
          max-width: 580px;
          margin: 0 auto;
        }

        .receipt-body {
          padding: 32px;
        }

        .meta-strip {
          background: #FCFAF6;
          border: 1px solid #EFE8DC;
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-label {
          font-size: 12px;
          color: #7A685D;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .meta-value {
          font-size: 15px;
          font-weight: 600;
          color: #4A1521;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .copy-btn {
          background: rgba(74, 21, 33, 0.08);
          border: none;
          color: #4A1521;
          border-radius: 4px;
          padding: 3px 8px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .copy-btn:hover {
          background: #4A1521;
          color: #ffffff;
        }

        .badge-payment {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #E8F5E9;
          color: #2E7D32;
          font-size: 13px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .section-heading {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          color: #4A1521;
          margin: 0 0 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .section-heading::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #EFE8DC;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 28px;
        }

        .items-table th {
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #7A685D;
          padding: 10px 12px;
          background: #FDFBF7;
          border-bottom: 1px solid #EFE8DC;
        }

        .items-table td {
          padding: 14px 12px;
          border-bottom: 1px solid #F2ECE1;
          vertical-align: middle;
        }

        .item-info-cell {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .item-thumbnail {
          width: 52px;
          height: 52px;
          border-radius: 8px;
          object-fit: cover;
          background: #F2ECE1;
          border: 1px solid rgba(201, 151, 42, 0.2);
          flex-shrink: 0;
        }

        .item-title {
          font-weight: 600;
          color: #2A1810;
          font-size: 14px;
          margin-bottom: 4px;
          line-height: 1.4;
        }

        .item-variants {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          font-size: 12px;
          color: #6B5B53;
        }

        .variant-tag {
          background: #F5EFEB;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 28px;
        }

        .info-box {
          background: #FCFAF6;
          border: 1px solid #EFE8DC;
          border-radius: 12px;
          padding: 20px;
        }

        .info-box-title {
          font-size: 14px;
          font-weight: 700;
          color: #4A1521;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .info-box-text {
          font-size: 14px;
          color: #4A3E39;
          line-height: 1.6;
          margin: 0;
        }

        .breakdown-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          color: #554841;
          margin-bottom: 10px;
        }

        .breakdown-row--total {
          border-top: 1px solid #E2D5CD;
          padding-top: 12px;
          margin-top: 12px;
          font-size: 17px;
          font-weight: 700;
          color: #4A1521;
        }

        .breakdown-row--discount {
          color: #2E7D32;
          font-weight: 600;
        }

        .actions-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: space-between;
          align-items: center;
          padding-top: 24px;
          border-top: 1px solid #EFE8DC;
        }

        .btn-primary {
          background: var(--maroon, #4A1521);
          color: #ffffff;
          padding: 14px 28px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(74, 21, 33, 0.2);
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }

        .btn-primary:hover {
          background: #360E17;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: #ffffff;
          color: #4A1521;
          border: 1px solid #C9972A;
          padding: 13px 22px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }

        .btn-secondary:hover {
          background: #FCFAF6;
          border-color: #4A1521;
        }

        .btn-whatsapp {
          background: #25D366;
          color: #ffffff;
          border: none;
          padding: 13px 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          transition: all 0.2s;
        }

        .btn-whatsapp:hover {
          background: #1EBE5D;
        }

        /* Skeleton Loading */
        .skeleton {
          background: linear-gradient(90deg, #f0e9e2 25%, #f8f4f0 50%, #f0e9e2 75%);
          background-size: 200% 100%;
          animation: pulse 1.5s infinite;
          border-radius: 6px;
        }

        @keyframes pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @media (max-width: 640px) {
          .receipt-body {
            padding: 20px 16px;
          }
          .info-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .meta-strip {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .actions-toolbar {
            flex-direction: column;
            width: 100%;
          }
          .actions-toolbar > * {
            width: 100%;
            justify-content: center;
          }
          .items-table th:nth-child(2),
          .items-table td:nth-child(2) {
            display: none;
          }
        }

        /* Print Invoice Styles */
        @media print {
          body {
            background: #ffffff !important;
          }
          .success-page-wrapper {
            padding: 0 !important;
            background: #ffffff !important;
          }
          .success-card {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
          }
          .success-header-banner {
            background: #4A1521 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .actions-toolbar,
          nav,
          footer,
          .copy-btn {
            display: none !important;
          }
        }
      `}</style>

      <div className="success-card">
        {/* Top Header Banner */}
        <div className="success-header-banner">
          <div className="success-icon-badge">
            <svg
              viewBox="0 0 24 24"
              width="36"
              height="36"
              stroke="#C9972A"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1 className="success-title">Order Confirmed!</h1>
          <p className="success-subtitle">
            Radhe Radhe! Thank you for choosing The Braj Madhuri. Your order has been placed
            successfully and confirmation details have been sent to your email.
          </p>
        </div>

        {/* Receipt Content Body */}
        <div className="receipt-body">
          {loading ? (
            <div>
              <div className="skeleton" style={{ height: "60px", marginBottom: "24px" }} />
              <div className="skeleton" style={{ height: "140px", marginBottom: "24px" }} />
              <div className="skeleton" style={{ height: "120px" }} />
            </div>
          ) : order ? (
            <>
              {/* Order Meta Strip */}
              <div className="meta-strip">
                <div className="meta-item">
                  <span className="meta-label">Order Reference</span>
                  <span className="meta-value">
                    {order.orderNumber}
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={handleCopyOrderNumber}
                      title="Copy Order ID"
                    >
                      {copied ? "✓ Copied" : "📋 Copy"}
                    </button>
                  </span>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Date & Time</span>
                  <span className="meta-value">{formatDate(order.createdAt)}</span>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Payment Status</span>
                  <span className="badge-payment">
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Paid Online
                  </span>
                </div>
              </div>

              {/* Items Ordered Table */}
              <div className="section-heading">Items Ordered</div>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ textAlign: "center" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Price</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, idx) => {
                    const itemQty = Number(item.quantity) || 1;
                    const itemPrice = Number(item.price) || 0;
                    const itemImage =
                      item.image ||
                      item.imageUrl ||
                      "/header-banner.jpg";

                    return (
                      <tr key={idx}>
                        <td>
                          <div className="item-info-cell">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={itemImage}
                              alt={item.title || "Product"}
                              className="item-thumbnail"
                              onError={(e) => {
                                e.target.src = "/header-banner.jpg";
                              }}
                            />
                            <div>
                              <div className="item-title">{item.title || "Sacred Item"}</div>
                              {(item.size || item.color) && (
                                <div className="item-variants">
                                  {item.size && (
                                    <span className="variant-tag">Size: {item.size}</span>
                                  )}
                                  {item.color && (
                                    <span className="variant-tag">Color: {item.color}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "600", color: "#4A1521" }}>
                          {itemQty}
                        </td>
                        <td style={{ textAlign: "right", color: "#6B5B53" }}>
                          {formatCurrency(itemPrice)}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: "700", color: "#2A1810" }}>
                          {formatCurrency(itemPrice * itemQty)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Delivery Address & Pricing Breakdown Grid */}
              <div className="info-grid">
                {/* Shipping Address */}
                <div className="info-box">
                  <div className="info-box-title">
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      stroke="#C9972A"
                      strokeWidth="2"
                      fill="none"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Delivery Details
                  </div>
                  <p className="info-box-text">
                    <strong>{order.customerName}</strong>
                    <br />
                    {order.phone && <>📞 {order.phone}<br /></>}
                    {order.email && <>✉️ {order.email}<br /></>}
                    {order.address}
                    <br />
                    {order.city}, {order.state} — {order.pincode}
                  </p>
                  <div
                    style={{
                      marginTop: "12px",
                      fontSize: "12px",
                      color: "#2E7D32",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    📦 Expected delivery within 3–5 business days
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="info-box">
                  <div className="info-box-title">
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      stroke="#C9972A"
                      strokeWidth="2"
                      fill="none"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                    Payment Summary
                  </div>

                  <div className="breakdown-row">
                    <span>Items Subtotal</span>
                    <span>{formatCurrency(itemsSubtotal)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="breakdown-row breakdown-row--discount">
                      <span>Discounts Applied</span>
                      <span>− {formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  <div className="breakdown-row">
                    <span>Delivery Charges</span>
                    <span>{shippingCost > 0 ? formatCurrency(shippingCost) : "Free"}</span>
                  </div>

                  {order.razorpayPaymentId && (
                    <div
                      className="breakdown-row"
                      style={{ fontSize: "11px", color: "#887569", fontFamily: "monospace" }}
                    >
                      <span>Transaction ID</span>
                      <span>{order.razorpayPaymentId}</span>
                    </div>
                  )}

                  <div className="breakdown-row breakdown-row--total">
                    <span>Total Amount Paid</span>
                    <span>{formatCurrency(totalPaid)}</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="actions-toolbar">
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button type="button" onClick={handlePrint} className="btn-secondary">
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                    >
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    Print Receipt
                  </button>

                  <a
                    href={`https://wa.me/919999999999?text=${encodeURIComponent(
                      `Radhe Radhe, I have placed order ${order.orderNumber} on The Braj Madhuri. Could you please share updates?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.073-2.029-.481-1.615-.67-2.658-2.316-2.738-2.426-.08-.109-.652-.868-.652-1.657 0-.789.412-1.178.558-1.336.145-.158.318-.198.423-.198.106 0 .213.001.306.006.098.005.23-.037.36.275.134.32.458 1.118.498 1.2.04.082.067.178.013.285-.054.107-.081.174-.16.268-.08.093-.169.208-.242.279-.081.079-.166.165-.072.327.094.161.417.688.894 1.114.615.548 1.134.718 1.295.798.161.08.256.07.352-.04.095-.11.412-.48.522-.644.109-.164.219-.137.369-.082.15.054.954.45 1.118.532.164.082.273.123.313.191.04.068.04.394-.104.799z" />
                    </svg>
                    WhatsApp Support
                  </a>
                </div>

                <Link href="/shop" className="btn-primary">
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="none"
                  >
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  Continue Shopping
                </Link>
              </div>
            </>
          ) : (
            /* Fallback if order not found in DB */
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              {orderId ? (
                <div
                  style={{
                    background: "#FDFBF7",
                    border: "1px dashed #C9972A",
                    padding: "20px",
                    borderRadius: "8px",
                    marginBottom: "24px",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "14px", color: "#6B5B53" }}>
                    Order Reference Number:
                  </p>
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: "22px",
                      fontWeight: "700",
                      color: "#4A1521",
                    }}
                  >
                    {orderId}
                  </p>
                </div>
              ) : null}

              <p style={{ color: "#6B5B53", fontSize: "15px", lineHeight: "1.6", marginBottom: "28px" }}>
                We have received your order details and a full invoice has been sent to your email.
                If you have any questions or need immediate updates, please contact us.
              </p>

              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/shop" className="btn-primary">
                  Continue Shopping
                </Link>
                <Link href="/contact" className="btn-secondary">
                  Contact Support
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "70vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--cream, #FDFBF7)",
          }}
        >
          <div style={{ color: "#4A1521", fontWeight: "600" }}>Loading order receipt...</div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
