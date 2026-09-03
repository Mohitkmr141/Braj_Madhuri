import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';


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
    return <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-6" style={{ textAlign: 'center', padding: '60px' }}>Loading Settings...</div>;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-2" style={{ margin: 0, fontSize: '22px' }}>Marketing & Sitewide Settings</h2>
          <p className="text-sm text-muted" style={{ margin: '4px 0 0' }}>Manage sitewide discounts, promotion banners, and announcements</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-[#4A1521] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#3A0F19] transition-all"
        >
          {isSaving ? 'Saving...' : '💾 Save Settings'}
        </button>
      </div>

      <div className="flex flex-col gap-2 mb-5" style={{ marginBottom: '32px', background: 'var(--admin-bg)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' }}>
          <input 
            type="checkbox" 
            checked={settings.isSaleActive} 
            onChange={(e) => setSettings({ ...settings, isSaleActive: e.target.checked })}
            style={{ width: '20px', height: '20px', marginRight: '12px', cursor: 'pointer', accentColor: 'var(--admin-maroon)' }}
          />
          🔥 Enable Sitewide Special Sale & Promotional Discount
        </label>
        <p className="text-sm text-muted" style={{ marginTop: '8px', marginLeft: '32px', lineHeight: '1.5' }}>
          When enabled, the discount percentage configured below will be applied at checkout, and the promotional sale banner will display across the store.
        </p>
      </div>

      <div className="form-row">
        <div className="form-col">
          <label className="text-sm font-semibold text-slate-700">Discount Percentage (%)</label>
          <input 
            type="number" 
            min="0"
            max="100"
            value={settings.saleDiscountPercentage} 
            onChange={(e) => setSettings({ ...settings, saleDiscountPercentage: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-[#4A1521] focus:ring-2 focus:ring-[#4A1521]/20 outline-none transition-all"
            placeholder="e.g. 15"
          />
        </div>

        <div className="form-col">
          <label className="text-sm font-semibold text-slate-700">Announcement Bar Promo Text</label>
          <input 
            type="text" 
            value={settings.saleTitle} 
            onChange={(e) => setSettings({ ...settings, saleTitle: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-[#4A1521] focus:ring-2 focus:ring-[#4A1521]/20 outline-none transition-all"
            placeholder="e.g. 🎉 SPECIAL SALE: FLAT 15% OFF on Total Order Value!"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-5" style={{ marginTop: '24px' }}>
        <label className="text-sm font-semibold text-slate-700">Homepage Sale Banner Image</label>
        {settings.saleBannerUrl && (
          <div style={{ marginBottom: '16px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-light)', maxWidth: '600px' }}>
            <img 
              src={settings.saleBannerUrl} 
              alt="Sale Banner Preview" 
              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '280px', objectFit: 'cover' }}
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
            {isUploading ? 'Uploading...' : (settings.saleBannerUrl ? '🔄 Change Banner Image' : '📤 Upload Banner Image')}
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
              className="btn btn-danger btn-sm" 
            >
              🗑️ Remove Banner
            </button>
          )}
        </div>
        <p className="text-xs text-muted" style={{ marginTop: '8px' }}>
          Recommended size: 1920x600px. This banner replaces the hero banner on the homepage while the promotional sale is active.
        </p>
      </div>
    </div>
  );
}
