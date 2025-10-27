import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Users, IndianRupee, ChevronLeft, MessageCircle, Plus, Trash2 } from 'lucide-react';
import { supabase, Package, PackageDate } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const BookingPage = () => {
  const { id: packageId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { package: pkgFromState, date: dateFromState } = location.state || {};
  const [pkg, setPkg] = useState<Package | null>(pkgFromState || null);
  const [availableDates, setAvailableDates] = useState<PackageDate[]>([]);
  const [selectedDate, setSelectedDate] = useState(dateFromState?.available_date || '');
  const [travelGroupName, setTravelGroupName] = useState('');
  const [members, setMembers] = useState<{ name: string; phone: string }[]>([{ name: '', phone: '' }]);
  const [loading, setLoading] = useState(!pkgFromState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!pkgFromState && packageId) {
      loadData();
    }
  }, [packageId, user]);

  const loadData = async () => {
    if (!packageId) return;
    try {
      const [pkgResponse, datesResponse] = await Promise.all([
        supabase.from('packages').select('*').eq('id', packageId).maybeSingle(),
        supabase.from('package_dates').select('*').eq('package_id', packageId).order('available_date'),
      ]);

      if (pkgResponse.error) throw pkgResponse.error;
      if (datesResponse.error) throw datesResponse.error;

      setPkg(pkgResponse.data);
      setAvailableDates(datesResponse.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load package details');
    } finally {
      setLoading(false);
    }
  };

  const addMember = () => {
    setMembers([...members, { name: '', phone: '' }]);
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index: number, field: 'name' | 'phone', value: string) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedDate) {
      setError('Please select a date');
      return;
    }

    if (!travelGroupName.trim()) {
      setError('Please enter a travel group name');
      return;
    }

    for (let i = 0; i < members.length; i++) {
      if (!members[i].name.trim() || !members[i].phone.trim()) {
        setError(`Please fill in all details for member ${i + 1}`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const totalPrice = pkg!.price_per_head * members.length;
      const advancePaid = pkg!.advance_payment * members.length;

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user!.id,
          package_id: packageId,
          booking_date: selectedDate,
          travel_group_name: travelGroupName,
          number_of_members: members.length,
          total_price: totalPrice,
          advance_paid: advancePaid,
          status: 'pending',
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      const memberInserts = members.map((m) => ({
        booking_id: booking.id,
        member_name: m.name,
        member_phone: m.phone,
      }));

      const { error: membersError } = await supabase
        .from('booking_members')
        .insert(memberInserts);

      if (membersError) throw membersError;

      const contactInfo = pkg!.contact_info as any;
      const whatsappPhone = contactInfo?.phone || '919876543210';

      const whatsappMessage = `Hi, I would like to book ${pkg!.title}

Date: ${new Date(selectedDate).toLocaleDateString()}
Travel Group: ${travelGroupName}
Number of Members: ${members.length}
Total Price: ₹${totalPrice}
Advance Payment: ₹${advancePaid}

Members:
${members.map((m, i) => `${i + 1}. ${m.name} - ${m.phone}`).join('\n')}

Booking ID: ${booking.id}`;

      const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(whatsappUrl, '_blank');

      navigate('/bookings');
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!pkg || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Package not found</p>
        </div>
      </div>
    );
  }

  const totalPrice = pkg.price_per_head * members.length;
  const advanceTotal = pkg.advance_payment * members.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(`/package/${packageId}`)}
          className="flex items-center text-emerald-600 hover:text-emerald-700 mb-6"
        >
          <ChevronLeft className="h-5 w-5" />
          Back to Package Details
        </button>

        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Adventure</h1>
          <h2 className="text-xl text-gray-600 mb-8">{pkg.title}</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a date</option>
                  {availableDates.map((date) => (
                    <option key={date.id} value={date.available_date}>
                      {new Date(date.available_date).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </option>
                  ))}
                </select>
              </div>
              {availableDates.length === 0 && (
                <p className="text-sm text-red-600 mt-1">No dates available for booking</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Travel Group Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={travelGroupName}
                onChange={(e) => setTravelGroupName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., Adventure Squad"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Participant Details <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addMember}
                  className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Member
                </button>
              </div>

              <div className="space-y-4">
                {members.map((member, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Member {index + 1}</h4>
                      {members.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMember(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => updateMember(index, 'name', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Full Name"
                        required
                      />
                      <input
                        type="tel"
                        value={member.phone}
                        onChange={(e) => updateMember(index, 'phone', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Phone Number"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-3">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Booking Summary</h3>
              <div className="flex justify-between text-gray-700">
                <span>Number of Members:</span>
                <span className="font-medium">{members.length}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Price per Person:</span>
                <span className="font-medium">₹{pkg.price_per_head}</span>
              </div>
              <div className="flex justify-between text-gray-700 border-t pt-3">
                <span className="font-medium">Total Price:</span>
                <span className="font-bold text-xl">₹{totalPrice}</span>
              </div>
              <div className="flex justify-between text-emerald-600 border-t pt-3">
                <span className="font-medium">Advance Payment Required:</span>
                <span className="font-bold text-xl">₹{advanceTotal}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                You need to pay ₹{pkg.advance_payment} per person as advance
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">WhatsApp Booking Process</p>
                  <p>
                    After submitting this form, you'll be redirected to WhatsApp with a pre-filled message
                    containing your booking details. Please send this message to complete your booking.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || availableDates.length === 0}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Processing...' : 'Proceed to WhatsApp Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
