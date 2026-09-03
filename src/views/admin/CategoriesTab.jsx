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
      const res = await fetch(`/api/admin/categories?_t=${Date.now()}`);
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
    <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden mb-8 ring-1 ring-slate-900/5">
      <div className="p-6 md:px-8 border-b border-slate-200/60 bg-white/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Categories & Subcategories</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none bg-[#4A1521] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3A0F19] transition-all shadow-md active:scale-95" onClick={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }}>
            + Add Category
          </button>
          <button className="flex-1 sm:flex-none bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-all shadow-sm active:scale-95 border border-slate-200" onClick={() => { setEditingSubcategory(null); setIsSubcategoryModalOpen(true); }}>
            + Subcategory
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-6 md:p-8 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-50 border border-slate-100 rounded-xl p-6">
              <div className="h-6 bg-slate-200 rounded w-1/4 mb-3"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 md:p-8 space-y-8">
          {categories.map(cat => (
            <div key={cat.id} className="bg-slate-50 border border-slate-200/60 rounded-2xl overflow-hidden ring-1 ring-slate-900/5">
              <div className="p-5 md:p-6 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{cat.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{cat.description || 'No description provided'}</p>
                </div>
                <div className="flex gap-2">
                  <button className="bg-white text-slate-700 border border-slate-200/80 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm" onClick={() => handleEditCategory(cat)}>Edit</button>
                  <button className="bg-rose-50 text-rose-700 border border-rose-200/80 px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-100 shadow-sm" onClick={() => handleDeleteCategory(cat.id)}>Delete</button>
                </div>
              </div>

              {cat.subcategories && cat.subcategories.length > 0 && (
                <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cat.subcategories.map(sub => (
                    <div key={sub.id} className="bg-white border border-slate-200/60 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                      <div>
                        <h4 className="font-semibold text-slate-900">{sub.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{sub.description}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button className="text-slate-500 hover:text-[#4A1521] px-2 py-1 text-sm font-medium transition-colors" onClick={() => handleEditSubcategory(sub)}>Edit</button>
                        <button className="text-rose-500 hover:text-rose-700 px-2 py-1 text-sm font-medium transition-colors" onClick={() => handleDeleteSubcategory(sub.id)}>Delete</button>
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
