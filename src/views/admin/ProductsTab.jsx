"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { ProductModal, ConfirmDialog } from './AdminModals';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    currency: 'INR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);

export default function ProductsTab() {
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?_t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setInventory(data.products);
        setCategories(data.categories || []);
      } else {
        toast.error(data.error || 'Failed to fetch inventory.');
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleOpenModal = (product = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch('/api/admin/products', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productIds: [id] })
          });
          const data = await res.json();
          if (data.success) {
            toast.success(data.message || 'Product deleted successfully!');
            setSelectedProducts(prev => prev.filter(pId => pId !== id));
            fetchInventory();
          } else {
            toast.error('Failed to delete product: ' + data.error);
          }
        } catch {
          toast.error('Error deleting product.');
        }
      },
    });
  };

  const handleDeleteSelected = () => {
    if (selectedProducts.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Products',
      message: `Are you sure you want to delete ${selectedProducts.length} product(s)? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setIsDeleting(true);
        try {
          const res = await fetch('/api/admin/products', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productIds: selectedProducts })
          });
          const data = await res.json();
          if (data.success) {
            toast.success(data.message || 'Products deleted successfully!');
            setSelectedProducts([]);
            fetchInventory();
          } else {
            toast.error('Failed to delete products: ' + data.error);
          }
        } catch {
          toast.error('Error deleting products.');
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  const [stockFilter, setStockFilter] = useState('all');
  const [editingStockId, setEditingStockId] = useState(null);
  const [tempStockValue, setTempStockValue] = useState('');
  const [expandedVariantId, setExpandedVariantId] = useState(null);
  const [variantDrafts, setVariantDrafts] = useState({});
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  const isProductOutOfStock = useCallback((product) => {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    if (variants.length > 0) {
      const total = variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
      const hasZeroVariant = variants.some(v => (parseInt(v.stock, 10) || 0) <= 0);
      return total <= 0 || hasZeroVariant;
    }
    return (parseInt(product.stock, 10) || 0) <= 0;
  }, []);

  const isProductLowStock = useCallback((product) => {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    if (variants.length > 0) {
      const total = variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
      const hasLowVariant = variants.some(v => {
        const st = parseInt(v.stock, 10) || 0;
        return st > 0 && st <= 3;
      });
      return (total > 0 && total <= 3) || hasLowVariant;
    }
    const st = parseInt(product.stock, 10) || 0;
    return st > 0 && st <= 3;
  }, []);

  const metrics = useMemo(() => {
    const total = inventory.length;
    let outOfStock = 0;
    let lowStock = 0;
    let inStock = 0;

    for (const p of inventory) {
      if (isProductOutOfStock(p)) {
        outOfStock++;
      } else if (isProductLowStock(p)) {
        lowStock++;
      } else {
        inStock++;
      }
    }
    return { total, outOfStock, lowStock, inStock };
  }, [inventory, isProductOutOfStock, isProductLowStock]);

  const handleSaveSimpleStock = async (productId) => {
    const num = parseInt(tempStockValue, 10);
    if (isNaN(num) || num < 0) {
      toast.error('Please enter a valid stock number.');
      return;
    }

    setIsUpdatingStock(true);
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, stock: num })
      });
      const data = await res.json();
      if (data.success) {
        setInventory(prev => prev.map(p => p.id === productId ? { ...p, stock: num } : p));
        toast.success('Stock updated successfully!');
        setEditingStockId(null);
      } else {
        toast.error(data.error || 'Failed to update stock.');
      }
    } catch {
      toast.error('Network error updating stock.');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const handleToggleVariantDrawer = (product) => {
    if (expandedVariantId === product.id) {
      setExpandedVariantId(null);
    } else {
      setExpandedVariantId(product.id);
      setVariantDrafts(prev => ({
        ...prev,
        [product.id]: Array.isArray(product.variants) ? JSON.parse(JSON.stringify(product.variants)) : []
      }));
    }
  };

  const handleVariantDraftChange = (productId, index, field, value) => {
    setVariantDrafts(prev => {
      const current = prev[productId] ? [...prev[productId]] : [];
      if (current[index]) {
        current[index] = { ...current[index], [field]: value };
      }
      return { ...prev, [productId]: current };
    });
  };

  const handleSaveVariantStocks = async (productId) => {
    const drafts = variantDrafts[productId];
    if (!Array.isArray(drafts)) return;

    setIsUpdatingStock(true);
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, variants: drafts })
      });
      const data = await res.json();
      if (data.success) {
        setInventory(prev => prev.map(p => p.id === productId ? { ...p, variants: drafts, stock: drafts.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0) } : p));
        toast.success('Variant stocks updated!');
        setExpandedVariantId(null);
      } else {
        toast.error(data.error || 'Failed to update variant stocks.');
      }
    } catch {
      toast.error('Network error updating variant stocks.');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const filteredInventory = inventory.filter((product) => {
    const q = productSearchQuery.toLowerCase();
    const matchesSearch = (
      (product.title && product.title.toLowerCase().includes(q)) ||
      (product.id && String(product.id).toLowerCase().includes(q)) ||
      (product.category?.title && product.category.title.toLowerCase().includes(q)) ||
      (product.subcategory?.title && product.subcategory.title.toLowerCase().includes(q))
    );
    if (!matchesSearch) return false;

    if (stockFilter === 'out_of_stock') return isProductOutOfStock(product);
    if (stockFilter === 'low_stock') return isProductLowStock(product);
    if (stockFilter === 'in_stock') return !isProductOutOfStock(product) && !isProductLowStock(product);
    return true;
  });

  return (
    <div className="admin-inventory">
      {/* ── Top Metrics Bar ── */}
      <div className="inventory-metrics-bar">
        <div 
          className={`inventory-metric-card ${stockFilter === 'all' ? 'inventory-metric-card--active' : ''}`}
          onClick={() => setStockFilter('all')}
        >
          <span className="metric-label">Total Products</span>
          <span className="metric-value">{metrics.total}</span>
        </div>
        <div 
          className={`inventory-metric-card card-danger ${stockFilter === 'out_of_stock' ? 'inventory-metric-card--active' : ''}`}
          onClick={() => setStockFilter('out_of_stock')}
        >
          <span className="metric-label">🔴 Out of Stock</span>
          <span className="metric-value">{metrics.outOfStock}</span>
        </div>
        <div 
          className={`inventory-metric-card card-warning ${stockFilter === 'low_stock' ? 'inventory-metric-card--active' : ''}`}
          onClick={() => setStockFilter('low_stock')}
        >
          <span className="metric-label">🟡 Low Stock (≤3)</span>
          <span className="metric-value">{metrics.lowStock}</span>
        </div>
        <div 
          className={`inventory-metric-card card-success ${stockFilter === 'in_stock' ? 'inventory-metric-card--active' : ''}`}
          onClick={() => setStockFilter('in_stock')}
        >
          <span className="metric-label">🟢 Healthy Stock</span>
          <span className="metric-value">{metrics.inStock}</span>
        </div>
      </div>

      {/* ── Filter Pills & Toolbar ── */}
      <div className="inventory-filter-tabs">
        <button 
          className={`inventory-filter-pill ${stockFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStockFilter('all')}
        >
          All Products <span className="pill-count">{metrics.total}</span>
        </button>
        <button 
          className={`inventory-filter-pill ${stockFilter === 'out_of_stock' ? 'active' : ''}`}
          onClick={() => setStockFilter('out_of_stock')}
        >
          🔴 Out of Stock <span className="pill-count">{metrics.outOfStock}</span>
        </button>
        <button 
          className={`inventory-filter-pill ${stockFilter === 'low_stock' ? 'active' : ''}`}
          onClick={() => setStockFilter('low_stock')}
        >
          🟡 Low Stock (≤3) <span className="pill-count">{metrics.lowStock}</span>
        </button>
        <button 
          className={`inventory-filter-pill ${stockFilter === 'in_stock' ? 'active' : ''}`}
          onClick={() => setStockFilter('in_stock')}
        >
          🟢 In Stock <span className="pill-count">{metrics.inStock}</span>
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by ID, Name, or Category..."
            value={productSearchQuery}
            onChange={(e) => setProductSearchQuery(e.target.value)}
            className="admin-search-input"
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {selectedProducts.length > 0 && (
            <button 
              className="btn btn-primary"
              style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}
              onClick={handleDeleteSelected}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : `Delete Selected (${selectedProducts.length})`}
            </button>
          )}
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Add New Product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="skeleton-table-wrapper" style={{ marginTop: '24px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-row">
              <div className="skeleton-cell" style={{ flex: '0.5' }}></div>
              <div className="skeleton-cell" style={{ flex: '2' }}></div>
              <div className="skeleton-cell" style={{ flex: '1.5' }}></div>
              <div className="skeleton-cell" style={{ flex: '0.5' }}></div>
              <div className="skeleton-cell" style={{ flex: '0.5' }}></div>
              <div className="skeleton-cell" style={{ flex: '1' }}></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox"
                    style={{ cursor: 'pointer' }}
                    checked={filteredInventory.length > 0 && filteredInventory.every(p => selectedProducts.includes(p.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProducts(filteredInventory.map(p => p.id));
                      } else {
                        setSelectedProducts([]);
                      }
                    }}
                  />
                </th>
                <th>Product ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Current Stock (Quick-Edit)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length > 0 ? (
                filteredInventory.map((product) => {
                  const variants = Array.isArray(product.variants) ? product.variants : [];
                  const hasVariants = variants.length > 0;
                  const isEditingThis = editingStockId === product.id;
                  const isExpandedThis = expandedVariantId === product.id;

                  return (
                    <tr key={product.id}>
                      <td data-label="Select" className="admin-checkbox-cell">
                        <input 
                          type="checkbox"
                          className="admin-checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts(prev => [...prev, product.id]);
                            } else {
                              setSelectedProducts(prev => prev.filter(id => id !== product.id));
                            }
                          }}
                        />
                      </td>
                      <td data-label="Product ID">{product.id}</td>
                      <td data-label="Name">
                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{product.title}</span>
                        {product.size && <span className="product-size"> ({product.size})</span>}
                      </td>
                      <td data-label="Category">
                        {product.category?.title || "Unknown"}
                        {product.subcategory?.title && <span className="product-subcategory"> - {product.subcategory.title}</span>}
                      </td>
                      <td data-label="Price">{formatCurrency(product.price)}</td>
                      <td data-label="Current Stock">
                        {hasVariants ? (
                          <div>
                            {(() => {
                              const totalVariantStock = variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
                              const outOfStockCount = variants.filter(v => (parseInt(v.stock, 10) || 0) <= 0).length;
                              const lowStockCount = variants.filter(v => {
                                const st = parseInt(v.stock, 10) || 0;
                                return st > 0 && st <= 3;
                              }).length;

                              return (
                                <div>
                                  <div className={totalVariantStock > 0 ? 'text-success font-semibold' : 'text-danger font-semibold'} style={{ fontSize: '14px' }}>
                                    {totalVariantStock} units total
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    across {variants.length} variant{variants.length > 1 ? 's' : ''}
                                  </div>
                                  {outOfStockCount > 0 && (
                                    <div style={{ fontSize: '11px', color: '#c62828', fontWeight: '600', marginTop: '3px', background: '#ffebee', padding: '1px 6px', borderRadius: '4px', display: 'inline-block' }}>
                                      🔴 {outOfStockCount} variant{outOfStockCount > 1 ? 's' : ''} out of stock
                                    </div>
                                  )}
                                  {lowStockCount > 0 && (
                                    <div style={{ fontSize: '11px', color: '#e65100', fontWeight: '600', marginTop: '3px', marginLeft: outOfStockCount > 0 ? '4px' : '0', background: '#fff3e0', padding: '1px 6px', borderRadius: '4px', display: 'inline-block' }}>
                                      🟡 {lowStockCount} low
                                    </div>
                                  )}
                                  
                                  <div>
                                    <button 
                                      type="button" 
                                      className="variant-quick-toggle"
                                      onClick={() => handleToggleVariantDrawer(product)}
                                    >
                                      {isExpandedThis ? '▲ Close Variants' : '⚙️ Quick-Edit Variants'}
                                    </button>
                                  </div>

                                  {isExpandedThis && (
                                    <div className="variant-quick-drawer">
                                      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--admin-maroon)', marginBottom: '4px' }}>
                                        Variant Stock Breakdown
                                      </div>
                                      {(variantDrafts[product.id] || []).map((v, vIdx) => (
                                        <div key={vIdx} className="variant-quick-row">
                                          <div className="variant-quick-label">
                                            {v.size ? `Size: ${v.size}` : ''} {v.color ? `Color: ${v.color}` : ''}
                                            {(!v.size && !v.color) ? `Option ${vIdx + 1}` : ''}
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <input 
                                              type="number"
                                              min="0"
                                              value={v.stock ?? 0}
                                              onChange={(e) => handleVariantDraftChange(product.id, vIdx, 'stock', Math.max(0, parseInt(e.target.value, 10) || 0))}
                                              className="inline-stock-input"
                                            />
                                            <span style={{ fontSize: '11px', color: (parseInt(v.stock, 10) || 0) > 0 ? '#2e7d32' : '#c62828' }}>
                                              {(parseInt(v.stock, 10) || 0) > 0 ? 'in stock' : 'sold out'}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                      <button 
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        disabled={isUpdatingStock}
                                        onClick={() => handleSaveVariantStocks(product.id)}
                                        style={{ marginTop: '6px', alignSelf: 'flex-end' }}
                                      >
                                        {isUpdatingStock ? 'Saving...' : 'Save All Variants'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        ) : isEditingThis ? (
                          <div className="inline-stock-editor">
                            <input 
                              type="number"
                              min="0"
                              value={tempStockValue}
                              onChange={(e) => setTempStockValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveSimpleStock(product.id);
                                if (e.key === 'Escape') setEditingStockId(null);
                              }}
                              className="inline-stock-input"
                              autoFocus
                            />
                            <button 
                              type="button" 
                              className="inline-stock-btn btn-save"
                              onClick={() => handleSaveSimpleStock(product.id)}
                              disabled={isUpdatingStock}
                              title="Save"
                            >
                              ✓
                            </button>
                            <button 
                              type="button" 
                              className="inline-stock-btn btn-cancel"
                              onClick={() => setEditingStockId(null)}
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span 
                              className={
                                (parseInt(product.stock, 10) || 0) <= 0 
                                  ? 'text-danger font-semibold' 
                                  : (parseInt(product.stock, 10) || 0) <= 3 
                                  ? 'font-semibold' 
                                  : 'text-success font-semibold'
                              }
                              style={{ 
                                fontSize: '14px', 
                                color: (parseInt(product.stock, 10) || 0) > 0 && (parseInt(product.stock, 10) || 0) <= 3 ? '#e65100' : undefined 
                              }}
                            >
                              {parseInt(product.stock, 10) || 0} units
                            </span>
                            <button 
                              type="button"
                              className="stock-edit-trigger"
                              onClick={() => {
                                setEditingStockId(product.id);
                                setTempStockValue(String(parseInt(product.stock, 10) || 0));
                              }}
                              title="Quick-edit stock"
                            >
                              ✏️ Edit
                            </button>
                          </div>
                        )}
                      </td>
                      <td data-label="Actions">
                        <div className="action-button-group vertical">
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenModal(product)}
                          >
                            Edit Full
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center" style={{ padding: '24px' }}>
                    No products found matching this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          editingProduct={editingProduct}
          categories={categories}
          onSaved={() => {
            setIsModalOpen(false);
            fetchInventory();
          }}
        />
      )}

      {confirmDialog.isOpen && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
}
