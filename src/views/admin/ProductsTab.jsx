"use client";

import React, { useState, useEffect, useCallback } from 'react';
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

  const filteredInventory = inventory.filter((product) => {
    const q = productSearchQuery.toLowerCase();
    return (
      (product.title && product.title.toLowerCase().includes(q)) ||
      (product.id && String(product.id).toLowerCase().includes(q))
    );
  });

  return (
    <div className="admin-inventory">
      <div className="admin-toolbar">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by ID or Name"
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
                <th>Current Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length > 0 ? (
                filteredInventory.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <input 
                        type="checkbox"
                        style={{ cursor: 'pointer' }}
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
                      {product.title}
                      {product.size && <span className="product-size"> ({product.size})</span>}
                    </td>
                    <td data-label="Category">
                      {product.category?.title || "Unknown"}
                      {product.subcategory?.title && <span className="product-subcategory"> - {product.subcategory.title}</span>}
                    </td>
                    <td data-label="Price">{formatCurrency(product.price)}</td>
                    <td data-label="Current Stock" className={product.stock > 0 ? 'text-success' : 'text-danger'}>
                      {product.stock || 0}
                    </td>
                    <td data-label="Actions">
                      <div className="action-button-group vertical">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenModal(product)}
                        >
                          Edit
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
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    No products found.
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
          product={editingProduct}
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
