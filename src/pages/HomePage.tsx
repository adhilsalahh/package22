import { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, IndianRupee } from 'lucide-react';
import { Package } from '../types';
import { packageService } from '../services/packageService';

interface HomePageProps {
  onNavigate: (page: string, packageId?: string) => void;
}

export const HomePage = ({ onNavigate }: HomePageProps) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const data = await packageService.getAllPackages();
      setPackages(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading packages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="relative bg-cover bg-center h-96"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(https://images.pexels.com/photos/2398220/pexels-photo-2398220.jpeg)',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-5xl font-bold mb-4">Discover Your Next Adventure</h1>
            <p className="text-xl">Explore breathtaking trekking and camping experiences</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Available Packages</h2>

        {packages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No packages available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => onNavigate('package-details', pkg.id)}
              >
                <div className="h-64 overflow-hidden">
                  <img
                    src={pkg.image_url || 'https://images.pexels.com/photos/2437291/pexels-photo-2437291.jpeg'}
                    alt={pkg.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.title}</h3>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{pkg.destination}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{pkg.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span className="text-sm">{pkg.duration_days} Days</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-1" />
                      <span className="text-sm">Max {pkg.max_capacity}</span>
                    </div>
                  </div>
                  <div className="border-t pt-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center text-2xl font-bold text-emerald-600">
                        <IndianRupee className="h-6 w-6" />
                        {pkg.price_per_head}
                      </div>
                      <p className="text-xs text-gray-500">per person</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('package-details', pkg.id);
                      }}
                      className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
