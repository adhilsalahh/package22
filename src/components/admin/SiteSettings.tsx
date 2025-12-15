import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Plus, Trash2, Image as ImageIcon, Palette, Layout } from 'lucide-react';

interface SiteSetting {
  id: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string;
  header_logo_url: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  trekking_images: Array<{ title: string; image_url: string; description: string }>;
  gallery_images: Array<{ title: string; image_url: string; description?: string }>;
}

export function SiteSettings() {
  const [settings, setSettings] = useState<SiteSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        // Ensure arrays exist
        setSettings({
          ...data,
          trekking_images: data.trekking_images || [],
          gallery_images: data.gallery_images || []
        });
      } else {
        // Default structure if empty
        setSettings({
          id: '',
          hero_title: 'Welcome to Va Oru Trippadikkam',
          hero_subtitle: 'Your trusted partner for package booking and tracking',
          hero_image_url: '',
          header_logo_url: '/Va oru trippadikkam.jpg',
          primary_color: '#059669',
          secondary_color: '#0d9488',
          font_family: 'Inter, sans-serif',
          trekking_images: [],
          gallery_images: []
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      if (settings.id) {
        const { error } = await supabase
          .from('site_settings')
          .update({
            hero_title: settings.hero_title,
            hero_subtitle: settings.hero_subtitle,
            hero_image_url: settings.hero_image_url,
            header_logo_url: settings.header_logo_url,
            primary_color: settings.primary_color,
            secondary_color: settings.secondary_color,
            font_family: settings.font_family,
            trekking_images: settings.trekking_images,
            gallery_images: settings.gallery_images,
            updated_at: new Date().toISOString()
          })
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([{
            hero_title: settings.hero_title,
            hero_subtitle: settings.hero_subtitle,
            hero_image_url: settings.hero_image_url,
            header_logo_url: settings.header_logo_url,
            primary_color: settings.primary_color,
            secondary_color: settings.secondary_color,
            font_family: settings.font_family,
            trekking_images: settings.trekking_images,
            gallery_images: settings.gallery_images
          }]);
        if (error) throw error;
        fetchSettings(); // Refresh to get ID
      }
      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof SiteSetting, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  // Generic array updater
  const updateArrayItem = (arrayField: 'trekking_images' | 'gallery_images', index: number, field: string, value: string) => {
    if (!settings) return;
    const newArray = [...settings[arrayField]];
    newArray[index] = { ...newArray[index], [field]: value };
    setSettings({ ...settings, [arrayField]: newArray });
  };

  const removeArrayItem = (arrayField: 'trekking_images' | 'gallery_images', index: number) => {
    if (!settings) return;
    const newArray = settings[arrayField].filter((_, i) => i !== index);
    setSettings({ ...settings, [arrayField]: newArray });
  };

  const addArrayItem = (arrayField: 'trekking_images' | 'gallery_images') => {
    if (!settings) return;
    setSettings({
      ...settings,
      [arrayField]: [...settings[arrayField], { title: '', image_url: '', description: '' }]
    });
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
  if (!settings) return <div className="p-8 text-center text-red-500">Failed to load settings</div>;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Site Settings</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-8">

        {/* HERO SECTION */}
        <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Layout className="h-5 w-5 text-blue-600" /> Hero Section
          </h3>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Main Title</label>
              <input
                type="text"
                value={settings.hero_title}
                onChange={(e) => updateField('hero_title', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <textarea
                value={settings.hero_subtitle}
                onChange={(e) => updateField('hero_subtitle', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image URL (Background)</label>
              <input
                type="text"
                value={settings.hero_image_url}
                onChange={(e) => updateField('hero_image_url', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Header Logo URL</label>
              <input
                type="text"
                value={settings.header_logo_url || ''}
                onChange={(e) => updateField('header_logo_url', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="/Va oru trippadikkam.jpg"
              />
            </div>
          </div>
        </section>

        {/* THEME SETTINGS */}
        <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-600" /> Theme & Colors
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => updateField('primary_color', e.target.value)}
                  className="h-10 w-20 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primary_color}
                  onChange={(e) => updateField('primary_color', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) => updateField('secondary_color', e.target.value)}
                  className="h-10 w-20 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.secondary_color}
                  onChange={(e) => updateField('secondary_color', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
              <select
                value={settings.font_family}
                onChange={(e) => updateField('font_family', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Inter, sans-serif">Inter (Default)</option>
                <option value="'Roboto', sans-serif">Roboto</option>
                <option value="'Open Sans', sans-serif">Open Sans</option>
                <option value="'Poppins', sans-serif">Poppins</option>
                <option value="'Lato', sans-serif">Lato</option>
                <option value="'Montserrat', sans-serif">Montserrat</option>
              </select>
            </div>
          </div>
        </section>

        {/* GALLERY IMAGES */}
        <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-green-600" /> Gallery Images
            </h3>
            <button
              onClick={() => addArrayItem('gallery_images')}
              className="text-sm bg-white border border-gray-300 hover:bg-gray-100 px-3 py-1 rounded-lg flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add Image
            </button>
          </div>

          <div className="space-y-4">
            {settings.gallery_images.map((img, index) => (
              <div key={index} className="flex gap-4 items-start bg-white p-4 rounded-lg border border-gray-200">
                <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                  {img.image_url ? (
                    <img src={img.image_url} alt="Thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    placeholder="Image URL"
                    value={img.image_url}
                    onChange={(e) => updateArrayItem('gallery_images', index, 'image_url', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Title"
                      value={img.title}
                      onChange={(e) => updateArrayItem('gallery_images', index, 'title', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={img.description || ''}
                      onChange={(e) => updateArrayItem('gallery_images', index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeArrayItem('gallery_images', index)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
