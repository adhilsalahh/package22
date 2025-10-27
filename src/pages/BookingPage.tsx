import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase, Package, PackageDate } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Calendar, IndianRupee, Users, Trash2, Plus, UserCheck } from 'lucide-react';
import { sendBookingToWhatsApp } from '../lib/whatsapp';

interface TravelerInfo {
  name: string;
  phone: string;
  paidAdvance: boolean;
}

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();

  const packageData = location.state?.package as Package;
  const dateData = location.state?.date as PackageDate;

  const [pkg, setPkg] = useState<Package | null>(packageData || null);
  const [selectedDate, setSelectedDate] = useState<PackageDate | null>(dateData || null);
  const [loading, setLoading] = useState(false);
  const [travelers, setTravelers] = useState<TravelerInfo[]>([{ name: '', phone: '', paidAdvance: false }]);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (id && !pkg) {
      loadPackage();
    }
  }, [id]);

  async function loadPackage() {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setPkg(data);
    } catch (error) {
      console.error('Error loading package:', error);
    }
  }

  const addTraveler = () => {
    setTravelers([...travelers, { name: '', phone: '', paidAdvance: false }]);
  };

  const removeTraveler = (index: number) => {
    if (travelers.length > 1) {
      setTravelers(travelers.filter((_, i) => i !== index));
    }
  };

  const updateTraveler = (index: number, field: keyof TravelerInfo, value: string | boolean) => {
    const updated = [...travelers];
    updated[index] = { ...updated[index], [field]: value };
    setTravelers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkg || !user || !profile || !selectedDate) return;

    const numberOfPeople = travelers.length;
    const totalAmount = pkg.price_per_head * numberOfPeople;
    const advancePayment = pkg.advance_payment * numberOfPeople;
    const remainingAmount = totalAmount - advancePayment;

    const travelDate = new Date(selectedDate.available_date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    sendBookingToWhatsApp(
      pkg.title,
      pkg.destination,
      profile.full_name,
      profile.phone,
      travelers,
      travelDate,
      numberOfPeople,
      totalAmount,
      advancePayment,
      remainingAmount,
      groupName
    );
  };

  if (!pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-gray-600 text-lg">Loading package details...</div>
      </div>
    );
  }

  const numberOfPeople = travelers.length;
  const totalAmount = pkg.price_per_head * numberOfPeople;
  const advancePayment = pkg.advance_payment * numberOfPeople;
  const remainingBalance = totalAmount - advancePayment;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Complete Your Booking</h1>
          <p className="text-gray-600">Fill in the traveler details to confirm your booking</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-start gap-6">
              {pkg.image_url && (
                <img
                  src={pkg.image_url}
                  alt={pkg.title}
                  className="w-32 h-32 object-cover rounded-lg shadow-md"
                />
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{pkg.title}</h2>
                <div className="space-y-1 text-gray-600">
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {pkg.duration_days} Days - {pkg.destination}
                  </p>
                  {selectedDate && (
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Travel Date: {new Date(selectedDate.available_date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Price per person</p>
                <p className="text-3xl font-bold text-blue-600 flex items-center justify-end">
                  <IndianRupee className="h-6 w-6" />
                  {pkg.price_per_head.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <UserCheck className="h-6 w-6 text-blue-600" />
                Your Contact Information
              </h3>
              <p className="text-sm text-gray-600 mb-4">This information will be used for booking confirmation</p>
              <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={profile?.full_name || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={profile?.phone || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="h-6 w-6 text-blue-600" />
                    Traveler Details
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Add details for all travelers in your group</p>
                </div>
                <button
                  type="button"
                  onClick={addTraveler}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add Traveler
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name (Optional)
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Family Trip, College Friends, Office Team"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-4">
                {travelers.map((traveler, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-5 bg-white">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-900">Traveler {index + 1}</h4>
                      {travelers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTraveler(index)}
                          className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={traveler.name}
                            onChange={(e) => updateTraveler(index, 'name', e.target.value)}
                            placeholder="Enter full name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            value={traveler.phone}
                            onChange={(e) => updateTraveler(index, 'phone', e.target.value)}
                            placeholder="Enter phone number"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={traveler.paidAdvance}
                            onChange={(e) => updateTraveler(index, 'paidAdvance', e.target.checked)}
                            className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Paid Advance Payment (₹{pkg.advance_payment.toLocaleString()})
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 space-y-4 border border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Payment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                  <span className="text-gray-700 font-medium">Number of Travelers:</span>
                  <span className="text-xl font-bold text-gray-900">{numberOfPeople}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                  <span className="text-gray-700 font-medium">Price per Person:</span>
                  <span className="text-xl font-bold text-gray-900 flex items-center">
                    <IndianRupee className="h-5 w-5" />
                    {pkg.price_per_head.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                  <span className="text-gray-700 font-bold text-lg">Total Amount:</span>
                  <span className="text-2xl font-bold text-blue-600 flex items-center">
                    <IndianRupee className="h-6 w-6" />
                    {totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                  <span className="text-gray-700 font-medium">Advance Payment Required:</span>
                  <span className="text-xl font-bold text-green-600 flex items-center">
                    <IndianRupee className="h-5 w-5" />
                    {advancePayment.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                  <span className="text-gray-700 font-medium">Travelers Who Paid Advance:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {travelers.filter(t => t.paidAdvance).length} / {numberOfPeople}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-700 font-medium">Remaining Balance:</span>
                  <span className="text-xl font-bold text-orange-600 flex items-center">
                    <IndianRupee className="h-5 w-5" />
                    {remainingBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {!selectedDate && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
                <p className="text-yellow-800 text-sm font-medium">
                  Please go back to the package details page to select a travel date before booking.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedDate}
              className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              {!selectedDate ? 'Select a Date to Book' : 'Book via WhatsApp'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
