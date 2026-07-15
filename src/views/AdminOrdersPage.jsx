"use client";

import React, { useEffect, useState } from "react";
import "../components/Checkout.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);

const formatDate = (isoString) => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function AdminOrdersPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsAuthenticated(true);
      fetchOrders();
    } else {
      setError("Incorrect Master Password");
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(data.error || "Failed to fetch orders.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cream)" }}>
        <form onSubmit={handleLogin} style={{ background: "#fff", padding: "40px", borderRadius: "12px", boxShadow: "0 12px 32px rgba(0,0,0,0.05)", textAlign: "center", maxWidth: "400px", width: "100%" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: "var(--maroon)", marginBottom: "24px" }}>Admin Access</h2>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <input 
              type="password" 
              placeholder="Enter Master Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{ width: "100%", marginBottom: "16px" }}
            />
          </div>
          <button className="complete-order-btn" type="submit" style={{ marginTop: "0" }}>
            Login to Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh", padding: "40px 24px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: "var(--maroon)", fontSize: "32px", margin: 0 }}>
            Orders Dashboard
          </h1>
          <button onClick={() => { setIsAuthenticated(false); setPassword(""); }} style={{ background: "transparent", border: "1px solid var(--maroon)", color: "var(--maroon)", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
            Logout
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div style={{ background: "#fff", padding: "40px", borderRadius: "12px", textAlign: "center", border: "1px dashed rgba(201, 151, 42, 0.5)" }}>
            No orders found.
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 12px 32px rgba(0,0,0,0.04)", overflow: "hidden", border: "1px solid rgba(0,0,0,0.05)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "var(--surface-warm, #fcfaf5)", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Order ID</th>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Date</th>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Customer</th>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Contact</th>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Items</th>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Total</th>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const items = typeof order.cartItems === 'string' ? JSON.parse(order.cartItems) : order.cartItems;
                    return (
                      <tr key={order.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                        <td style={{ padding: "16px", fontSize: "14px", fontWeight: "500", color: "var(--maroon)" }}>
                          {order.orderNumber}
                        </td>
                        <td style={{ padding: "16px", fontSize: "13px", color: "#555" }}>
                          {formatDate(order.createdAt)}
                        </td>
                        <td style={{ padding: "16px", fontSize: "14px" }}>
                          <div style={{ fontWeight: "500" }}>{order.customerName}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", maxWidth: "150px" }}>
                            {order.address}, {order.city} - {order.pincode}
                          </div>
                        </td>
                        <td style={{ padding: "16px", fontSize: "13px" }}>
                          <div>{order.phone}</div>
                          <div style={{ color: "var(--text-muted)", marginTop: "2px" }}>{order.email || "No email"}</div>
                        </td>
                        <td style={{ padding: "16px", fontSize: "13px" }}>
                          {items && items.length > 0 ? items.map(item => (
                            <div key={`${item.id}-${item.size}`} style={{ marginBottom: "2px" }}>
                              {item.quantity}x {item.title} {item.size && `(${item.size})`}
                            </div>
                          )) : "No items"}
                        </td>
                        <td style={{ padding: "16px", fontSize: "14px", fontWeight: "600", color: "#2e7d32" }}>
                          {formatCurrency(order.totalAmount)}
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "400", marginTop: "2px" }}>
                            {order.paymentMethod === 'cod' ? 'COD' : 'Online'}
                          </div>
                        </td>
                        <td style={{ padding: "16px", fontSize: "13px" }}>
                          <span style={{ 
                            background: order.status === 'Pending' ? '#fff3cd' : '#d1e7dd', 
                            color: order.status === 'Pending' ? '#856404' : '#0f5132',
                            padding: "4px 8px", 
                            borderRadius: "12px", 
                            fontWeight: "500"
                          }}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
