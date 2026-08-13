import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './Admin.css';
import '../../components/Checkout.css';

export default function SettingsTab() {
  const [settings, setSettings] = useState({
    isSaleActive: false,
    saleDiscountPercentage: 0,
    saleBannerUrl: '',
    saleTitle: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings({
            isSaleActive: data.settings.isSaleActive || false,
            saleDiscountPercentage: data.settings.saleDiscountPercentage || 0,
            saleBannerUrl: data.settings.saleBannerUrl || '',
            saleTitle: data.settings.saleTitle || '',
          });
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Settings saved successfully');
      } else {
        toast.error(data.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.success) {
        setSettings(prev => ({ ...prev, saleBannerUrl: data.url }));
        toast.success('Banner image uploaded successfully');
      } else {
        toast.error(data.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return <div className="admin-content-card" style={{ textAlign: 'center', padding: '40px' }}>Loading Settings...</div>;
  }

  return (
    <div className="admin-content-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="admin-title" style={{ fontSize: '1.25rem' }}>Marketing & Settings</h2>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="btn btn-primary"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="form-group" style={{ marginBottom: '32px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}>
          <input 
            type="checkbox" 
            checked={settings.isSaleActive} 
            onChange={(e) => setSettings({ ...settings, isSaleActive: e.target.checked })}
            style={{ width: '20px', height: '20px', marginRight: '12px' }}
          />
          Enable Special Sale Sitewide
        </label>
        <p style={{ color: 'var(--text-light)', marginTop: '8px', marginLeft: '32px' }}>
          When active, this will apply the discount percentage below to all orders, and show the top announcement bar and homepage banner.
        </p>
      </div>

      <div className="admin-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="form-group">
          <label>Discount Percentage (%)</label>
          <input 
            type="number" 
            min="0"
            max="100"
            value={settings.saleDiscountPercentage} 
            onChange={(e) => setSettings({ ...settings, saleDiscountPercentage: parseFloat(e.target.value) || 0 })}
            className="form-input"
            placeholder="e.g. 15"
          />
        </div>

        <div className="form-group">
          <label>Announcement Bar Text</label>
          <input 
            type="text" 
            value={settings.saleTitle} 
            onChange={(e) => setSettings({ ...settings, saleTitle: e.target.value })}
            className="form-input"
            placeholder="e.g. 🎉 SPECIAL SALE: FLAT 15% OFF on Total Order Value!"
          />
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '24px' }}>
        <label>Homepage Sale Banner Image</label>
        {settings.saleBannerUrl && (
          <div style={{ marginBottom: '16px' }}>
            <img 
              src={settings.saleBannerUrl} 
              alt="Sale Banner Preview" 
              style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            {isUploading ? 'Uploading...' : (settings.saleBannerUrl ? 'Change Banner' : 'Upload Banner')}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              style={{ display: 'none' }}
              disabled={isUploading}
            />
          </label>
          {settings.saleBannerUrl && (
            <button 
              type="button" 
              onClick={() => setSettings({ ...settings, saleBannerUrl: '' })}
              className="btn btn-secondary" 
              style={{ color: 'var(--maroon)' }}
            >
              Remove
            </button>
          )}
        </div>
        <p style={{ color: 'var(--text-light)', marginTop: '8px', fontSize: '0.9rem' }}>
          This image will replace the default homepage hero banner when the sale is active.
        </p>
      </div>
    </div>
  );
}
