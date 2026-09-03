"use client";

import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import OrdersTab from './OrdersTab';
import ProductsTab from './ProductsTab';
import CategoriesTab from './CategoriesTab';
import CategoryImagesTab from './CategoryImagesTab';
import SettingsTab from './SettingsTab';

export default function AdminLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('orders');

  React.useEffect(() => {
    fetch('/api/admin/products')
      .then((res) => {
        if (res.ok) {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {})
      .finally(() => setIsCheckingAuth(false));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
      } else {
        setError(data.error || 'Incorrect Master Password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setPassword('');
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-sm font-medium">Loading Admin Workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 max-w-md w-full text-center">
          <form onSubmit={handleLogin} className="flex flex-col">
            <h2 className="font-serif text-2xl font-bold text-[#4A1521] mb-8">Admin Access</h2>
            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-md text-sm font-semibold mb-6">
                {error}
              </div>
            )}
            <div className="mb-8">
              <input 
                type="password" 
                placeholder="Enter Master Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="w-full text-center tracking-widest text-lg p-4 border border-slate-300 rounded-lg outline-none focus:border-[#4A1521] focus:ring-4 focus:ring-[#4A1521]/10 transition-all"
              />
            </div>
            <button 
              type="submit" 
              className="w-full p-3.5 bg-[#4A1521] text-white rounded-lg font-semibold hover:bg-[#3A0F19] transition-all shadow-md"
            >
              Login to Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 pb-20">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-5 bg-white border border-slate-200 rounded-xl p-4 md:px-6 shadow-sm sticky top-4 z-50 mb-7">
          <div className="flex items-center gap-6 flex-wrap">
            <h1 className="font-serif text-2xl font-bold text-[#4A1521] m-0 whitespace-nowrap">Admin Dashboard</h1>
            
            <div className="inline-flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 gap-0.5 overflow-x-auto max-w-full">
              {['orders', 'inventory', 'categories', 'categoryImages', 'settings'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab 
                      ? 'bg-white text-[#4A1521] shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {tab === 'orders' ? 'Orders' : tab === 'inventory' ? 'Products' : tab === 'categories' ? 'Categories' : tab === 'categoryImages' ? 'Images' : 'Settings'}
                </button>
              ))}
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all whitespace-nowrap"
          >
            Logout
          </button>
        </div>

        {/* Active Tab Content */}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'inventory' && <ProductsTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'categoryImages' && <CategoryImagesTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}
