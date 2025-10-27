import { useEffect, useState } from 'react';
import { supabase, Package } from '../../lib/supabase';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminPackages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackages();
  }, []);

  async function loadPackages() {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deletePackage(id: string) {
    if (!confirm('Are you sure you want to delete this package?')) return;

    try {
      const { error } = await supabase.from('packages').delete().eq('id', id);
      if (error) throw error;
      loadPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Failed to delete package');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Manage Packages</h1>
          <Link
            to="/admin/packages/create"
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Package
          </Link>
        </div>

        {packages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 text-lg">No packages created yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {packages.map((pkg) => (
              <div key={pkg.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {pkg.image_url && (
                    <div className="md:w-64 h-48 md:h-auto flex-shrink-0">
                      <img
                        src={pkg.image_url}
                        alt={pkg.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{pkg.title}</h3>
                        <p className="text-gray-600 mb-3 line-clamp-2">{pkg.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="font-medium">📍 {pkg.destination}</span>
                          <span>⏱️ {pkg.duration_days} Days</span>
                          <span className="font-semibold text-emerald-600">₹{pkg.price_per_head.toLocaleString()}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${pkg.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {pkg.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {(pkg.inclusions && pkg.inclusions.length > 0) && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-1">Inclusions:</p>
                            <div className="flex flex-wrap gap-2">
                              {pkg.inclusions.slice(0, 5).map((inc: any, idx: number) => (
                                <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  {inc.icon} {inc.text}
                                </span>
                              ))}
                              {pkg.inclusions.length > 5 && (
                                <span className="text-xs text-gray-500">+{pkg.inclusions.length - 5} more</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col md:flex-row items-center gap-2 ml-4">
                        <Link
                          to={`/admin/packages/${pkg.id}/dates`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Manage Dates"
                        >
                          <Calendar className="w-5 h-5" />
                        </Link>
                        <Link
                          to={`/admin/packages/${pkg.id}/edit`}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded transition"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => deletePackage(pkg.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
