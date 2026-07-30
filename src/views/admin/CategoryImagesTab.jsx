"use client";
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ConfirmDialog } from './AdminModals';

export default function CategoryImagesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catImageUploading, setCatImageUploading] = useState(null);
  const [catImageRemoving, setCatImageRemoving] = useState(null);
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

  const handleCategoryImageUpload = async (categoryId, file) => {
    if (!file) return;
    setCatImageUploading(categoryId);
    try {
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
      <div className="section-header">
        <h2>Category Images</h2>
        <p className="subtitle">Upload dedicated thumbnails for your categories.</p>
      </div>

      {loading ? (
        <div className="loading-state">Loading categories...</div>
      ) : (
        <div className="cat-images-grid">
          {categories.map((cat) => (
            <div key={cat.id} className="cat-image-card">
              <div className="cat-image-preview">
                {cat.thumbnailUrl ? (
                  <img src={cat.thumbnailUrl} alt={cat.title} className="thumbnail" />
                ) : (
                  <div className="placeholder-thumbnail">No Thumbnail</div>
                )}
              </div>
              <div className="cat-image-info">
                <h3>{cat.title}</h3>
                <div className="cat-image-actions">
                  <label className="btn btn-primary btn-sm upload-label">
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
