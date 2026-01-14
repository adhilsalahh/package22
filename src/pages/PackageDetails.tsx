import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  ChevronLeft,
  MapPin,
  Check,
  Phone,
  Mail,
} from 'lucide-react';
import { supabase, Package } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import './PackageDetailsAnimations.css'; // We will create this simple css next

export function PackageDetails() {
  const { id: packageId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pkg, setPackage] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'gallery'>('overview');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (packageId) fetchPackageDetails();
  }, [packageId]);

  const fetchPackageDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .maybeSingle();
      if (error) throw error;
      setPackage(data);

      if (data?.gallery_images && Array.isArray(data.gallery_images)) {
        setGalleryImages(data.gallery_images);
      }
    } catch (err) {
      console.error('Error fetching package:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/booking/${packageId}`, { state: { package: pkg } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-600 text-lg mb-4">Package not found</p>
        <Link to="/packages" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
          Back to Packages
        </Link>
      </div>
    );
  }

  const inclusions = Array.isArray(pkg.inclusions) ? pkg.inclusions : [];
  const facilities = Array.isArray(pkg.facilities) ? pkg.facilities : [];
  const itinerary = Array.isArray(pkg.itinerary) ? pkg.itinerary : [];
  const contactInfo = pkg.contact_info || {};

  return (
    <div className="min-h-screen bg-gray-50 pb-20 fade-in">
      {/* Hero Section with Parallax-like effect */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <img
          src={pkg.image_url || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021'}
          alt={pkg.title}
          className="absolute inset-0 w-full h-full object-cover transform hover:scale-105 transition-transform duration-[10s]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-8 sm:p-12">
          <div className="max-w-7xl mx-auto w-full slide-up">
            <Link to="/packages" className="text-white/80 hover:text-white mb-6 flex items-center w-fit transition-colors">
              <ChevronLeft className="h-5 w-5 mr-1" /> Back to Packages
            </Link>
            <div className="flex flex-wrap items-center gap-4 text-emerald-400 mb-2 font-medium tracking-wide uppercase text-sm">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {pkg.destination}</span>
              <span className="bg-white/20 h-1 w-1 rounded-full"></span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {pkg.duration_days} Days / {pkg.duration_days - 1} Nights</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">{pkg.title}</h1>
            <div className="flex flex-wrap gap-4">
              <button onClick={handleBookNow} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-1">
                Book Now - ₹{pkg.price_per_head}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

          {/* Navigation Tabs */}
          <div className="flex border-b overflow-x-auto">
            {(['overview', 'itinerary', 'gallery'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-center font-semibold text-sm uppercase tracking-wider transition-colors min-w-[120px] ${activeTab === tab ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-10 min-h-[400px]">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 fade-in">
                <div className="lg:col-span-2 space-y-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">About this Trip</h3>
                    <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">{pkg.description}</p>
                  </div>

                  {(inclusions.length > 0) && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">What's Included</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {inclusions.map((inc, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-100">
                            <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{typeof inc === 'object' ? (inc as any).text : inc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(facilities.length > 0) && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Facilities</h3>
                      <div className="flex flex-wrap gap-3">
                        {facilities.map((fac, i) => (
                          <span key={i} className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium border border-gray-200">
                            {typeof fac === 'object' ? (fac as any).text : fac}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 sticky top-24">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Starting from</p>
                        <p className="text-3xl font-bold text-emerald-600">₹{pkg.price_per_head.toLocaleString()}</p>
                      </div>
                      <span className="text-sm text-gray-500 mb-1">per person</span>
                    </div>
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Advance Payment</span>
                        <span className="font-medium">₹{pkg.advance_payment}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Max Capacity</span>
                        <span className="font-medium">{pkg.max_capacity} people</span>
                      </div>
                    </div>

                    <button onClick={handleBookNow} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-emerald-500/20 transition-all mb-4">
                      Book Now
                    </button>

                    {(contactInfo.phone || contactInfo.email) && (
                      <div className="border-t pt-4 mt-4">
                        <p className="text-sm font-medium text-gray-900 mb-2">Need Help?</p>
                        {contactInfo.phone && (
                          <a href={`tel:${contactInfo.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 mb-1 transition-colors">
                            <Phone className="h-4 w-4" /> {contactInfo.phone}
                          </a>
                        )}
                        {contactInfo.email && (
                          <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
                            <Mail className="h-4 w-4" /> {contactInfo.email}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'itinerary' && (
              <div className="max-w-4xl mx-auto py-4 fade-in">
                {itinerary.length > 0 ? (
                  <div className="space-y-8 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-200">
                    {itinerary.map((day, i) => (
                      <div key={i} className="relative pl-12 group">
                        <div className="absolute left-0 top-1 h-10 w-10 bg-emerald-100 rounded-full border-4 border-white flex items-center justify-center text-emerald-600 font-bold z-10 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          {day.day}
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{day.title}</h3>
                          <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">{day.description}</div>
                          {/* If activities exist in complex object */}
                          {(day as any).activities && (
                            <div className="mt-4 space-y-2">
                              {(day as any).activities.map((act: any, idx: number) => (
                                <div key={idx} className="flex gap-2 text-sm text-gray-700">
                                  <span className="font-medium min-w-[80px] text-emerald-600">{act.time}</span>
                                  <span>{act.activity}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 italic">Itinerary details coming soon.</p>
                )}
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 fade-in">
                {galleryImages.length > 0 ? (
                  galleryImages.map((img, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden cursor-pointer group">
                      <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-gray-500 italic">No gallery images available</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
