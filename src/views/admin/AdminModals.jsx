"use client";

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Delete', cancelText = 'Cancel', isDangerous = true }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="confirm-dialog">
        <h3 className="confirm-dialog-title">{title}</h3>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions flex gap-2 justify-center">
          <button className="btn btn-outline" onClick={onCancel}>{cancelText}</button>
          <button className={`btn ${isDangerous ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProductModal = ({ isOpen, onClose, editingProduct, categories, onSaved }) => {
  const [productForm, setProductForm] = useState({
    title: '',
    categoryId: '',
    subcategoryId: '',
    price: '',
    originalPrice: '',
    stock: '10',
    imageUrl: '',
    description: '',
    size: '',
    subheading: '',
    colors: ''
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setProductForm({
        title: editingProduct.title || '',
        categoryId: editingProduct.categoryId || '',
        subcategoryId: editingProduct.subcategoryId || '',
        price: editingProduct.price || '',
        originalPrice: editingProduct.originalPrice || '',
        stock: editingProduct.stock !== undefined ? String(editingProduct.stock) : '10',
        imageUrl: editingProduct.imageUrl || '',
        description: editingProduct.description || '',
        size: editingProduct.size || '',
        subheading: editingProduct.subheading || '',
        colors: Array.isArray(editingProduct.colors) ? editingProduct.colors.join(', ') : ''
      });
    } else {
      setProductForm({
        title: '',
        categoryId: '',
        subcategoryId: '',
        price: '',
        originalPrice: '',
        stock: '10',
        imageUrl: '',
        description: '',
        size: '',
        subheading: '',
        colors: ''
      });
    }
  }, [editingProduct]);

  if (!isOpen) return null;

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setProductForm(prev => ({ ...prev, imageUrl: data.url }));
        toast.success('Image uploaded!');
      } else {
        toast.error('Upload failed: ' + data.error);
      }
    } catch {
      toast.error('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const isSaveAndAnother = e.nativeEvent.submitter?.value === 'save-another';

    if (productForm.originalPrice && Number(productForm.price) > Number(productForm.originalPrice)) {
      toast.error('Price cannot be greater than Original Price');
      return;
    }

    setSaving(true);
    try {
      const url = '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const body = { ...productForm };
      body.colors = (productForm.colors || '').split(',').map(c => c.trim()).filter(Boolean);
      if (editingProduct) body.id = editingProduct.id;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingProduct ? 'Product updated!' : 'Product created!');
        onSaved();
        if (isSaveAndAnother) {
          setProductForm({
            title: '', categoryId: '', subcategoryId: '', price: '', originalPrice: '', stock: '10', imageUrl: '', description: '', size: '', subheading: '', colors: ''
          });
        } else {
          onClose();
        }
      } else {
        toast.error('Failed to save product: ' + data.error);
      }
    } catch {
      toast.error('Error saving product.');
    } finally {
      setSaving(false);
    }
  };

  const selectedCategory = categories?.find(c => String(c.id) === String(productForm.categoryId));
  const subcategories = selectedCategory?.subcategories || [];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2 className="modal-title">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
        
        <form className="modal-form" onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Title *</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={productForm.title} 
                onChange={e => setProductForm({...productForm, title: e.target.value})} 
              />
            </div>
            <div className="form-col">
              <label className="form-label">Category *</label>
              <select 
                className="form-select" 
                required 
                value={productForm.categoryId} 
                onChange={e => setProductForm({...productForm, categoryId: e.target.value, subcategoryId: ''})}
              >
                <option value="">Select Category</option>
                {categories?.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Subcategory</label>
              <select 
                className="form-select" 
                disabled={!productForm.categoryId || subcategories.length === 0} 
                value={productForm.subcategoryId} 
                onChange={e => setProductForm({...productForm, subcategoryId: e.target.value})}
              >
                <option value="">Select Subcategory</option>
                {subcategories.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Price *</label>
              <input 
                type="number" 
                className="form-input" 
                required 
                min="0"
                step="0.01"
                value={productForm.price} 
                onChange={e => setProductForm({...productForm, price: e.target.value})} 
              />
            </div>
            <div className="form-col">
              <label className="form-label">Original Price</label>
              <input 
                type="number" 
                className="form-input" 
                min="0"
                step="0.01"
                value={productForm.originalPrice} 
                onChange={e => setProductForm({...productForm, originalPrice: e.target.value})} 
              />
              {productForm.originalPrice && productForm.price && Number(productForm.originalPrice) > Number(productForm.price) && (
                <span style={{color: '#10b981', fontSize: '0.85rem', marginTop: '4px', display: 'block', fontWeight: '500'}}>
                  {Math.round(((Number(productForm.originalPrice) - Number(productForm.price)) / Number(productForm.originalPrice)) * 100)}% off
                </span>
              )}
            </div>
            <div className="form-col">
              <label className="form-label">Stock *</label>
              <input 
                type="number" 
                className="form-input" 
                required 
                min="0"
                value={productForm.stock} 
                onChange={e => setProductForm({...productForm, stock: e.target.value})} 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Product Image</label>
              <input 
                type="file" 
                className="form-input" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
              {uploading && <p>Uploading...</p>}
              {productForm.imageUrl && (
                <div className="product-image-preview mt-2">
                  <img src={productForm.imageUrl} alt="Preview" style={{maxHeight: '100px'}} />
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Subheading</label>
              <input 
                type="text" 
                className="form-input" 
                value={productForm.subheading} 
                onChange={e => setProductForm({...productForm, subheading: e.target.value})} 
              />
            </div>
            <div className="form-col">
              <label className="form-label">Size</label>
              <input 
                type="text" 
                className="form-input" 
                value={productForm.size} 
                onChange={e => setProductForm({...productForm, size: e.target.value})} 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Description</label>
              <textarea 
                className="form-textarea" 
                rows="4" 
                value={productForm.description} 
                onChange={e => setProductForm({...productForm, description: e.target.value})} 
              />
            </div>
            <div className="form-col">
              <label className="form-label">Colors (comma-separated)</label>
              <textarea 
                className="form-textarea" 
                rows="4"
                placeholder="e.g. Red, Green, Blue" 
                value={productForm.colors} 
                onChange={e => setProductForm({...productForm, colors: e.target.value})} 
              />
            </div>
          </div>

          <div className="form-actions mt-4 flex justify-end gap-2">
            <button type="button" className="btn btn-outline mr-2" onClick={onClose}>Cancel</button>
            {!editingProduct && (
              <button 
                type="submit" 
                name="submit_action" 
                value="save-another"
                className={`btn btn-secondary ${saving || uploading ? 'btn-disabled' : ''}`} 
                disabled={saving || uploading}
                style={{backgroundColor: '#e5e7eb', color: '#374151', border: 'none'}}
              >
                Save & Add Another
              </button>
            )}
            <button type="submit" name="submit_action" value="save" className={`btn btn-primary ${saving || uploading ? 'btn-disabled' : ''}`} disabled={saving || uploading}>
              {saving ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CategoryModal = ({ isOpen, onClose, editingCategory, onSaved }) => {
  const [form, setForm] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setForm({
        title: editingCategory.title || '',
        description: editingCategory.description || ''
      });
    } else {
      setForm({ title: '', description: '' });
    }
  }, [editingCategory]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      const body = { ...form };
      if (editingCategory) body.id = editingCategory.id;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to save category');
      } else {
        toast.success(editingCategory ? 'Category updated!' : 'Category created!');
        onSaved();
        onClose();
      }
    } catch {
      toast.error('Network error saving category.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content-sm">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2 className="modal-title">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
        
        <form className="modal-form" onSubmit={handleSave}>
          <div className="form-col mb-4">
            <label className="form-label">Title *</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={form.title} 
              onChange={e => setForm({...form, title: e.target.value})} 
            />
          </div>
          <div className="form-col mb-4">
            <label className="form-label">Description</label>
            <textarea 
              className="form-textarea" 
              rows="3" 
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})} 
            />
          </div>
          
          <div className="form-actions mt-4 flex justify-end gap-2">
            <button type="button" className="btn btn-outline mr-2" onClick={onClose}>Cancel</button>
            <button type="submit" className={`btn btn-primary ${saving ? 'btn-disabled' : ''}`} disabled={saving}>
              {saving ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SubcategoryModal = ({ isOpen, onClose, editingSubcategory, categories, onSaved }) => {
  const [form, setForm] = useState({ title: '', description: '', categoryId: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingSubcategory) {
      setForm({
        title: editingSubcategory.title || '',
        description: editingSubcategory.description || '',
        categoryId: editingSubcategory.categoryId || ''
      });
    } else {
      setForm({ title: '', description: '', categoryId: '' });
    }
  }, [editingSubcategory]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = '/api/admin/subcategories';
      const method = editingSubcategory ? 'PUT' : 'POST';
      const body = { ...form };
      if (editingSubcategory) body.id = editingSubcategory.id;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to save subcategory');
      } else {
        toast.success(editingSubcategory ? 'Subcategory updated!' : 'Subcategory created!');
        onSaved();
        onClose();
      }
    } catch {
      toast.error('Network error saving subcategory.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content-sm">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2 className="modal-title">{editingSubcategory ? 'Edit Subcategory' : 'Add New Subcategory'}</h2>
        
        <form className="modal-form" onSubmit={handleSave}>
          <div className="form-col mb-4">
            <label className="form-label">Parent Category *</label>
            <select 
              className="form-select" 
              required 
              value={form.categoryId} 
              onChange={e => setForm({...form, categoryId: e.target.value})}
            >
              <option value="">Select Category</option>
              {categories?.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div className="form-col mb-4">
            <label className="form-label">Title *</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={form.title} 
              onChange={e => setForm({...form, title: e.target.value})} 
            />
          </div>
          <div className="form-col mb-4">
            <label className="form-label">Description</label>
            <textarea 
              className="form-textarea" 
              rows="3" 
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})} 
            />
          </div>
          
          <div className="form-actions mt-4 flex justify-end gap-2">
            <button type="button" className="btn btn-outline mr-2" onClick={onClose}>Cancel</button>
            <button type="submit" className={`btn btn-primary ${saving ? 'btn-disabled' : ''}`} disabled={saving}>
              {saving ? 'Saving...' : 'Save Subcategory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
