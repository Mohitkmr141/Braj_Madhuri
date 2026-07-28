"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("orders");
  const [actionLoading, setActionLoading] = useState(null);
  const [catImageUploading, setCatImageUploading] = useState(null);
  const [catImageRemoving, setCatImageRemoving] = useState(null);
  
  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCategorySaving, setIsCategorySaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ title: "", description: "" });

  // Subcategory Modal State
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [isSubcategorySaving, setIsSubcategorySaving] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [subcategoryForm, setSubcategoryForm] = useState({ title: "", description: "", categoryId: "" });

  // Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    title: "", categoryId: "", subcategoryId: "", price: "", originalPrice: "", stock: "10", imageUrl: "", description: "", size: "", subheading: ""
  });

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
    } catch {
      alert("Network error processing Shiprocket action.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setIsCategorySaving(true);
    try {
      const url = "/api/admin/categories";
      const method = editingCategory ? "PUT" : "POST";
      const body = { ...categoryForm };
      if (editingCategory) body.id = editingCategory.id;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to create category");
      } else {
        alert(editingCategory ? "Category updated successfully!" : "Category created successfully!");
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
        setCategoryForm({ title: "", description: "" });
        fetchInventory();
      }
    } catch (err) {
      alert("Network error creating category.");
    } finally {
      setIsCategorySaving(false);
    }
  };

  const handleSaveSubcategory = async (e) => {
    e.preventDefault();
    setIsSubcategorySaving(true);
    try {
      const url = "/api/admin/subcategories";
      const method = editingSubcategory ? "PUT" : "POST";
      const body = { ...subcategoryForm };
      if (editingSubcategory) body.id = editingSubcategory.id;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to create subcategory");
      } else {
        alert(editingSubcategory ? "Subcategory updated successfully!" : "Subcategory created successfully!");
        setIsSubcategoryModalOpen(false);
        setEditingSubcategory(null);
        setSubcategoryForm({ title: "", description: "", categoryId: "" });
        fetchInventory(); // refresh categories and subcategories
      }
    } catch (err) {
      alert("Network error creating subcategory.");
    } finally {
      setIsSubcategorySaving(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
      } else {
        setError(data.error || "Incorrect Master Password");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
    setPassword("");
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
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (data.success) {
        setInventory(data.products);
        setCategories(data.categories || []);
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

  const handleOpenProductModal = (product = null) => {
    setEditingProduct(product);
    if (product) {
      setProductForm({
        title: product.title || "",
        categoryId: product.categoryId || "",
        subcategoryId: product.subcategoryId || "",
        price: product.price || "",
        originalPrice: product.originalPrice || "",
        stock: product.stock !== undefined ? String(product.stock) : "10",
        imageUrl: product.imageUrl || "",
        description: product.description || "",
        size: product.size || "",
        subheading: product.subheading || ""
      });
    } else {
      setProductForm({
        title: "", categoryId: "", subcategoryId: "", price: "", originalPrice: "", stock: "10", imageUrl: "", description: "", size: "", subheading: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const url = "/api/admin/products";
      const method = editingProduct ? "PUT" : "POST";
      const body = { ...productForm };
      if (editingProduct) body.id = editingProduct.id;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchInventory(); // Refresh list
      } else {
        alert("Failed to save product: " + data.error);
      }
    } catch {
      alert("Error saving product.");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchInventory(); // Refresh list
      } else {
        alert("Failed to delete product: " + data.error);
      }
    } catch {
      alert("Error deleting product.");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("WARNING: Are you sure you want to delete this category? This will permanently delete ALL subcategories and products inside it!")) return;
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchInventory(); 
      } else {
        alert("Failed to delete category: " + data.error);
      }
    } catch {
      alert("Error deleting category.");
    }
  };

  const handleDeleteSubcategory = async (id) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) return;
    try {
      const res = await fetch(`/api/admin/subcategories?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchInventory(); 
      } else {
        alert("Failed to delete subcategory: " + data.error);
      }
    } catch {
      alert("Error deleting subcategory.");
    }
  };



  // Upload a dedicated thumbnail for a category
  const handleCategoryImageUpload = async (categoryId, file) => {
    if (!file) return;
    setCatImageUploading(categoryId);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('categoryId', categoryId);
      const res = await fetch('/api/admin/category-image', { method: 'PUT', body: fd });
      const data = await res.json();
      if (data.success) { fetchInventory(); }
      else { alert('Upload failed: ' + data.error); }
    } catch { alert('Error uploading image.'); }
    finally { setCatImageUploading(null); }
  };

  // Remove the dedicated thumbnail for a category
  const handleCategoryImageRemove = async (categoryId) => {
    if (!confirm('Remove this category thumbnail? It will fall back to the first product image.')) return;
    setCatImageRemoving(categoryId);
    try {
      const res = await fetch('/api/admin/category-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId }),
      });
      const data = await res.json();
      if (data.success) { fetchInventory(); }
      else { alert('Remove failed: ' + data.error); }
    } catch { alert('Error removing image.'); }
    finally { setCatImageRemoving(null); }
  };

  // Re-fetch when switching tabs
  useEffect(() => {
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
                Products
              </button>
              <button 
                onClick={() => setActiveTab("categories")}
                style={{ 
                  background: activeTab === "categories" ? "var(--maroon)" : "transparent",
                  color: activeTab === "categories" ? "#fff" : "var(--maroon)",
                  border: "1px solid var(--maroon)",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                Categories
              </button>
              <button 
                onClick={() => setActiveTab("categoryImages")}
                style={{ 
                  background: activeTab === "categoryImages" ? "var(--maroon)" : "transparent",
                  color: activeTab === "categoryImages" ? "#fff" : "var(--maroon)",
                  border: "1px solid var(--maroon)",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                🖼️ Category Images
              </button>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: "transparent", border: "1px solid var(--maroon)", color: "var(--maroon)", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
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
                              {item.quantity}x {item.title} {item.size && `(Size: ${item.size})`} {item.color && `[Color: ${item.color}]`}
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
          )
        ) : activeTab === "categories" ? (
          <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 12px 32px rgba(0,0,0,0.04)", overflow: "hidden", border: "1px solid rgba(0,0,0,0.05)", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
              <button 
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryForm({ title: "", description: "" });
                  setIsCategoryModalOpen(true);
                }}
                style={{ background: "#4caf50", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", marginRight: "12px" }}
              >
                + Add New Category
              </button>
              <button 
                onClick={() => {
                  setEditingSubcategory(null);
                  setSubcategoryForm({ title: "", description: "", categoryId: "" });
                  setIsSubcategoryModalOpen(true);
                }}
                style={{ background: "#2196f3", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
              >
                + Add New Subcategory
              </button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {categories.map((category) => (
                <div key={category.id} style={{ border: "1px solid #eee", borderRadius: "8px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #eee", paddingBottom: "12px" }}>
                    <div>
                      <h3 style={{ margin: 0, color: "var(--maroon)", fontSize: "18px" }}>{category.title}</h3>
                      {category.description && <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>{category.description}</p>}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button 
                        onClick={() => {
                          setEditingCategory(category);
                          setCategoryForm({ title: category.title, description: category.description || "" });
                          setIsCategoryModalOpen(true);
                        }}
                        style={{ background: "transparent", color: "var(--maroon)", border: "1px solid var(--maroon)", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(category.id)}
                        style={{ background: "#d32f2f", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                      >
                        Delete Category
                      </button>
                    </div>
                  </div>
                  
                  {category.subcategories && category.subcategories.length > 0 ? (
                    <div style={{ paddingLeft: "20px" }}>
                      <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#555" }}>Subcategories:</h4>
                      <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                        {category.subcategories.map(sub => (
                          <li key={sub.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fcfaf5", padding: "8px 12px", borderRadius: "4px" }}>
                            <span style={{ fontSize: "14px", fontWeight: "500" }}>{sub.title}</span>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button 
                                onClick={() => {
                                  setEditingSubcategory(sub);
                                  setSubcategoryForm({ title: sub.title, description: sub.description || "", categoryId: sub.categoryId });
                                  setIsSubcategoryModalOpen(true);
                                }}
                                style={{ background: "transparent", color: "var(--maroon)", border: "1px solid var(--maroon)", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }}
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteSubcategory(sub.id)}
                                style={{ background: "transparent", color: "#d32f2f", border: "1px solid #d32f2f", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }}
                              >
                                Delete
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div style={{ paddingLeft: "20px", fontSize: "13px", color: "#888", fontStyle: "italic" }}>
                      No subcategories
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 12px 32px rgba(0,0,0,0.04)", overflow: "hidden", border: "1px solid rgba(0,0,0,0.05)", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
              <button 
                onClick={() => handleOpenProductModal()}
                style={{ background: "var(--maroon)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
              >
                + Add New Product
              </button>
            </div>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.05)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "800px" }}>
                <thead>
                  <tr style={{ background: "var(--surface-warm, #fcfaf5)", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Product ID</th>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Name</th>
                    <th style={{ padding: "16px", fontWeight: "600", color: "var(--muted)", fontSize: "14px" }}>Category</th>
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
                      <td style={{ padding: "16px", fontSize: "13px" }}>
                        <div>{product.category?.title || "Unknown"}</div>
                        {product.subcategory?.title && (
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                            ↳ {product.subcategory.title}
                          </div>
                        )}
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
                          <button
                            onClick={() => handleOpenProductModal(product)}
                            style={{ 
                              background: "transparent", color: "var(--maroon)", border: "1px solid var(--maroon)", 
                              padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px"
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            style={{ 
                              background: "#d32f2f", color: "#fff", border: "none", 
                              padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px"
                            }}
                          >
                            Delete
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

        {isModalOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
            <div style={{ background: "#fff", padding: "32px", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ position: "absolute", top: "20px", right: "20px", background: "transparent", border: "none", fontSize: "24px", cursor: "pointer", color: "#555" }}
              >&times;</button>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: "var(--maroon)", marginBottom: "24px" }}>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <form onSubmit={handleSaveProduct} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Title *</label>
                    <input required type="text" value={productForm.title} onChange={e => setProductForm({...productForm, title: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Category *</label>
                    <select required value={productForm.categoryId} onChange={e => setProductForm({...productForm, categoryId: e.target.value, subcategoryId: ""})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", background: "#fff" }}>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                </div>
                
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Subcategory</label>
                    <select 
                      value={productForm.subcategoryId} 
                      onChange={e => setProductForm({...productForm, subcategoryId: e.target.value})} 
                      style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", background: "#fff" }}
                      disabled={!productForm.categoryId}
                    >
                      <option value="">Select Subcategory (Optional)</option>
                      {categories.find(c => c.id === productForm.categoryId)?.subcategories?.map(s => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Price *</label>
                    <input required type="number" step="0.01" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Original Price</label>
                    <input type="number" step="0.01" value={productForm.originalPrice} onChange={e => setProductForm({...productForm, originalPrice: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Stock *</label>
                    <input required type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Product Image</label>
                  {productForm.imageUrl && (
                    <img src={productForm.imageUrl} alt="Preview" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "6px", marginBottom: "8px", border: "1px solid #ddd" }} />
                  )}
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    // Show a temporary loading state if you want, or just wait for the upload
                    e.target.disabled = true;
                    try {
                      const res = await fetch('/api/admin/upload', {
                        method: 'POST',
                        body: formData
                      });
                      const data = await res.json();
                      if (data.success) {
                        setProductForm({...productForm, imageUrl: data.url});
                      } else {
                        alert("Upload failed: " + data.error);
                      }
                    } catch (err) {
                      alert("Error uploading image");
                    } finally {
                      e.target.disabled = false;
                    }
                  }} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
                  <input type="hidden" value={productForm.imageUrl} />
                </div>

                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Subheading</label>
                    <input type="text" value={productForm.subheading} onChange={e => setProductForm({...productForm, subheading: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Size (e.g. 5x7 inches)</label>
                    <input type="text" value={productForm.size} onChange={e => setProductForm({...productForm, size: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Description</label>
                  <textarea rows="4" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontFamily: "inherit" }}></textarea>
                </div>

                <button type="submit" style={{ background: "var(--maroon)", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", marginTop: "16px" }}>
                  {editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </form>
            </div>
          </div>
        )}

        {isCategoryModalOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
            <div style={{ background: "#fff", padding: "32px", borderRadius: "12px", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                style={{ position: "absolute", top: "20px", right: "20px", background: "transparent", border: "none", fontSize: "24px", cursor: "pointer", color: "#555" }}
              >&times;</button>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: "var(--maroon)", marginBottom: "24px" }}>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h2>
              <form onSubmit={handleSaveCategory} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Category Title *</label>
                  <input required type="text" value={categoryForm.title} onChange={e => setCategoryForm({...categoryForm, title: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Description (Optional)</label>
                  <textarea rows="3" value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontFamily: "inherit" }}></textarea>
                </div>
                <button type="submit" disabled={isCategorySaving} style={{ background: "var(--maroon)", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "6px", cursor: isCategorySaving ? "not-allowed" : "pointer", fontWeight: "600", marginTop: "8px", opacity: isCategorySaving ? 0.7 : 1 }}>
                  {isCategorySaving ? "Saving..." : (editingCategory ? "Save Changes" : "Create Category")}
                </button>
              </form>
            </div>
          </div>
        )}

        {isSubcategoryModalOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
            <div style={{ background: "#fff", padding: "32px", borderRadius: "12px", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
              <button 
                onClick={() => setIsSubcategoryModalOpen(false)}
                style={{ position: "absolute", top: "20px", right: "20px", background: "transparent", border: "none", fontSize: "24px", cursor: "pointer", color: "#555" }}
              >&times;</button>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: "var(--maroon)", marginBottom: "24px" }}>
                {editingSubcategory ? "Edit Subcategory" : "Add New Subcategory"}
              </h2>
              <form onSubmit={handleSaveSubcategory} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Parent Category *</label>
                  <select required value={subcategoryForm.categoryId} onChange={e => setSubcategoryForm({...subcategoryForm, categoryId: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", background: "#fff" }}>
                    <option value="">Select Parent Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Subcategory Title *</label>
                  <input required type="text" value={subcategoryForm.title} onChange={e => setSubcategoryForm({...subcategoryForm, title: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Description (Optional)</label>
                  <textarea rows="3" value={subcategoryForm.description} onChange={e => setSubcategoryForm({...subcategoryForm, description: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontFamily: "inherit" }}></textarea>
                </div>
                <button type="submit" disabled={isSubcategorySaving} style={{ background: "var(--maroon)", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "6px", cursor: isSubcategorySaving ? "not-allowed" : "pointer", fontWeight: "600", marginTop: "8px", opacity: isSubcategorySaving ? 0.7 : 1 }}>
                  {isSubcategorySaving ? "Saving..." : (editingSubcategory ? "Save Changes" : "Create Subcategory")}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "categoryImages" && (
          <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 12px 32px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.05)", padding: "28px" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "var(--maroon)", fontSize: "22px", marginBottom: "6px" }}>Category Images</h2>
            <p style={{ color: "#888", fontSize: "14px", marginBottom: "24px" }}>Upload or remove a dedicated thumbnail for each category. This is completely independent of your products.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
              {categories.map(cat => (
                <div key={cat.id} style={{ border: "1px solid rgba(201,151,42,0.3)", borderRadius: "12px", overflow: "hidden", background: "#fdfaf5" }}>
                  <div style={{ width: "100%", height: "180px", background: "#f0ebe0", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {cat.thumbnailUrl
                      ? <img src={cat.thumbnailUrl} alt={cat.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ textAlign: "center", color: "#aaa" }}>
                          <div style={{ fontSize: "36px", marginBottom: "8px" }}>🖼️</div>
                          <div style={{ fontSize: "12px" }}>No dedicated thumbnail</div>
                          <div style={{ fontSize: "11px", color: "#bbb", marginTop: "4px" }}>Using first product image</div>
                        </div>
                    }
                    {cat.thumbnailUrl && (
                      <div style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(76,175,80,0.9)", color: "#fff", fontSize: "11px", padding: "3px 8px", borderRadius: "12px", fontWeight: "600" }}>
                        ✓ Custom
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <p style={{ fontWeight: "700", color: "var(--maroon)", marginBottom: "12px", fontSize: "14px" }}>{cat.title}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ display: "block", textAlign: "center", padding: "9px", background: catImageUploading === cat.id ? "#ccc" : "var(--maroon)", color: "#fff", borderRadius: "6px", cursor: catImageUploading === cat.id ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "13px" }}>
                        {catImageUploading === cat.id ? "Uploading..." : (cat.thumbnailUrl ? "📤 Replace Image" : "📤 Upload Image")}
                        <input type="file" accept="image/*" style={{ display: "none" }} disabled={catImageUploading === cat.id}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleCategoryImageUpload(cat.id, f); e.target.value = ''; }} />
                      </label>
                      {cat.thumbnailUrl && (
                        <button onClick={() => handleCategoryImageRemove(cat.id)} disabled={catImageRemoving === cat.id}
                          style={{ padding: "9px", background: "transparent", color: "#c62828", border: "1px solid #c62828", borderRadius: "6px", cursor: catImageRemoving === cat.id ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "13px" }}>
                          {catImageRemoving === cat.id ? "Removing..." : "🗑️ Remove Image"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
