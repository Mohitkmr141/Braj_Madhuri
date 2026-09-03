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
    return <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-12 text-center text-slate-500 font-medium ring-1 ring-slate-900/5">Loading Settings...</div>;
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-6 md:p-8 mb-8 ring-1 ring-slate-900/5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight m-0">Marketing & Sitewide Settings</h2>
          <p className="text-sm text-slate-500 mt-1">Manage sitewide discounts, promotion banners, and announcements</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full sm:w-auto bg-[#4A1521] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#3A0F19] transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : '💾 Save Settings'}
        </button>
      </div>

      <div className="flex flex-col gap-3 mb-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60 ring-1 ring-slate-900/5">
        <label className="flex items-center gap-3 cursor-pointer text-base font-semibold text-slate-900">
          <input 
            type="checkbox" 
            checked={settings.isSaleActive} 
            onChange={(e) => setSettings({ ...settings, isSaleActive: e.target.checked })}
            className="w-5 h-5 rounded border-slate-300 text-[#4A1521] focus:ring-[#4A1521]"
          />
          Activate Sitewide Sale
        </label>
        <p className="text-sm text-slate-500 ml-8">Enable or disable the promotional announcement bar and sitewide discounts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Discount Percentage (%)</label>
          <input 
            type="number" 
            min="0"
            max="100"
            value={settings.saleDiscountPercentage} 
            onChange={(e) => setSettings({ ...settings, saleDiscountPercentage: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-slate-900 focus:bg-white focus:border-[#4A1521] focus:ring-4 focus:ring-[#4A1521]/10 outline-none transition-all shadow-sm"
            placeholder="e.g. 15"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Announcement Bar Promo Text</label>
          <input 
            type="text" 
            value={settings.saleTitle} 
            onChange={(e) => setSettings({ ...settings, saleTitle: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-slate-900 focus:bg-white focus:border-[#4A1521] focus:ring-4 focus:ring-[#4A1521]/10 outline-none transition-all shadow-sm"
            placeholder="e.g. 🎉 SPECIAL SALE: FLAT 15% OFF on Total Order Value!"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-8">
        <label className="text-sm font-semibold text-slate-700">Homepage Sale Banner Image</label>
        {settings.saleBannerUrl && (
          <div className="mb-4 rounded-xl overflow-hidden border border-slate-200/60 max-w-[600px] shadow-sm">
            <img 
              src={settings.saleBannerUrl} 
              alt="Sale Banner" 
              className="w-full h-auto block"
            />
          </div>
        )}
        <div className="flex flex-wrap gap-3 items-center">
          <label className="cursor-pointer bg-white text-slate-700 border border-slate-200/80 px-5 py-2.5 rounded-xl font-medium hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm">
            {isUploading ? 'Uploading...' : (settings.saleBannerUrl ? '📸 Change Banner Image' : '📸 Upload Banner Image')}
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }}
              onChange={handleImageUpload}
              disabled={isUploading}
            />
          </label>
          {settings.saleBannerUrl && (
            <button 
              onClick={() => setSettings({ ...settings, saleBannerUrl: '' })}
              className="bg-rose-50 text-rose-700 border border-rose-200/80 px-5 py-2.5 rounded-xl font-medium hover:bg-rose-100 transition-all shadow-sm"
            >
              🗑️ Remove Banner
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Recommended size: 1920x600px. This banner replaces the hero banner on the homepage while the promotional sale is active.
        </p>
      </div>
    </div>
  );
}
