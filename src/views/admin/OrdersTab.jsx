"use client";
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    currency: 'INR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);

const formatDate = (isoString) => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const openPdf = (url) => {
  if (url) window.open(url, '_blank');
};

const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '25',
      });
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (statusFilter) params.set('status', statusFilter);
      
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
        setTotalPages(data.pagination.totalPages);
        setTotalOrders(data.pagination.totalOrders);
      } else {
        toast.error(data.error || 'Failed to fetch orders.');
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleShiprocketAction = async (orderId, actionName) => {
    setActionLoading(`${orderId}-${actionName}`);
    try {
      const res = await fetch('/api/admin/shiprocket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionName, orderId })
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(`Failed: ${data.error}`);
      } else {
        toast.success('Action successful!');
        if (data.data?.manifest_url) openPdf(data.data.manifest_url);
        if (data.data?.label_url) openPdf(data.data.label_url);
        if (data.data?.invoice_url) openPdf(data.data.invoice_url);
        fetchOrders();
      }
    } catch {
      toast.error('Network error processing Shiprocket action.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="admin-content-card">
      <div className="admin-card-header">
        <h2 className="admin-card-title">Orders Management</h2>
      </div>
      
      <div className="admin-toolbar">
        <div className="admin-search-container">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by order ID, name, or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        
        <div className="filter-bar">
          {['', 'Pending', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
            <button
              key={s}
              className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="admin-loading-state">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="admin-empty-state">No orders found.</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Shiprocket Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                let items = [];
                try {
                  items = typeof order.cartItems === 'string' ? JSON.parse(order.cartItems) : order.cartItems;
                } catch {
                  items = [];
                }

                return (
                  <tr key={order.id}>
                    <td><span className="awb-badge">{order.orderNumber}</span></td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <div className="font-medium">{order.customerName || 'N/A'}</div>
                      <div className="text-sm text-muted mt-1">
                        {order.address}, {order.city} - {order.pincode}
                      </div>
                    </td>
                    <td>
                      <div>{order.phone || 'N/A'}</div>
                      <div className="text-sm text-muted mt-1">{order.email || 'N/A'}</div>
                    </td>
                    <td>
                      <div className="order-items-list">
                        {items.length > 0 ? items.map((item, index) => (
                          <div key={index} className="order-item-line mb-1">
                            {item.quantity}x {item.title || item.name} {item.size && `(${item.size})`}
                          </div>
                        )) : "No items"}
                      </div>
                    </td>
                    <td className="font-medium">{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <span className={`status-badge ${order.status?.toLowerCase() || 'pending'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      {!order.shiprocketOrderId ? (
                        <div className="text-muted text-sm italic">Not Synced</div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {order.awbCode && (
                            <div className="awb-badge">
                              AWB: {order.awbCode}
                            </div>
                          )}
                          <select 
                            className="action-select"
                            onChange={(e) => {
                              if (e.target.value) {
                                handleShiprocketAction(order.id, e.target.value);
                                e.target.value = "";
                              }
                            }}
                            disabled={!!actionLoading}
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
                            <div className="text-maroon text-xs">Processing...</div>
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
      )}

      {totalPages > 0 && (
        <div className="pagination">
          <button 
            className="pagination-btn" 
            disabled={currentPage <= 1} 
            onClick={() => setCurrentPage(p => p - 1)}
          >
            ← Prev
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages} ({totalOrders} orders)
          </span>
          <button 
            className="pagination-btn" 
            disabled={currentPage >= totalPages} 
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
