"use client";

import React, { useState } from 'react';
import './Admin.css';
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--admin-bg)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Loading Admin Workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-login-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--admin-bg)', padding: '24px' }}>
        <div className="admin-card-padded" style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
          <form onSubmit={handleLogin} className="login-form">
            <h2 className="admin-title" style={{ marginBottom: '32px' }}>Admin Access</h2>
            {error && <div className="status-badge cancelled" style={{ marginBottom: '24px', display: 'block', padding: '8px 12px' }}>{error}</div>}
            <div className="form-group" style={{ marginBottom: '32px' }}>
              <input 
                type="password" 
                placeholder="Enter Master Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="form-input"
                style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '18px', padding: '16px' }}
              />
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: '14px', fontSize: '16px' }}>
              Login to Dashboard
            </button>
          </form>
        </div>
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
              {['orders', 'inventory', 'categories', 'categoryImages', 'settings'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`admin-tab-btn ${activeTab === tab ? 'active' : ''}`}
                >
                  {tab === 'orders' ? 'Orders' : tab === 'inventory' ? 'Products' : tab === 'categories' ? 'Categories' : tab === 'categoryImages' ? '🖼️ Category Images' : '⚙️ Marketing & Settings'}
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
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}
