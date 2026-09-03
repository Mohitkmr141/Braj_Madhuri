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
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-200/40 p-10 max-w-md w-full text-center">
          <form onSubmit={handleLogin} className="flex flex-col">
            <h2 className="font-serif text-3xl font-bold text-[#4A1521] mb-8 tracking-tight">Admin Access</h2>
            {error && (
              <div className="bg-rose-50 text-rose-700 border border-rose-200/60 px-4 py-3 rounded-xl text-sm font-medium mb-6 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
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
                className="w-full text-center tracking-[0.2em] text-lg p-4 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:bg-white focus:border-[#4A1521] focus:ring-4 focus:ring-[#4A1521]/10 transition-all shadow-sm"
              />
            </div>
            <button 
              type="submit" 
              className="w-full p-4 bg-[#4A1521] text-white rounded-xl font-semibold hover:bg-[#3A0F19] transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              Login to Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans p-4 md:p-8 pb-24 selection:bg-[#4A1521]/10 selection:text-[#4A1521]">
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '12px', padding: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' } }} />
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-sm sticky top-2 sm:top-4 z-50 mb-6 sm:mb-8 transition-all w-full overflow-hidden">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
            <div className="flex justify-between items-center w-full sm:w-auto">
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#4A1521] m-0 tracking-tight whitespace-nowrap">Admin Dashboard</h1>
              {/* Mobile Logout Button (Visible only on small screens) */}
              <button 
                onClick={handleLogout} 
                className="sm:hidden bg-white text-slate-600 border border-slate-200/80 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-rose-50 hover:text-rose-700 transition-all shadow-sm"
              >
                Logout
              </button>
            </div>
            
            <div className="flex items-center bg-slate-100/80 p-1.5 rounded-xl gap-1 overflow-x-auto w-full sm:w-auto ring-1 ring-inset ring-slate-900/5 snap-x">
              {['orders', 'inventory', 'categories', 'categoryImages', 'settings'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-all whitespace-nowrap snap-start shrink-0 ${
                    activeTab === tab 
                      ? 'bg-white text-[#4A1521] shadow-sm ring-1 ring-slate-900/5 font-semibold' 
                      : 'text-slate-500 font-medium hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {tab === 'orders' ? 'Orders' : tab === 'inventory' ? 'Products' : tab === 'categories' ? 'Categories' : tab === 'categoryImages' ? 'Images' : 'Settings'}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Logout Button */}
          <button 
            onClick={handleLogout} 
            className="hidden sm:block bg-white text-slate-600 border border-slate-200/80 px-5 py-2 rounded-xl text-sm font-medium hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-all shadow-sm whitespace-nowrap shrink-0"
          >
            Logout
          </button>
        </div>

        {/* Active Tab Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'inventory' && <ProductsTab />}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'categoryImages' && <CategoryImagesTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}
