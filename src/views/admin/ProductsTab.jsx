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
    let bestsellers = 0;

    for (const p of inventory) {
      if (p.isBestseller) bestsellers++;
      
      if (isProductOutOfStock(p)) {
        outOfStock++;
      } else if (isProductLowStock(p)) {
        lowStock++;
      } else {
        inStock++;
      }
    }
    return { total, outOfStock, lowStock, inStock, bestsellers };
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

    if (stockFilter === 'bestseller') return product.isBestseller;
    if (stockFilter === 'out_of_stock') return isProductOutOfStock(product);
    if (stockFilter === 'low_stock') return isProductLowStock(product);
    if (stockFilter === 'in_stock') return !isProductOutOfStock(product) && !isProductLowStock(product);
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── Top Metrics Bar ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div 
          className={`p-4 rounded-xl border cursor-pointer transition-all bg-white ${stockFilter === 'all' ? 'ring-2 ring-[#4A1521] shadow-md border-transparent' : 'border-slate-200 hover:border-slate-300'}`}
          onClick={() => setStockFilter('all')}
        >
          <span className="block text-sm font-medium text-slate-500 mb-1">Total Products</span>
          <span className="block text-2xl font-bold text-slate-900">{metrics.total}</span>
        </div>
        <div 
          className={`p-4 rounded-xl border cursor-pointer transition-all bg-red-50 ${stockFilter === 'out_of_stock' ? 'ring-2 ring-red-500 shadow-md border-transparent' : 'border-red-200 hover:border-red-300'}`}
          onClick={() => setStockFilter('out_of_stock')}
        >
          <span className="block text-sm font-medium text-red-600 mb-1">🔴 Out of Stock</span>
          <span className="block text-2xl font-bold text-red-900">{metrics.outOfStock}</span>
        </div>
        <div 
          className={`p-4 rounded-xl border cursor-pointer transition-all bg-orange-50 ${stockFilter === 'low_stock' ? 'ring-2 ring-orange-500 shadow-md border-transparent' : 'border-orange-200 hover:border-orange-300'}`}
          onClick={() => setStockFilter('low_stock')}
        >
          <span className="block text-sm font-medium text-orange-600 mb-1">🟡 Low Stock (≤3)</span>
          <span className="block text-2xl font-bold text-orange-900">{metrics.lowStock}</span>
        </div>
        <div 
          className={`p-4 rounded-xl border cursor-pointer transition-all bg-green-50 ${stockFilter === 'in_stock' ? 'ring-2 ring-green-500 shadow-md border-transparent' : 'border-green-200 hover:border-green-300'}`}
          onClick={() => setStockFilter('in_stock')}
        >
          <span className="block text-sm font-medium text-green-600 mb-1">🟢 Healthy Stock</span>
          <span className="block text-2xl font-bold text-green-900">{metrics.inStock}</span>
        </div>
      </div>

      {/* ── Filter Pills & Toolbar ── */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button 
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${stockFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          onClick={() => setStockFilter('all')}
        >
          All Products <span className="ml-1 px-2 py-0.5 rounded-full bg-black/10 text-xs">{metrics.total}</span>
        </button>
        <button 
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${stockFilter === 'out_of_stock' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
          onClick={() => setStockFilter('out_of_stock')}
        >
          🔴 Out of Stock <span className="ml-1 px-2 py-0.5 rounded-full bg-black/10 text-xs">{metrics.outOfStock}</span>
        </button>
        <button 
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${stockFilter === 'low_stock' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}
          onClick={() => setStockFilter('low_stock')}
        >
          🟡 Low Stock (≤3) <span className="ml-1 px-2 py-0.5 rounded-full bg-black/10 text-xs">{metrics.lowStock}</span>
        </button>
        <button 
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${stockFilter === 'in_stock' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
          onClick={() => setStockFilter('in_stock')}
        >
          🟢 In Stock <span className="ml-1 px-2 py-0.5 rounded-full bg-black/10 text-xs">{metrics.inStock}</span>
        </button>
        <button 
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${stockFilter === 'bestseller' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-yellow-600 border-yellow-400 hover:bg-yellow-50'}`}
          onClick={() => setStockFilter('bestseller')}
        >
          ⭐ Pinned Bestsellers <span className="ml-1 px-2 py-0.5 rounded-full bg-black/10 text-xs">{metrics.bestsellers}</span>
        </button>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-4 p-5 bg-white border-b border-slate-200">
        <div className="search-bar flex-1">
          <input
            type="text"
            placeholder="Search by ID, Name, or Category..."
            value={productSearchQuery}
            onChange={(e) => setProductSearchQuery(e.target.value)}
            className="w-full max-w-xs pl-10 pr-4 py-2 text-sm rounded-full border border-slate-300 bg-white focus:border-[#4A1521] focus:ring-2 focus:ring-[#4A1521]/20 outline-none transition-all"
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {selectedProducts.length > 0 && (
            <button 
              className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg font-semibold hover:bg-red-100 transition-all"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : `Delete Selected (${selectedProducts.length})`}
            </button>
          )}
          <button className="bg-[#4A1521] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#3A0F19] transition-all" onClick={() => handleOpenModal()}>
            + Add New Product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="w-full mt-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border border-slate-200 rounded-lg animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/12"></div>
              <div className="h-4 bg-slate-200 rounded w-4/12"></div>
              <div className="h-4 bg-slate-200 rounded w-3/12"></div>
              <div className="h-4 bg-slate-200 rounded w-1/12"></div>
              <div className="h-4 bg-slate-200 rounded w-1/12"></div>
              <div className="h-4 bg-slate-200 rounded w-2/12"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider px-6 py-4 border-b border-slate-200" style={{ width: '40px' }}>
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
                <th className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider px-6 py-4 border-b border-slate-200">Product ID</th>
                <th className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider px-6 py-4 border-b border-slate-200">Name</th>
                <th className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider px-6 py-4 border-b border-slate-200">Category</th>
                <th className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider px-6 py-4 border-b border-slate-200">Price</th>
                <th className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider px-6 py-4 border-b border-slate-200">Sales</th>
                <th className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider px-6 py-4 border-b border-slate-200">Current Stock (Quick-Edit)</th>
                <th className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider px-6 py-4 border-b border-slate-200">Actions</th>
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
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td data-label="Select" className="px-6 py-4 border-b border-slate-100 text-sm text-slate-700">
                        <input 
                          type="checkbox"
                          className="w-4 h-4 text-[#4A1521] border-slate-300 rounded focus:ring-[#4A1521]"
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
                      <td data-label="Product ID" className="px-6 py-4 border-b border-slate-100 text-sm text-slate-700">{product.id}</td>
                      <td data-label="Name" className="px-6 py-4 border-b border-slate-100 text-sm text-slate-700">
                        <span className="font-semibold text-slate-900">{product.title}</span>
                        {product.isBestseller && <span className="ml-1.5 text-xs">⭐</span>}
                        {product.size && <span className="text-xs text-slate-500"> ({product.size})</span>}
                      </td>
                      <td data-label="Category" className="px-6 py-4 border-b border-slate-100 text-sm text-slate-700">
                        {product.category?.title || "Unknown"}
                        {product.subcategory?.title && <span className="text-xs text-slate-500"> - {product.subcategory.title}</span>}
                      </td>
                      <td data-label="Price" className="px-6 py-4 border-b border-slate-100 text-sm text-slate-700">{formatCurrency(product.price)}</td>
                      <td data-label="Sales" className="px-6 py-4 border-b border-slate-100 text-sm font-bold text-[#4A1521]">
                        {product.salesCount || 0}
                      </td>
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
                                  <div className={`text-sm ${totalVariantStock > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}`}>
                                    {totalVariantStock} units total
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    across {variants.length} variant{variants.length > 1 ? 's' : ''}
                                  </div>
                                  {outOfStockCount > 0 && (
                                    <div className="text-[11px] text-red-700 font-semibold mt-1 bg-red-50 px-1.5 py-0.5 rounded inline-block">
                                      🔴 {outOfStockCount} variant{outOfStockCount > 1 ? 's' : ''} out of stock
                                    </div>
                                  )}
                                  {lowStockCount > 0 && (
                                    <div className={`text-[11px] text-orange-700 font-semibold mt-1 ${outOfStockCount > 0 ? 'ml-1' : ''} bg-orange-50 px-1.5 py-0.5 rounded inline-block`}>
                                      🟡 {lowStockCount} low
                                    </div>
                                  )}
                                  
                                  <div>
                                    <button 
                                      type="button" 
                                      className="text-xs text-[#4A1521] font-semibold hover:underline mt-1 bg-transparent border-none p-0 cursor-pointer"
                                      onClick={() => handleToggleVariantDrawer(product)}
                                    >
                                      {isExpandedThis ? '▲ Close Variants' : '⚙️ Quick-Edit Variants'}
                                    </button>
                                  </div>

                                  {isExpandedThis && (
                                    <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-2">
                                      <div className="text-xs font-bold text-[#4A1521] mb-1">
                                        Variant Stock Breakdown
                                      </div>
                                      {(variantDrafts[product.id] || []).map((v, vIdx) => (
                                        <div key={vIdx} className="flex justify-between items-center text-sm">
                                          <div className="text-slate-700 font-medium">
                                            {v.size ? `Size: ${v.size}` : ''} {v.color ? `Color: ${v.color}` : ''}
                                            {(!v.size && !v.color) ? `Option ${vIdx + 1}` : ''}
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                            <input 
                                              type="number"
                                              min="0"
                                              value={v.stock ?? 0}
                                              onChange={(e) => handleVariantDraftChange(product.id, vIdx, 'stock', Math.max(0, parseInt(e.target.value, 10) || 0))}
                                              className="w-16 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#4A1521]"
                                            />
                                            <span className={`text-[11px] ${(parseInt(v.stock, 10) || 0) > 0 ? 'text-green-700' : 'text-red-700'}`}>
                                              {(parseInt(v.stock, 10) || 0) > 0 ? 'in stock' : 'sold out'}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                      <button 
                                        type="button"
                                        className="bg-[#4A1521] text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-[#3A0F19] transition-all mt-1.5 self-end"
                                        disabled={isUpdatingStock}
                                        onClick={() => handleSaveVariantStocks(product.id)}
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
                          <div className="flex items-center gap-1">
                            <input 
                              type="number"
                              min="0"
                              value={tempStockValue}
                              onChange={(e) => setTempStockValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveSimpleStock(product.id);
                                if (e.key === 'Escape') setEditingStockId(null);
                              }}
                              className="w-16 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#4A1521]"
                              autoFocus
                            />
                            <button 
                              type="button" 
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              onClick={() => handleSaveSimpleStock(product.id)}
                              disabled={isUpdatingStock}
                              title="Save"
                            >
                              ✓
                            </button>
                            <button 
                              type="button" 
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              onClick={() => setEditingStockId(null)}
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span 
                              className={`text-sm ${(parseInt(product.stock, 10) || 0) <= 0 ? 'text-red-600 font-semibold' : (parseInt(product.stock, 10) || 0) <= 3 ? 'text-orange-600 font-semibold' : 'text-green-600 font-semibold'}`}
                            >
                              {parseInt(product.stock, 10) || 0} units
                            </span>
                            <button 
                              type="button"
                              className="ml-2 text-xs text-slate-500 hover:text-[#4A1521] cursor-pointer"
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
                      <td data-label="Actions" className="px-6 py-4 border-b border-slate-100 text-sm text-slate-700">
                        <div className="flex flex-col gap-2">
                          <button
                            className="bg-white text-slate-700 border border-slate-300 px-3 py-1 rounded-md text-sm font-semibold hover:bg-slate-50 transition-all w-full text-left"
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/admin/products/bestseller', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: product.id, isBestseller: !product.isBestseller })
                                });
                                const data = await res.json();
                                if (data.success) {
                                  toast.success(`Product ${!product.isBestseller ? 'pinned as' : 'removed from'} bestsellers!`);
                                  setInventory(prev => prev.map(p => p.id === product.id ? { ...p, isBestseller: !p.isBestseller } : p));
                                } else {
                                  toast.error(data.error);
                                }
                              } catch {
                                toast.error('Error toggling bestseller');
                              }
                            }}
                          >
                            {product.isBestseller ? '⭐ Unpin' : '⭐ Pin'}
                          </button>
                          <button
                            className="bg-white text-slate-700 border border-slate-300 px-3 py-1 rounded-md text-sm font-semibold hover:bg-slate-50 transition-all w-full text-left"
                            onClick={() => handleOpenModal(product)}
                          >
                            Edit Full
                          </button>
                          <button
                            className="bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-100 transition-all w-full text-left"
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
                <tr className="hover:bg-slate-50">
                  <td colSpan="8" className="px-6 py-4 border-b border-slate-100 text-sm text-slate-700 text-center" style={{ padding: '24px' }}>
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
