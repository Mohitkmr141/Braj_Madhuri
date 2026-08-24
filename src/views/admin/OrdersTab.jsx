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
      const res = await fetch(`/api/admin/orders?page=${currentPage}&limit=25&search=${searchQuery}&status=${statusFilter}&_t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
        setTotalPages(data.pagination.totalPages);
        setTotalOrders(data.pagination.totalOrders);
        setSelectedOrders(prev => prev.filter(id => data.orders.some(o => o.id === id)));
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

  const handleStatusChange = async (orderId, newStatus) => {
    setActionLoading(`${orderId}-status`);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchOrders();
      } else {
        toast.error(`Failed: ${data.error}`);
      }
    } catch {
      toast.error('Network error updating status.');
    } finally {
      setActionLoading(null);
    }
  };

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
        if (data.data?.track_url) window.open(data.data.track_url, '_blank');
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
        toast.success(data.message || 'Orders deleted successfully!');
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

  const handleCleanup = async () => {
    if (!confirm('This will mark all Payment_Pending orders older than 30 minutes as Payment_Failed and restore their stock. Continue?')) return;
    setActionLoading('cleanup');
    try {
      const res = await fetch('/api/admin/cleanup-pending', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Cleaned ${data.cleaned} stale orders.`);
        fetchOrders();
      } else {
        toast.error(`Cleanup failed: ${data.error}`);
      }
    } catch {
      toast.error('Network error during cleanup.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefund = async (orderId, orderNumber, totalAmount) => {
    if (!confirm(`Issue a full refund of ₹${totalAmount} for order ${orderNumber}? This cannot be undone.`)) return;
    setActionLoading(`${orderId}-refund`);
    try {
      const res = await fetch('/api/admin/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchOrders();
      } else {
        toast.error(`Refund failed: ${data.error}`);
      }
    } catch {
      toast.error('Network error during refund.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleForceRecover = async (orderId, razorpayOrderId, orderNumber) => {
    if (!razorpayOrderId) {
      toast.error('No Razorpay Order ID on this order — cannot auto-recover.');
      return;
    }
    if (!confirm(`Force-recover order ${orderNumber}?\nThis will verify payment with Razorpay, confirm the order, decrement stock, and send the customer a confirmation email.`)) return;
    setActionLoading(`${orderId}-recover`);
    try {
      const res = await fetch('/api/admin/shiprocket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force_recover', orderId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`✅ Order ${orderNumber} recovered and confirmed!`);
        fetchOrders();
      } else {
        toast.error(`Recovery failed: ${data.error}`);
      }
    } catch {
      toast.error('Network error during recovery.');
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
            placeholder="Search by order ID, Razorpay ID, name, or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        
        <div className="filter-bar">
          {[
            { key: '', label: 'All' },
            { key: 'Pending', label: 'Paid / Pending' },
            { key: 'Shipped', label: 'Shipped' },
            { key: 'Delivered', label: 'Delivered' },
            { key: 'Cancelled', label: 'Cancelled' },
            { key: 'Payment_Pending', label: 'Pending Payment' },
          ].map(tab => (
            <button
              key={tab.key}
              className={`filter-chip ${statusFilter === tab.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label}
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
          <button
            className="filter-chip"
            style={{ background: '#fff3cd', borderColor: '#ffc107', color: '#856404', marginLeft: selectedOrders.length > 0 ? '8px' : 'auto' }}
            onClick={handleCleanup}
            disabled={actionLoading === 'cleanup'}
          >
            {actionLoading === 'cleanup' ? 'Cleaning...' : '🧹 Cleanup Stale'}
          </button>
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
                    checked={orders.length > 0 && orders.every(o => selectedOrders.includes(o.id))}
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
                
                if (!Array.isArray(items)) {
                  items = [];
                }

                return (
                  <tr key={order.id}>
                    <td data-label="Select" className="admin-checkbox-cell">
                      <input 
                        type="checkbox"
                        className="admin-checkbox"
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
                    <td data-label="Order ID">
                      <div className="order-id-cell">
                        <span className="awb-badge">{order.orderNumber}</span>
                        {order.razorpayPaymentId && (
                          <div className="text-xs text-muted font-mono" title="Razorpay Payment ID">
                            💳 {order.razorpayPaymentId}
                          </div>
                        )}
                      </div>
                    </td>
                    <td data-label="Date">
                      <span className="order-date-text">{formatDate(order.createdAt)}</span>
                    </td>
                    <td data-label="Customer">
                      <div className="font-semibold text-main">{order.customerName || 'N/A'}</div>
                      <div className="text-xs text-muted mt-1">
                        {order.address}, {order.city} - {order.pincode}
                      </div>
                    </td>
                    <td data-label="Contact">
                      <div className="text-sm font-medium">{order.phone || 'N/A'}</div>
                      <div className="text-xs text-muted mt-1 text-truncate">{order.email || 'N/A'}</div>
                    </td>
                    <td data-label="Items">
                      <div className="order-items-list">
                        {items.length > 0 ? items.map((item, index) => (
                          <div key={index} className="order-item-chip">
                            <span className="order-item-qty">{item.quantity}×</span>
                            <span className="order-item-title">
                              {item.title || item.name} 
                              {item.size && <span className="product-size">Size: {item.size}</span>}
                              {item.color && <span className="product-color">Color: {item.color}</span>}
                            </span>
                          </div>
                        )) : <span className="text-xs text-muted italic">No items</span>}
                      </div>
                    </td>
                    <td data-label="Total" className="font-semibold">
                      <div className="text-main">{formatCurrency(order.totalAmount)}</div>
                      {(() => {
                        const itemsSubtotal = items.reduce((acc, it) => acc + ((parseFloat(it.price) || 0) * (parseInt(it.quantity, 10) || 1)), 0);
                        const shipping = parseFloat(order.shippingCost) || 0;
                        const total = parseFloat(order.totalAmount) || 0;
                        const discount = Math.max(0, Math.round(itemsSubtotal + shipping - total));
                        return (
                          <>
                            {discount > 0 && (
                              <div className="text-xs text-success font-medium">
                                Disc: −{formatCurrency(discount)}
                              </div>
                            )}
                            {shipping > 0 && (
                              <div className="text-xs text-muted">
                                +₹{shipping} ship
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </td>
                    <td data-label="Status">
                      <div className="status-cell-wrapper">
                        <select
                          className={`status-select status-select--${(order.status || 'pending').toLowerCase()}`}
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          disabled={actionLoading === `${order.id}-status`}
                        >
                          <option value="Pending">Paid / Pending</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Payment_Pending">Payment Pending</option>
                          <option value="Payment_Failed">Payment Failed</option>
                        </select>
                        {actionLoading === `${order.id}-status` && (
                          <span className="text-xs text-maroon font-medium">Updating...</span>
                        )}
                      </div>
                    </td>
                    <td data-label="Actions">
                      {!order.shiprocketOrderId ? (
                        <div className="shiprocket-actions-wrapper">
                          {order.status === 'Payment_Pending' && order.razorpayOrderId && (
                            <button
                              type="button"
                              style={{ background: '#856404', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer', width: '100%', marginBottom: '6px' }}
                              onClick={() => handleForceRecover(order.id, order.razorpayOrderId, order.orderNumber)}
                              disabled={!!actionLoading}
                              title="Verify payment with Razorpay and confirm this order"
                            >
                              {actionLoading === `${order.id}-recover` ? '⏳ Recovering...' : '🔄 Recover Order'}
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-primary btn-sm btn-shiprocket-sync"
                            onClick={() => handleShiprocketAction(order.id, 'sync_order')}
                            disabled={!!actionLoading}
                          >
                            🚀 Sync Shiprocket
                          </button>
                          {actionLoading === `${order.id}-sync_order` && (
                            <span className="text-maroon text-xs font-medium">Syncing...</span>
                          )}
                        </div>
                      ) : (
                        <div className="shiprocket-actions-wrapper">
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
                            <option value="">⚙️ Choose Action...</option>
                            <option value="generate_awb">Generate AWB</option>
                            <option value="generate_pickup">Request Pickup</option>
                            <option value="generate_label">Download Label</option>
                            <option value="print_invoice">Download Invoice</option>
                            <option value="generate_manifest">Generate Manifest</option>
                            <option value="print_manifest">Download Manifest</option>
                            {order.awbCode && <option value="track_awb">Track AWB</option>}
                          </select>
                          {actionLoading && actionLoading.startsWith(order.id) && (
                            <div className="text-maroon text-xs font-medium">Processing...</div>
                          )}
                        </div>
                      )}
                      {order.razorpayPaymentId && (
                        <div style={{ marginTop: '6px' }}>
                          <button
                            type="button"
                            style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', width: '100%' }}
                            onClick={() => handleRefund(order.id, order.orderNumber, order.totalAmount)}
                            disabled={!!actionLoading}
                          >
                            {actionLoading === `${order.id}-refund` ? 'Refunding...' : '💸 Refund'}
                          </button>
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
