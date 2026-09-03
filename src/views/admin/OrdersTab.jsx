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
    <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden mb-8 ring-1 ring-slate-900/5">
      <div className="p-6 md:px-8 border-b border-slate-200/60 bg-white/50">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Orders Management</h2>
      </div>
      
      <div className="flex flex-wrap justify-between items-center gap-4 p-4 md:px-8 bg-slate-50/50 border-b border-slate-200/60">
        <div className="relative w-full max-w-sm">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:border-[#4A1521] focus:ring-4 focus:ring-[#4A1521]/10 outline-none transition-all shadow-sm placeholder-slate-400"
            placeholder="Search by order ID, Razorpay ID, name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
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
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${statusFilter === tab.key ? 'bg-[#4A1521] text-white border-[#4A1521]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
          {selectedOrders.length > 0 && (
            <button 
              className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg font-semibold hover:bg-red-100 transition-all ml-auto text-sm"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : `Delete Selected (${selectedOrders.length})`}
            </button>
          )}
          <button
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 ${selectedOrders.length > 0 ? 'ml-2' : 'ml-auto'}`}
            onClick={handleCleanup}
            disabled={actionLoading === 'cleanup'}
          >
            {actionLoading === 'cleanup' ? 'Cleaning...' : '🧹 Cleanup Stale'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse flex flex-col gap-4 p-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-10 bg-slate-200 rounded flex-[0.5]"></div>
              <div className="h-10 bg-slate-200 rounded flex-1"></div>
              <div className="h-10 bg-slate-200 rounded flex-[1.5]"></div>
              <div className="h-10 bg-slate-200 rounded flex-1"></div>
              <div className="h-10 bg-slate-200 rounded flex-1"></div>
              <div className="h-10 bg-slate-200 rounded flex-[0.5]"></div>
              <div className="h-10 bg-slate-200 rounded flex-1"></div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="p-8 text-center text-slate-500 font-medium">No orders found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider px-6 py-4 border-b border-slate-200 w-10">
                  <input 
                    type="checkbox"
                    className="cursor-pointer rounded border-slate-300 text-[#4A1521] focus:ring-[#4A1521]"
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
                <th className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider px-6 py-4 border-b border-slate-200">Order ID</th>
                <th className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider px-6 py-4 border-b border-slate-200">Date</th>
                <th className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider px-6 py-4 border-b border-slate-200">Customer</th>
                <th className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider px-6 py-4 border-b border-slate-200">Contact</th>
                <th className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider px-6 py-4 border-b border-slate-200">Items</th>
                <th className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider px-6 py-4 border-b border-slate-200">Total</th>
                <th className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider px-6 py-4 border-b border-slate-200">Status</th>
                <th className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider px-6 py-4 border-b border-slate-200">Shiprocket Actions</th>
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
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 border-b border-slate-100 text-sm text-slate-700">
                      <input 
                        type="checkbox"
                        className="cursor-pointer rounded border-slate-300 text-[#4A1521] focus:ring-[#4A1521]"
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
                    <td className="px-6 py-4 border-b border-slate-100 text-sm text-slate-700">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-900">{order.orderNumber}</span>
                        {order.razorpayPaymentId && (
                          <div className="text-xs text-slate-400 font-mono" title="Razorpay Payment ID">
                            💳 {order.razorpayPaymentId}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 border-b border-slate-100 text-sm text-slate-700">
                      <span className="whitespace-nowrap">{formatDate(order.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4 border-b border-slate-100 text-sm text-slate-700">
                      <div className="font-semibold text-slate-900">{order.customerName || 'N/A'}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {order.address}, {order.city} - {order.pincode}
                      </div>
                    </td>
                    <td className="px-6 py-4 border-b border-slate-100 text-sm text-slate-700">
                      <div className="text-sm font-medium">{order.phone || 'N/A'}</div>
                      <div className="text-xs text-slate-500 mt-1 truncate max-w-[120px]" title={order.email}>{order.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 border-b border-slate-100 text-sm text-slate-700">
                      <div className="flex flex-col gap-1.5">
                        {items.length > 0 ? items.map((item, index) => (
                          <div key={index} className="text-xs bg-slate-50 px-2 py-1 rounded border border-slate-100 flex items-start gap-1">
                            <span className="font-medium text-slate-700 whitespace-nowrap">{item.quantity}×</span>
                            <span className="text-slate-600">
                              {item.title || item.name} 
                              {item.size && <span className="text-slate-400 ml-1">Size: {item.size}</span>}
                              {item.color && <span className="text-slate-400 ml-1">Color: {item.color}</span>}
                            </span>
                          </div>
                        )) : <span className="text-xs text-slate-400 italic">No items</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 border-b border-slate-100 text-sm text-slate-700 font-semibold">
                      <div className="text-slate-900">{formatCurrency(order.totalAmount)}</div>
                      {(() => {
                        const itemsSubtotal = items.reduce((acc, it) => acc + ((parseFloat(it.price) || 0) * (parseInt(it.quantity, 10) || 1)), 0);
                        const shipping = parseFloat(order.shippingCost) || 0;
                        const total = parseFloat(order.totalAmount) || 0;
                        const discount = Math.max(0, Math.round(itemsSubtotal + shipping - total));
                        return (
                          <>
                            {discount > 0 && (
                              <div className="text-xs text-green-600 font-medium">
                                Disc: −{formatCurrency(discount)}
                              </div>
                            )}
                            {shipping > 0 && (
                              <div className="text-xs text-slate-400">
                                +₹{shipping} ship
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 border-b border-slate-100 text-sm text-slate-700">
                      <div className="relative">
                        <select
                          className={`px-3 py-1.5 text-sm font-medium rounded-full border shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A1521]/20 focus:border-[#4A1521] appearance-none pr-8 ${
                            order.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                            order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
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
                          <span className="text-xs text-red-700 font-medium ml-2">Updating...</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 border-b border-slate-100 text-sm text-slate-700">
                      {!order.shiprocketOrderId ? (
                        <div className="flex flex-col gap-2">
                          {order.status === 'Payment_Pending' && order.razorpayOrderId && (
                            <button
                              type="button"
                              className="bg-yellow-600 text-white rounded px-2.5 py-1.5 text-xs font-medium hover:bg-yellow-700 transition-colors w-full"
                              onClick={() => handleForceRecover(order.id, order.razorpayOrderId, order.orderNumber)}
                              disabled={!!actionLoading}
                              title="Verify payment with Razorpay and confirm this order"
                            >
                              {actionLoading === `${order.id}-recover` ? '⏳ Recovering...' : '🔄 Recover Order'}
                            </button>
                          )}
                          <button
                            type="button"
                            className="bg-[#4A1521] text-white px-3 py-1.5 text-sm rounded font-semibold hover:bg-[#3A0F19] transition-all"
                            onClick={() => handleShiprocketAction(order.id, 'sync_order')}
                            disabled={!!actionLoading}
                          >
                            🚀 Sync Shiprocket
                          </button>
                          {actionLoading === `${order.id}-sync_order` && (
                            <span className="text-red-700 text-xs font-medium">Syncing...</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {order.awbCode && (
                            <div className="px-2.5 py-1 rounded-full text-xs font-bold border inline-block bg-slate-100 text-slate-700 border-slate-200 self-start">
                              AWB: {order.awbCode}
                            </div>
                          )}
                          <select 
                            className="px-3 py-1.5 text-sm font-medium rounded border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A1521]/20 appearance-none w-full"
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
                            <div className="text-red-700 text-xs font-medium">Processing...</div>
                          )}
                        </div>
                      )}
                      {order.razorpayPaymentId && (
                        <div className="mt-2">
                          <button
                            type="button"
                            className="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-100 transition-all w-full"
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
        <div className="flex justify-between items-center p-5 border-t border-slate-200 bg-white">
          <button 
            className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={currentPage <= 1} 
            onClick={() => setCurrentPage(p => p - 1)}
          >
            ← Prev
          </button>
          <span className="text-sm font-medium text-slate-600">
            Page {currentPage} of {totalPages} ({totalOrders} orders)
          </span>
          <button 
            className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
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
