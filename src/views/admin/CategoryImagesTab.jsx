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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between items-center gap-4 p-5 bg-white border-b border-slate-200">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#4A1521] m-0 leading-tight">Category Images</h2>
          <p className="text-slate-500 text-sm mt-1">Upload dedicated thumbnails for your categories.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Format:</span>
          <select 
            className="border border-slate-300 rounded-lg text-slate-700 py-1 pl-2 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A1521]" 
            value={uploadFormat} 
            onChange={e => setUploadFormat(e.target.value)}
          >
            <option value="image/webp">WebP (Recommended)</option>
            <option value="image/png">PNG</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="w-full aspect-square bg-slate-50 relative border-b border-slate-100">
                {cat.thumbnailUrl ? (
                  <Image src={cat.thumbnailUrl} alt={cat.title} className="w-full h-full object-cover" width={150} height={150} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No Thumbnail</div>
                )}
              </div>
              <div className="p-4 flex flex-col gap-3 flex-1">
                <h3 className="text-base font-bold text-slate-900 m-0 truncate">{cat.title}</h3>
                <div className="flex gap-2 mt-auto">
                  <label className="cursor-pointer text-center bg-white text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all flex-1">
                    {catImageUploading === cat.id ? 'Uploading...' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleCategoryImageUpload(cat.id, e.target.files[0])}
                      disabled={catImageUploading === cat.id || catImageRemoving === cat.id}
                    />
                  </label>
                  {cat.thumbnailUrl && (
                    <button
                      className="text-center bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-100 transition-all flex-1"
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
