"use client";
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { ConfirmDialog } from './AdminModals';

import Image from 'next/image';

export default function CategoryImagesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catImageUploading, setCatImageUploading] = useState(null);
  const [catImageRemoving, setCatImageRemoving] = useState(null);
  const [uploadFormat, setUploadFormat] = useState('image/webp');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      } else {
        toast.error(data.error || 'Failed to fetch categories.');
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCategoryImageUpload = async (categoryId, originalFile) => {
    if (!originalFile) return;
    setCatImageUploading(categoryId);
    try {
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

      const fd = new FormData();
      fd.append('file', file);
      fd.append('categoryId', categoryId);
      const res = await fetch('/api/admin/category-image', { method: 'PUT', body: fd });
      const data = await res.json();
      if (data.success) {
        toast.success('Image uploaded!');
        fetchCategories();
      } else {
        toast.error('Upload failed: ' + data.error);
      }
    } catch {
      toast.error('Error uploading image.');
    } finally {
      setCatImageUploading(null);
    }
  };

  const handleCategoryImageRemove = (categoryId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Thumbnail',
      message: 'Remove this category thumbnail? It will fall back to the first product image.',
      onConfirm: async () => {
        setConfirmDialog(prev => ({...prev, isOpen: false}));
        setCatImageRemoving(categoryId);
        try {
          const res = await fetch('/api/admin/category-image', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoryId }),
          });
          const data = await res.json();
          if (data.success) {
            toast.success('Thumbnail removed!');
            fetchCategories();
          } else {
            toast.error('Remove failed: ' + data.error);
          }
        } catch {
          toast.error('Error removing image.');
        } finally {
          setCatImageRemoving(null);
        }
      }
    });
  };

  return (
    <div className="tab-pane">
      <div className="admin-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="font-semibold text-maroon" style={{margin:0, fontSize: '20px'}}>Category Images</h2>
          <p className="text-muted text-sm" style={{margin:'4px 0 0 0'}}>Upload dedicated thumbnails for your categories.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Format:</span>
          <select 
            className="form-select" 
            value={uploadFormat} 
            onChange={e => setUploadFormat(e.target.value)}
            style={{ padding: '4px 28px 4px 8px', fontSize: '13px', width: 'auto', minHeight: 'auto' }}
          >
            <option value="image/webp">WebP (Recommended)</option>
            <option value="image/png">PNG</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading categories...</div>
      ) : (
        <div className="cat-images-grid">
          {categories.map((cat) => (
            <div key={cat.id} className="cat-image-card">
              <div className="cat-image-preview">
                {cat.thumbnailUrl ? (
                  <Image src={cat.thumbnailUrl} alt={cat.title} className="thumbnail" width={150} height={150} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                ) : (
                  <div className="placeholder-thumbnail">No Thumbnail</div>
                )}
              </div>
              <div className="cat-image-info">
                <h3>{cat.title}</h3>
                <div className="cat-image-actions">
                  <label className="cat-image-upload-label">
                    {catImageUploading === cat.id ? 'Uploading...' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden-input"
                      onChange={(e) => handleCategoryImageUpload(cat.id, e.target.files[0])}
                      disabled={catImageUploading === cat.id || catImageRemoving === cat.id}
                    />
                  </label>
                  {cat.thumbnailUrl && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleCategoryImageRemove(cat.id)}
                      disabled={catImageUploading === cat.id || catImageRemoving === cat.id}
                    >
                      {catImageRemoving === cat.id ? 'Removing...' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
