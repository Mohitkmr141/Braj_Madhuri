"use client";
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { CategoryModal, SubcategoryModal, ConfirmDialog } from './AdminModals';

export default function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
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

  const handleDeleteCategory = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Category',
      message: 'WARNING: Are you sure you want to delete this category? This will permanently delete ALL subcategories and products inside it!',
      onConfirm: async () => {
        setConfirmDialog(prev => ({...prev, isOpen: false}));
        try {
          const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            toast.success('Category deleted!');
            fetchCategories();
          } else {
            toast.error('Failed to delete category: ' + data.error);
          }
        } catch {
          toast.error('Error deleting category.');
        }
      }
    });
  };

  const handleDeleteSubcategory = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Subcategory',
      message: 'WARNING: Are you sure you want to delete this subcategory? All products inside it will also be deleted!',
      onConfirm: async () => {
        setConfirmDialog(prev => ({...prev, isOpen: false}));
        try {
          const res = await fetch(`/api/admin/subcategories?id=${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            toast.success('Subcategory deleted!');
            fetchCategories();
          } else {
            toast.error('Failed to delete subcategory: ' + data.error);
          }
        } catch {
          toast.error('Error deleting subcategory.');
        }
      }
    });
  };

  const handleEditCategory = (cat) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };

  const handleEditSubcategory = (sub) => {
    setEditingSubcategory(sub);
    setIsSubcategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  const closeSubcategoryModal = () => {
    setIsSubcategoryModalOpen(false);
    setEditingSubcategory(null);
  };

  return (
    <div className="tab-pane">
      <div className="admin-toolbar">
        <button 
          className="btn btn-primary" 
          onClick={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }}
        >
          + Add New Category
        </button>
        <button 
          className="btn btn-outline"
          onClick={() => { setEditingSubcategory(null); setIsSubcategoryModalOpen(true); }}
        >
          + Add New Subcategory
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading categories...</div>
      ) : (
        <div className="category-list">
          {categories.map(cat => (
            <div key={cat.id} className="category-item">
              <div className="category-header">
                <div className="category-info">
                  <h3>{cat.title}</h3>
                  <p>{cat.description}</p>
                </div>
                <div className="category-actions flex flex-col gap-2">
                  <button className="btn btn-outline btn-sm" onClick={() => handleEditCategory(cat)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCategory(cat.id)}>Delete</button>
                </div>
              </div>

              {cat.subcategories && cat.subcategories.length > 0 && (
                <div className="subcategory-list">
                  {cat.subcategories.map(sub => (
                    <div key={sub.id} className="subcategory-item">
                      <div className="subcategory-info">
                        <h4>{sub.title}</h4>
                        <p>{sub.description}</p>
                      </div>
                      <div className="subcategory-actions flex gap-2">
                        <button className="btn btn-outline btn-sm" onClick={() => handleEditSubcategory(sub)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteSubcategory(sub.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isCategoryModalOpen && (
        <CategoryModal
          editingCategory={editingCategory}
          isOpen={isCategoryModalOpen}
          onClose={closeCategoryModal}
          onSaved={() => { closeCategoryModal(); fetchCategories(); }}
        />
      )}

      {isSubcategoryModalOpen && (
        <SubcategoryModal
          editingSubcategory={editingSubcategory}
          categories={categories}
          isOpen={isSubcategoryModalOpen}
          onClose={closeSubcategoryModal}
          onSaved={() => { closeSubcategoryModal(); fetchCategories(); }}
        />
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
