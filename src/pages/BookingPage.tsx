import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase, Package, PackageDate } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Calendar, IndianRupee, Users, Trash2, Plus, UserCheck } from 'lucide-react';

interface TravelerInfo {
  name: string;
  phone: string;
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
  const [travelers, setTravelers] = useState<TravelerInfo[]>([{ name: '', phone: '' }]);
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
    setTravelers([...travelers, { name: '', phone: '' }]);
  };

  const removeTraveler = (index: number) => {
    if (travelers.length > 1) {
      setTravelers(travelers.filter((_, i) => i !== index));
    }
  };

  const updateTraveler = (index: number, field: keyof TravelerInfo, value: string) => {
    const updated = [...travelers];
    updated[index] = { ...updated[index], [field]: value };
    setTravelers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkg || !user || !profile) return;

    setLoading(true);

    try {
      const numberOfPeople = travelers.length;
      const totalAmount = pkg.price_per_head * numberOfPeople;
      const advancePaid = pkg.advance_payment * numberOfPeople;
      const remainingAmount = totalAmount - advancePaid;

      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          package_id: id,
          user_id: user.id,
          number_of_people: numberOfPeople,
          user_name: profile.full_name,
          user_phone: profile.phone,
          total_amount: totalAmount,
          advance_paid: advancePaid,
          remaining_amount: remainingAmount,
          group_name: groupName || null,
          travelers: travelers,
          status: 'pending',
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      if (selectedDate) {
        const updatedBookings = selectedDate.current_bookings + numberOfPeople;
        await supabase
          .from('package_dates')
          .update({ current_bookings: updatedBookings })
          .eq('id', selectedDate.id);
      }

      navigate(`/payment/${bookingData.id}`);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
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
                  <span className="text-gray-700 font-medium">Advance Payment (Now):</span>
                  <span className="text-xl font-bold text-green-600 flex items-center">
                    <IndianRupee className="h-5 w-5" />
                    {advancePayment.toLocaleString()}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl"
            >
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
