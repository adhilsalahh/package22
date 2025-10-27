import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, IndianRupee, Clock, ChevronLeft, MapPin, Users, Check, Phone, Mail, Globe } from 'lucide-react';
import { supabase, Package, PackageDate } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function PackageDetails() {
  const { id: packageId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pkg, setPackage] = useState<Package | null>(null);
  const [dates, setDates] = useState<PackageDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<PackageDate | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (packageId) {
      fetchPackageDetails();
    }
  }, [packageId]);

  const fetchPackageDetails = async () => {
    if (!packageId) return;

    try {
      const [pkgResponse, datesResponse] = await Promise.all([
        supabase.from('packages').select('*').eq('id', packageId).maybeSingle(),
        supabase.from('package_dates').select('*').eq('package_id', packageId).order('available_date'),
      ]);

      if (pkgResponse.error) throw pkgResponse.error;
      if (datesResponse.error) throw datesResponse.error;

      setPackage(pkgResponse.data);
      setDates(datesResponse.data || []);
    } catch (error) {
      console.error('Error fetching package details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!selectedDate) {
      alert('Please select a travel date');
      return;
    }

    const availableSeats = selectedDate.max_bookings - selectedDate.current_bookings;
    if (availableSeats <= 0) {
      alert('No seats available for this date');
      return;
    }

    navigate(`/booking/${packageId}`, { state: { package: pkg, date: selectedDate } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 text-lg">Package not found</p>
          <Link
            to="/packages"
            className="mt-4 text-blue-600 hover:underline inline-block"
          >
            Back to Packages
          </Link>
        </div>
      </div>
    );
  }

  const inclusions = Array.isArray(pkg.inclusions) ? pkg.inclusions : [];
  const facilities = Array.isArray(pkg.facilities) ? pkg.facilities : [];
  const itinerary = Array.isArray(pkg.itinerary) ? pkg.itinerary : [];
  const galleryImages = Array.isArray(pkg.gallery_images) ? pkg.gallery_images : [];
  const contactInfo = pkg.contact_info || {};

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/packages"
          className="text-blue-600 hover:text-blue-700 mb-6 flex items-center"
        >
          <ChevronLeft className="h-5 w-5" />
          Back to Packages
        </Link>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="relative h-96 bg-gray-200">
            {pkg.image_url ? (
              <img
                src={pkg.image_url}
                alt={pkg.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                <Calendar className="h-24 w-24 text-white opacity-50" />
              </div>
            )}
          </div>

          <div className="p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{pkg.title}</h1>

            <div className="flex items-center space-x-6 mb-6">
              <div className="flex items-center text-gray-700">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                <span className="font-medium">{pkg.destination}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                <span>{pkg.duration_days} days</span>
              </div>
              <div className="flex items-center text-blue-600 font-bold text-2xl">
                <IndianRupee className="h-6 w-6" />
                <span>{pkg.price_per_head?.toLocaleString()}</span>
                <span className="text-sm text-gray-600 ml-2">per person</span>
              </div>
            </div>

            <div className="prose max-w-none mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Description</h2>
              <p className="text-gray-600 whitespace-pre-line">{pkg.description}</p>
            </div>

            {inclusions.length > 0 && (
              <div className="mb-8 bg-green-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Check className="h-6 w-6 mr-2 text-green-600" />
                  What's Included
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {inclusions.map((inclusion: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{inclusion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {facilities.length > 0 && (
              <div className="mb-8 bg-blue-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Facilities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {facilities.map((facility: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{facility}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {itinerary.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Day-by-Day Itinerary</h2>
                <div className="space-y-4">
                  {itinerary.map((day: any, index: number) => (
                    <div key={index} className="bg-white border-l-4 border-blue-600 shadow-sm rounded-r-lg p-6 hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">Day {day.day}: {day.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{day.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {galleryImages.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Photo Gallery</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {galleryImages.map((imageUrl: string, index: number) => (
                    <div key={index} className="relative h-64 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow group">
                      <img
                        src={imageUrl}
                        alt={`${pkg.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(contactInfo.phone || contactInfo.email || contactInfo.website) && (
              <div className="mb-8 bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h2>
                <div className="space-y-2">
                  {contactInfo.phone && (
                    <div className="flex items-center text-gray-700">
                      <Phone className="h-5 w-5 mr-3 text-blue-600" />
                      <a href={`tel:${contactInfo.phone}`} className="hover:text-blue-600">
                        {contactInfo.phone}
                      </a>
                    </div>
                  )}
                  {contactInfo.email && (
                    <div className="flex items-center text-gray-700">
                      <Mail className="h-5 w-5 mr-3 text-blue-600" />
                      <a href={`mailto:${contactInfo.email}`} className="hover:text-blue-600">
                        {contactInfo.email}
                      </a>
                    </div>
                  )}
                  {contactInfo.website && (
                    <div className="flex items-center text-gray-700">
                      <Globe className="h-5 w-5 mr-3 text-blue-600" />
                      <a
                        href={contactInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600"
                      >
                        {contactInfo.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {dates.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Dates</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dates.map((date) => {
                    const formattedDate = new Date(date.available_date).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    });
                    const isSelected = selectedDate?.id === date.id;
                    const availableSeats = date.max_bookings - date.current_bookings;
                    const isAvailable = availableSeats > 0;

                    return (
                      <button
                        key={date.id}
                        onClick={() => isAvailable && setSelectedDate(date)}
                        disabled={!isAvailable}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50'
                            : isAvailable
                            ? 'border-gray-200 hover:border-blue-400 bg-white'
                            : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Calendar className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span
                            className={`text-sm font-semibold ${
                              isAvailable ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {availableSeats} seats
                          </span>
                        </div>
                        <p className="text-gray-800 font-medium">{formattedDate}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Advance Payment Required</p>
                  <p className="text-3xl font-bold text-green-600">₹{pkg.advance_payment}</p>
                  <p className="text-sm text-gray-600 mt-1">per person</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Remaining Balance</p>
                  <p className="text-3xl font-bold text-gray-800">
                    ₹{pkg.price_per_head - pkg.advance_payment}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">per person</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleBookNow}
              disabled={!selectedDate || (selectedDate && (selectedDate.max_bookings - selectedDate.current_bookings) <= 0)}
              className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {!selectedDate ? 'Select a Date to Continue' : 'Book Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
