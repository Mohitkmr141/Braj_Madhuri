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
    colors: '',
    images: [],
    variants: []
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
        colors: Array.isArray(editingProduct.colors) ? editingProduct.colors.join(', ') : '',
        images: Array.isArray(editingProduct.images) && editingProduct.images.length > 0 
          ? editingProduct.images 
          : (editingProduct.imageUrl ? [editingProduct.imageUrl] : []),
        variants: Array.isArray(editingProduct.variants) ? editingProduct.variants : []
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
        colors: '',
        images: [],
        variants: []
      });
    }
  }, [editingProduct]);

  if (!isOpen) return null;

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const newImageUrls = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
          newImageUrls.push(data.url);
        } else {
          toast.error(`Upload failed for ${file.name}: ` + data.error);
        }
      }
      
      if (newImageUrls.length > 0) {
        setProductForm(prev => {
          const updatedImages = [...prev.images, ...newImageUrls];
          return { ...prev, images: updatedImages, imageUrl: updatedImages[0] || '' };
        });
        toast.success(`Uploaded ${newImageUrls.length} image(s)!`);
      }
    } catch {
      toast.error('Error uploading image(s)');
    } finally {
      setUploading(false);
      // Reset input so the same files can be selected again if needed
      e.target.value = null;
    }
  };

  const removeImage = (index) => {
    setProductForm(prev => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages, imageUrl: newImages[0] || '' };
    });
  };

  const addVariant = () => {
    setProductForm(prev => ({
      ...prev,
      variants: [...prev.variants, { id: Date.now().toString(), size: '', color: '', price: '', originalPrice: '', stock: '10' }]
    }));
  };

  const updateVariant = (index, field, value) => {
    setProductForm(prev => {
      const newVariants = [...prev.variants];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return { ...prev, variants: newVariants };
    });
  };

  const removeVariant = (index) => {
    setProductForm(prev => {
      const newVariants = [...prev.variants];
      newVariants.splice(index, 1);
      return { ...prev, variants: newVariants };
    });
  };

  const handleSave = async (e, stayOpen = false) => {
    if (e && e.preventDefault) e.preventDefault();

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
        if (stayOpen) {
          setProductForm({
            title: '', categoryId: '', subcategoryId: '', price: '', originalPrice: '', stock: '10', imageUrl: '', description: '', size: '', subheading: '', colors: '', images: [], variants: []
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
              <label className="form-label">Product Images</label>
              <input 
                type="file" 
                className="form-input" 
                accept="image/*" 
                multiple
                onChange={handleImageUpload} 
              />
              {uploading && <p className="text-sm mt-1 text-gray-500">Uploading images...</p>}
              
              {productForm.images && productForm.images.length > 0 && (
                <div className="product-image-preview mt-3" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {productForm.images.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                      <img src={img} alt={`Preview ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        type="button" 
                        onClick={() => removeImage(idx)}
                        style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,0,0,0.8)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Remove image"
                      >
                        &times;
                      </button>
                      {idx === 0 && <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '10px', textAlign: 'center', padding: '2px 0' }}>Main</span>}
                    </div>
                  ))}
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
              <label className="form-label">Sizes (comma-separated)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. 0, 1, 2 or S, M, L"
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

          <div className="form-row" style={{ marginTop: '20px' }}>
            <div className="form-col" style={{ flex: '1 1 100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label className="form-label" style={{ margin: 0 }}>Product Variants (Specific Size/Color Pricing)</label>
                <button type="button" onClick={addVariant} className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.85rem' }}>+ Add Variant</button>
              </div>
              
              {productForm.variants.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {productForm.variants.map((variant, idx) => (
                    <div key={variant.id || idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Size</label>
                        <input type="text" className="form-input" placeholder="e.g. M" value={variant.size} onChange={(e) => updateVariant(idx, 'size', e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Color</label>
                        <input type="text" className="form-input" placeholder="e.g. Red" value={variant.color} onChange={(e) => updateVariant(idx, 'color', e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Price *</label>
                        <input type="number" className="form-input" required min="0" step="0.01" value={variant.price} onChange={(e) => updateVariant(idx, 'price', e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Orig. Price</label>
                        <input type="number" className="form-input" min="0" step="0.01" value={variant.originalPrice} onChange={(e) => updateVariant(idx, 'originalPrice', e.target.value)} />
                      </div>
                      <div style={{ width: '80px' }}>
                        <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Stock *</label>
                        <input type="number" className="form-input" required min="0" value={variant.stock} onChange={(e) => updateVariant(idx, 'stock', e.target.value)} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '22px' }}>
                        <button type="button" onClick={() => removeVariant(idx)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} title="Remove variant">&times;</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>No variants added. The base price and stock above will be used for all sizes and colors.</p>
              )}
            </div>
          </div>

          <div className="form-actions mt-4 flex justify-end gap-2">
            <button type="button" className="btn btn-outline mr-2" onClick={onClose}>Cancel</button>
            <button type="submit" className={`btn btn-primary ${saving || uploading ? 'btn-disabled' : ''}`} disabled={saving || uploading}>
              {saving ? 'Saving...' : 'Save Product'}
            </button>
            {!editingProduct && (
              <button 
                type="button" 
                className={`btn btn-secondary ${saving || uploading ? 'btn-disabled' : ''}`} 
                disabled={saving || uploading}
                onClick={(e) => {
                  const form = e.currentTarget.closest('form');
                  if (form && !form.checkValidity()) {
                    form.reportValidity();
                    return;
                  }
                  handleSave(e, true);
                }}
                style={{backgroundColor: '#e5e7eb', color: '#374151', border: 'none'}}
              >
                Save & Add Another
              </button>
            )}
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
