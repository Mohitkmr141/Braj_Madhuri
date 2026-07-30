"use client";

import React, { useState } from 'react';
import './Admin.css';
import '../../components/Checkout.css';
import { Toaster } from 'react-hot-toast';
import OrdersTab from './OrdersTab';
import ProductsTab from './ProductsTab';
import CategoriesTab from './CategoriesTab';
import CategoryImagesTab from './CategoryImagesTab';

export default function AdminLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('orders');

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

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <form onSubmit={handleLogin} className="login-form">
          <h2 className="login-title">Admin Access</h2>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <input 
              type="password" 
              placeholder="Enter Master Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="form-input"
            />
          </div>
          <button className="btn-primary admin-login-submit" type="submit">
            Login to Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <div className="admin-inner">
        <div className="admin-header">
          <div className="admin-header-left">
            <h1 className="admin-title">Admin Dashboard</h1>
            <div className="admin-tabs">
              {['orders', 'inventory', 'categories', 'categoryImages'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`admin-tab-btn ${activeTab === tab ? 'active' : ''}`}
                >
                  {tab === 'orders' ? 'Orders' : tab === 'inventory' ? 'Products' : tab === 'categories' ? 'Categories' : '🖼️ Category Images'}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleLogout} className="admin-logout-btn">Logout</button>
        </div>

        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'inventory' && <ProductsTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'categoryImages' && <CategoryImagesTab />}
      </div>
    </div>
  );
}
