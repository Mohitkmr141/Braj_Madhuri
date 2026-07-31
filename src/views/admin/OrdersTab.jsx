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
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

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
        setSelectedOrders([]); // Clear selection when fetching new page
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

  const handleDeleteSelected = async () => {
    if (selectedOrders.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedOrders.length} order(s)? This action cannot be undone.`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedOrders })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Orders deleted successfully');
        setSelectedOrders([]);
        fetchOrders();
      } else {
        toast.error(`Failed to delete orders: ${data.error}`);
      }
    } catch (err) {
      toast.error('Network error while deleting orders.');
    } finally {
      setIsDeleting(false);
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
          {selectedOrders.length > 0 && (
            <button 
              className="btn btn-primary"
              style={{ backgroundColor: '#dc3545', borderColor: '#dc3545', padding: '6px 12px', fontSize: '14px', marginLeft: 'auto' }}
              onClick={handleDeleteSelected}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : `Delete Selected (${selectedOrders.length})`}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="skeleton-table-wrapper" style={{ marginTop: '24px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-row">
              <div className="skeleton-cell" style={{ flex: '0.5' }}></div>
              <div className="skeleton-cell" style={{ flex: '1' }}></div>
              <div className="skeleton-cell" style={{ flex: '1.5' }}></div>
              <div className="skeleton-cell" style={{ flex: '1' }}></div>
              <div className="skeleton-cell" style={{ flex: '1' }}></div>
              <div className="skeleton-cell" style={{ flex: '0.5' }}></div>
              <div className="skeleton-cell" style={{ flex: '1' }}></div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="admin-empty-state">No orders found.</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox"
                    style={{ cursor: 'pointer' }}
                    checked={orders.length > 0 && selectedOrders.length === orders.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrders(orders.map(o => o.id));
                      } else {
                        setSelectedOrders([]);
                      }
                    }}
                  />
                </th>
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
                    <td>
                      <input 
                        type="checkbox"
                        style={{ cursor: 'pointer' }}
                        checked={selectedOrders.includes(order.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders(prev => [...prev, order.id]);
                          } else {
                            setSelectedOrders(prev => prev.filter(id => id !== order.id));
                          }
                        }}
                      />
                    </td>
                    <td data-label="Order ID"><span className="awb-badge">{order.orderNumber}</span></td>
                    <td data-label="Date">{formatDate(order.createdAt)}</td>
                    <td data-label="Customer">
                      <div className="font-medium">{order.customerName || 'N/A'}</div>
                      <div className="text-sm text-muted mt-1">
                        {order.address}, {order.city} - {order.pincode}
                      </div>
                    </td>
                    <td data-label="Contact">
                      <div>{order.phone || 'N/A'}</div>
                      <div className="text-sm text-muted mt-1">{order.email || 'N/A'}</div>
                    </td>
                    <td data-label="Items">
                      <div className="order-items-list">
                        {items.length > 0 ? items.map((item, index) => (
                          <div key={index} className="order-item-line mb-2">
                            <span className="order-item-qty">{item.quantity}x</span>
                            <span className="order-item-title">{item.title || item.name} {item.size && <span className="product-size">{item.size}</span>}</span>
                          </div>
                        )) : "No items"}
                      </div>
                    </td>
                    <td data-label="Total" className="font-medium">{formatCurrency(order.totalAmount)}</td>
                    <td data-label="Status">
                      <span className={`status-badge ${order.status?.toLowerCase() || 'pending'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td data-label="Actions">
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
