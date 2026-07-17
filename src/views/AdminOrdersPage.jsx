"use client";

import React, { useState } from "react";
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

// Open external URL (e.g. PDF)
const openPdf = (url) => {
  if (url) window.open(url, "_blank");
};

export default function AdminOrdersPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("orders");
  const [updatingStock, setUpdatingStock] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const handleShiprocketAction = async (orderId, actionName) => {
    setActionLoading(`${orderId}-${actionName}`);
    try {
      const res = await fetch("/api/admin/shiprocket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionName, orderId })
      });
      const data = await res.json();
      
      if (!data.success) {
        alert(`Failed: ${data.error}`);
      } else {
        alert("Action successful!");
        
        // Handle PDF responses
        if (data.data?.manifest_url) openPdf(data.data.manifest_url);
        if (data.data?.label_url) openPdf(data.data.label_url);
        if (data.data?.invoice_url) openPdf(data.data.invoice_url);
        
        // Refresh orders to get updated AWB if applicable
        fetchOrders();
      }
    } catch (err) {
      alert("Network error processing Shiprocket action.");
    } finally {
      setActionLoading(null);
    }
  };

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

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/inventory");
      const data = await res.json();
      if (data.success) {
        setInventory(data.products);
      } else {
        setError(data.error || "Failed to fetch inventory.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (id, newStock) => {
    const parsedStock = parseInt(newStock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) return;
    
    setUpdatingStock(id);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, stock: parsedStock })
      });
      const data = await res.json();
      if (data.success) {
        setInventory(prev => prev.map(p => p.id === id ? data.product : p));
      } else {
        alert("Failed to update stock: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error updating stock.");
    } finally {
      setUpdatingStock(null);
    }
  };

  // Re-fetch when switching tabs
  React.useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "orders") fetchOrders();
      else fetchInventory();
    }
  }, [activeTab, isAuthenticated]);

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
        
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", marginBottom: "32px" }}>
          <div style={{ flex: "1 1 min-content" }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", color: "var(--maroon)", fontSize: "clamp(24px, 5vw, 32px)", margin: 0, lineHeight: 1.2 }}>
              Admin Dashboard
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "16px" }}>
              <button 
                onClick={() => setActiveTab("orders")}
                style={{ 
                  background: activeTab === "orders" ? "var(--maroon)" : "transparent",
                  color: activeTab === "orders" ? "#fff" : "var(--maroon)",
                  border: "1px solid var(--maroon)",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                Orders
              </button>
              <button 
                onClick={() => setActiveTab("inventory")}
                style={{ 
                  background: activeTab === "inventory" ? "var(--maroon)" : "transparent",
                  color: activeTab === "inventory" ? "#fff" : "var(--maroon)",
                  border: "1px solid var(--maroon)",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                Inventory
              </button>
            </div>
          </div>
          <button onClick={() => { setIsAuthenticated(false); setPassword(""); }} style={{ background: "transparent", border: "1px solid var(--maroon)", color: "var(--maroon)", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
            Logout
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>Loading...</div>
        ) : activeTab === "orders" ? (
          orders.length === 0 ? (
            <div style={{ background: "#fff", padding: "40px", borderRadius: "12px", textAlign: "center", border: "1px dashed rgba(201, 151, 42, 0.5)" }}>
              No orders found.
            </div>
          ) : (
          <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 12px 32px rgba(0,0,0,0.04)", overflow: "hidden", border: "1px solid rgba(0,0,0,0.05)" }}>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "800px" }}>
                <thead>
                  <tr style={{ background: "var(--surface-warm, #fcfaf5)", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Order ID</th>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Date</th>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Customer</th>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Contact</th>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Items</th>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Total</th>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Status</th>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Shiprocket</th>
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
                            Online
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
                        <td style={{ padding: "16px", fontSize: "12px" }}>
                          {!order.shiprocketOrderId ? (
                            <div style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Not Synced</div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {order.awbCode && (
                                <div style={{ background: "#e3f2fd", color: "#1565c0", padding: "4px 8px", borderRadius: "4px", fontWeight: "600", marginBottom: "4px", fontSize: "11px" }}>
                                  AWB: {order.awbCode}
                                </div>
                              )}
                              <select 
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleShiprocketAction(order.id, e.target.value);
                                    e.target.value = "";
                                  }
                                }}
                                disabled={!!actionLoading}
                                style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ddd", background: "#f9f9f9", cursor: "pointer", fontSize: "12px" }}
                              >
                                <option value="">Select Action...</option>
                                <option value="generate_awb">Generate AWB</option>
                                <option value="generate_pickup">Request Pickup</option>
                                <option value="generate_label">Download Label</option>
                                <option value="print_invoice">Download Invoice</option>
                                <option value="generate_manifest">Generate Manifest</option>
                                <option value="print_manifest">Download Manifest</option>
                                {order.awbCode && <option value="track_awb">Track AWB</option>}
                              </select>
                              {actionLoading && actionLoading.startsWith(order.id) && (
                                <div style={{ color: "var(--maroon)", fontSize: "11px" }}>Processing...</div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )) : (
          <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 12px 32px rgba(0,0,0,0.04)", overflow: "hidden", border: "1px solid rgba(0,0,0,0.05)" }}>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "800px" }}>
                <thead>
                  <tr style={{ background: "var(--surface-warm, #fcfaf5)", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Product ID</th>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Name</th>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Price</th>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Current Stock</th>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((product) => (
                    <tr key={product.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                      <td style={{ padding: "16px", fontSize: "13px", color: "#555" }}>
                        {product.id}
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px", fontWeight: "500", color: "var(--maroon)" }}>
                        {product.title}
                        {product.size && <span style={{ fontSize: "12px", color: "#666", marginLeft: "8px" }}>({product.size})</span>}
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px" }}>
                        {formatCurrency(product.price)}
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px", fontWeight: "600" }}>
                        <span style={{ color: product.stock > 0 ? '#2e7d32' : '#d32f2f' }}>
                          {product.stock}
                        </span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <input 
                            type="number" 
                            defaultValue={product.stock}
                            min="0"
                            id={`stock-${product.id}`}
                            style={{ width: "60px", padding: "4px 8px", border: "1px solid #ddd", borderRadius: "4px" }}
                          />
                          <button
                            disabled={updatingStock === product.id}
                            onClick={() => {
                              const input = document.getElementById(`stock-${product.id}`);
                              handleUpdateStock(product.id, input.value);
                            }}
                            style={{ 
                              background: "var(--maroon)", color: "#fff", border: "none", 
                              padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px",
                              opacity: updatingStock === product.id ? 0.6 : 1
                            }}
                          >
                            {updatingStock === product.id ? "Saving..." : "Update"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
