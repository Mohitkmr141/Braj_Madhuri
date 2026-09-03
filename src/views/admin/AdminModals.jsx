"use client";

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

export const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Delete', cancelText = 'Cancel', isDangerous = true }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative p-6">
        <h3 className="font-serif text-2xl font-bold text-[#4A1521] m-0 mb-4">{title}</h3>
        <p className="text-slate-600 mb-6">{message}</p>
        <div className="flex gap-2 justify-center">
          <button className="bg-white text-slate-700 border border-slate-300 px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-50 transition-all" onClick={onCancel}>{cancelText}</button>
          <button className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${isDangerous ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-[#4A1521] text-white hover:bg-[#3A0F19]'}`} onClick={onConfirm}>
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
    variants: [],
    isBestseller: false
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadFormat, setUploadFormat] = useState('image/webp');

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
        variants: Array.isArray(editingProduct.variants) ? editingProduct.variants : [],
        isBestseller: editingProduct.isBestseller || false
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
        variants: [],
        isBestseller: false
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
      for (const originalFile of files) {
        // Compress image before upload
        const options = {
          maxSizeMB: 0.2, // Drastically reduced to prevent high bandwidth usage
          maxWidthOrHeight: 1080, // Reduced from 1920px for ecommerce grids
          useWebWorker: true,
          fileType: uploadFormat
        };
        const compressedBlob = await imageCompression(originalFile, options);
        const ext = uploadFormat === 'image/webp' ? '.webp' : '.png';
        const newName = originalFile.name.replace(/\.[^/.]+$/, "") + ext;
        const file = new File([compressedBlob], newName, { type: uploadFormat });

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
      const removedUrl = newImages[index];
      newImages.splice(index, 1);
      const updatedVariants = prev.variants.map(v => v.image === removedUrl ? { ...v, image: '' } : v);
      return { ...prev, images: newImages, imageUrl: newImages[0] || '', variants: updatedVariants };
    });
  };

  const addVariant = () => {
    setProductForm(prev => ({
      ...prev,
      variants: [...prev.variants, { id: Date.now().toString(), size: '', color: '', price: '', originalPrice: '', stock: '10', image: '' }]
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

  const duplicateVariant = (index) => {
    setProductForm(prev => {
      const newVariants = [...prev.variants];
      const cloned = { ...newVariants[index], id: Date.now().toString() + Math.random() };
      newVariants.splice(index + 1, 0, cloned);
      return { ...prev, variants: newVariants };
    });
  };

  const generateCombinations = () => {
    const sizes = (productForm.size || '').split(',').map(s => s.trim()).filter(Boolean);
    const colors = (productForm.colors || '').split(',').map(c => c.trim()).filter(Boolean);
    
    if (sizes.length === 0 && colors.length === 0) {
      toast.error('Please enter sizes or colors in the fields above first.');
      return;
    }

    const combinations = [];
    const safeSizes = sizes.length > 0 ? sizes : [''];
    const safeColors = colors.length > 0 ? colors : [''];

    safeSizes.forEach(size => {
      safeColors.forEach(color => {
        const exists = productForm.variants.some(v => 
          (v.size || '').trim().toLowerCase() === size.toLowerCase() && 
          (v.color || '').trim().toLowerCase() === color.toLowerCase()
        );
        if (!exists) {
          combinations.push({
            id: Date.now().toString() + Math.random(),
            size,
            color,
            price: '',
            originalPrice: '',
            stock: productForm.stock || '10',
            image: ''
          });
        }
      });
    });

    if (combinations.length === 0) {
      toast.error('All combinations for these sizes and colors already exist!');
      return;
    }

    setProductForm(prev => ({
      ...prev,
      variants: [...prev.variants, ...combinations]
    }));
    toast.success(`Generated ${combinations.length} new variant(s)!`);
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
            title: '', categoryId: '', subcategoryId: '', price: '', originalPrice: '', stock: '10', imageUrl: '', description: '', size: '', subheading: '', colors: '', images: [], variants: [], isBestseller: false
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden relative">
        <button className="text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-full p-2 transition-all absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-xl" onClick={onClose}>&times;</button>
        <h2 className="font-serif text-2xl font-bold text-[#4A1521] m-0 p-6 border-b border-slate-200">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
        
        <form className="p-6 overflow-y-auto max-h-[70vh]" onSubmit={handleSave}>
          <div className="flex flex-col md:flex-row gap-4 mb-5">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Title *</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-[#4A1521] focus:ring-2 focus:ring-[#4A1521]/20 outline-none transition-all" 
                required 
                value={productForm.title} 
                onChange={e => setProductForm({...productForm, title: e.target.value})} 
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Category *</label>
              <select 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-[#4A1521] focus:ring-2 focus:ring-[#4A1521]/20 outline-none transition-all" 
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

          <div className="flex flex-col md:flex-row gap-4 mb-5">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Subcategory</label>
              <select 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-[#4A1521] focus:ring-2 focus:ring-[#4A1521]/20 outline-none transition-all" 
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

          <div className="flex flex-col md:flex-row gap-4 mb-5">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Price *</label>
              <input 
                type="number" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-[#4A1521] focus:ring-2 focus:ring-[#4A1521]/20 outline-none transition-all" 
                required 
                min="0"
                step="0.01"
                value={productForm.price} 
                onChange={e => setProductForm({...productForm, price: e.target.value})} 
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Original Price</label>
              <input 
                type="number" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-[#4A1521] focus:ring-2 focus:ring-[#4A1521]/20 outline-none transition-all" 
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
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Stock *</label>
              <input 
                type="number" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-[#4A1521] focus:ring-2 focus:ring-[#4A1521]/20 outline-none transition-all" 
                required 
                min="0"
                value={productForm.stock} 
                onChange={e => setProductForm({...productForm, stock: e.target.value})} 
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-5">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Product Images</label>
              <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Format:</span>
                <select 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-[#4A1521] focus:ring-2 focus:ring-[#4A1521]/20 outline-none transition-all" 
                  value={uploadFormat} 
                  onChange={e => setUploadFormat(e.target.value)}
                  style={{ padding: '4px 28px 4px 8px', fontSize: '13px', width: 'auto', minHeight: 'auto' }}
                >
                  <option value="image/webp">WebP (Recommended)</option>
                  <option value="image/png">PNG</option>
                </select>
              </div>
              <input 
                type="file" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-[#4A1521] focus:ring-2 focus:ring-[#4A1521]/20 outline-none transition-all" 
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

          <div className="flex flex-col md:flex-row gap-4 mb-5">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Subheading</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-[#4A1521] focus:ring-2 focus:ring-[#4A1521]/20 outline-none transition-all" 
                value={productForm.subheading} 
                onChange={e => setProductForm({...productForm, subheading: e.target.value})} 
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">&nbsp;</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, height: '40px' }}>
                <input 
                  type="checkbox" 
                  checked={productForm.isBestseller}
                  onChange={e => setProductForm({...productForm, isBestseller: e.target.checked})}
                  style={{ width: '18px', height: '18px', margin: 0 }}
                />
                ⭐ Mark as Bestseller
              </label>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-5">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Sizes (comma-separated)</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-[#4A1521] focus:ring-2 focus:ring-[#4A1521]/20 outline-none transition-all" 
                placeholder="e.g. 0, 1, 2 or S, M, L"
                value={productForm.size} 
                onChange={e => setProductForm({...productForm, size: e.target.value})} 
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Colors (comma-separated)</label>
              <input 
                type="text"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-[#4A1521] focus:ring-2 focus:ring-[#4A1521]/20 outline-none transition-all" 
                placeholder="e.g. Red, Green, Blue" 
                value={productForm.colors} 
                onChange={e => setProductForm({...productForm, colors: e.target.value})} 
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-5">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Description</label>
              <textarea 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-[#4A1521] focus:ring-2 focus:ring-[#4A1521]/20 outline-none transition-all" 
                rows="4" 
                value={productForm.description} 
                onChange={e => setProductForm({...productForm, description: e.target.value})} 
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-5" style={{ marginTop: '20px' }}>
            <div className="flex-1 flex flex-col gap-2" style={{ flex: '1 1 100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label className="text-sm font-semibold text-slate-700" style={{ margin: 0 }}>Product Variants (Specific Size/Color Pricing)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => {
                    setProductForm(prev => ({
                      ...prev,
                      variants: prev.variants.map(v => ({ ...v, price: prev.price, originalPrice: prev.originalPrice }))
                    }));
                    toast.success('Synced variant prices with base price!');
                  }} className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50 transition-all" style={{ padding: '4px 12px', fontSize: '0.85rem', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}>🔄 Sync Prices</button>
                  <button type="button" onClick={generateCombinations} className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50 transition-all" style={{ padding: '4px 12px', fontSize: '0.85rem', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}>🪄 Generate Combinations</button>
                  <button type="button" onClick={addVariant} className="bg-white text-slate-700 border border-slate-300 px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-50 transition-all" style={{ padding: '4px 12px', fontSize: '0.85rem' }}>+ Add Variant</button>
                </div>
              </div>
              
              {productForm.variants.length > 0 ? (
                <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                  <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <tr>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: '500' }}>Image</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: '500' }}>Size</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: '500' }}>Color</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: '500' }}>Price</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: '500' }}>Orig. Price</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: '500', width: '80px' }}>Stock *</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', color: '#6b7280', fontWeight: '500', width: '80px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productForm.variants.map((variant, idx) => (
                        <tr key={variant.id || idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '8px 12px' }}>
                            <select 
                              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                              value={variant.image || ''} 
                              onChange={(e) => updateVariant(idx, 'image', e.target.value)}
                            >
                              <option value="">None</option>
                              {productForm.images?.map((img, imgIdx) => (
                                <option key={img} value={img}>Image {imgIdx + 1}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <input type="text" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }} placeholder="M" value={variant.size ?? ''} onChange={(e) => updateVariant(idx, 'size', e.target.value)} />
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <input type="text" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }} placeholder="Red" value={variant.color ?? ''} onChange={(e) => updateVariant(idx, 'color', e.target.value)} />
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <input type="number" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }} min="0" step="0.01" placeholder={productForm.price ? `Base (₹${productForm.price})` : "Base"} value={variant.price ?? ''} onChange={(e) => updateVariant(idx, 'price', e.target.value)} />
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <input type="number" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }} min="0" step="0.01" placeholder={productForm.originalPrice ? `Base (₹${productForm.originalPrice})` : "Base"} value={variant.originalPrice ?? ''} onChange={(e) => updateVariant(idx, 'originalPrice', e.target.value)} />
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <input type="number" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }} required min="0" value={variant.stock ?? ''} onChange={(e) => updateVariant(idx, 'stock', e.target.value)} />
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button type="button" onClick={() => duplicateVariant(idx)} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} title="Duplicate variant">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                              </button>
                              <button type="button" onClick={() => removeVariant(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} title="Remove variant">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>No variants added. The base price and stock above will be used for all sizes and colors.</p>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 mt-4">
            <button type="button" className="bg-white text-slate-700 border border-slate-300 px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-50 transition-all mr-2" onClick={onClose}>Cancel</button>
            <button type="submit" className={`bg-[#4A1521] text-white px-5 py-2.5 rounded-lg font-semibold transition-all ${saving || uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#3A0F19]'}`} disabled={saving || uploading}>
              {saving ? 'Saving...' : 'Save Product'}
            </button>
            {!editingProduct && (
              <button 
                type="button" 
                className={`bg-white text-slate-700 border border-slate-300 px-5 py-2.5 rounded-lg font-semibold transition-all ${saving || uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`} 
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
      if (!res.ok || data.error) {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <button className="text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-full p-2 transition-all absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-xl" onClick={onClose}>&times;</button>
        <h2 className="font-serif text-2xl font-bold text-[#4A1521] m-0 p-6 border-b border-slate-200">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
        
        <form className="p-6 overflow-y-auto max-h-[70vh]" onSubmit={handleSave}>
          <div className="flex-1 flex flex-col gap-2 mb-4">
            <label className="text-sm font-semibold text-slate-700">Title *</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-[#4A1521] focus:ring-2 focus:ring-[#4A1521]/20 outline-none transition-all" 
              required 
              value={form.title} 
              onChange={e => setForm({...form, title: e.target.value})} 
            />
          </div>
          <div className="flex-1 flex flex-col gap-2 mb-4">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-[#4A1521] focus:ring-2 focus:ring-[#4A1521]/20 outline-none transition-all" 
              rows="3" 
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})} 
            />
          </div>
          
          <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 mt-4">
            <button type="button" className="bg-white text-slate-700 border border-slate-300 px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-50 transition-all mr-2" onClick={onClose}>Cancel</button>
            <button type="submit" className={`bg-[#4A1521] text-white px-5 py-2.5 rounded-lg font-semibold transition-all ${saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#3A0F19]'}`} disabled={saving}>
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <button className="text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-full p-2 transition-all absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-xl" onClick={onClose}>&times;</button>
        <h2 className="font-serif text-2xl font-bold text-[#4A1521] m-0 p-6 border-b border-slate-200">{editingSubcategory ? 'Edit Subcategory' : 'Add New Subcategory'}</h2>
        
        <form className="p-6 overflow-y-auto max-h-[70vh]" onSubmit={handleSave}>
          <div className="flex-1 flex flex-col gap-2 mb-4">
            <label className="text-sm font-semibold text-slate-700">Parent Category *</label>
            <select 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-[#4A1521] focus:ring-2 focus:ring-[#4A1521]/20 outline-none transition-all" 
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
          <div className="flex-1 flex flex-col gap-2 mb-4">
            <label className="text-sm font-semibold text-slate-700">Title *</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-[#4A1521] focus:ring-2 focus:ring-[#4A1521]/20 outline-none transition-all" 
              required 
              value={form.title} 
              onChange={e => setForm({...form, title: e.target.value})} 
            />
          </div>
          <div className="flex-1 flex flex-col gap-2 mb-4">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-[#4A1521] focus:ring-2 focus:ring-[#4A1521]/20 outline-none transition-all" 
              rows="3" 
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})} 
            />
          </div>
          
          <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 mt-4">
            <button type="button" className="bg-white text-slate-700 border border-slate-300 px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-50 transition-all mr-2" onClick={onClose}>Cancel</button>
            <button type="submit" className={`bg-[#4A1521] text-white px-5 py-2.5 rounded-lg font-semibold transition-all ${saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#3A0F19]'}`} disabled={saving}>
              {saving ? 'Saving...' : 'Save Subcategory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
