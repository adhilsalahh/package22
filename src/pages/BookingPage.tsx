import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, ChevronLeft } from 'lucide-react';
import { supabase, Package } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const BookingPage = () => {
  const { id: packageId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { package: pkgFromState } = location.state || {};
  const [pkg, setPkg] = useState<Package | null>(pkgFromState || null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [numberOfMembers, setNumberOfMembers] = useState(2);
  const [member1, setMember1] = useState({ name: '', phone: '' });
  const [member2, setMember2] = useState({ name: '', phone: '' });
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
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .maybeSingle();
      if (error) throw error;
      setPkg(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load package details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedDate) {
      setError('Please select a date');
      return;
    }
    if (!member1.name.trim() || !member1.phone.trim()) {
      setError('Please fill in all details for Person 1');
      return;
    }
    if (numberOfMembers >= 2 && (!member2.name.trim() || !member2.phone.trim())) {
      setError('Please fill in all details for Person 2');
      return;
    }

    setSubmitting(true);
    try {
      const totalPrice = pkg!.price_per_head * numberOfMembers;
      const advanceTotal = pkg!.advance_payment * numberOfMembers;
      const travelGroupName = `${member1.name}${numberOfMembers >= 2 ? ` & ${member2.name}` : ''}`;

      // Insert booking with advance_paid = 0 and advance_amount calculated
      const { data: bookingData, error: insertError } = await supabase
        .from('bookings')
        .insert({
          user_id: user!.id,
          package_id: pkg!.id,
          booking_date: selectedDate,
          travel_group_name: travelGroupName,
          number_of_members: numberOfMembers,
          total_price: totalPrice,
          advance_paid: 0,          // initially 0
          advance_amount: advanceTotal, // expected advance
          status: 'pending',
          payment_status: 'not_paid', // initially not paid
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const bookingId = bookingData.id;

      // Insert booking members
      const membersToInsert = [
        { booking_id: bookingId, member_name: member1.name, member_phone: member1.phone },
        ...(numberOfMembers >= 2
          ? [{ booking_id: bookingId, member_name: member2.name, member_phone: member2.phone }]
          : []),
      ];

      const { error: membersError } = await supabase
        .from('booking_members')
        .insert(membersToInsert);

      if (membersError) throw membersError;

      alert('Booking created! Please complete advance payment.');
      navigate('/bookings');
    } catch (err: any) {
      console.error(err);
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

  const totalPrice = pkg.price_per_head * numberOfMembers;
  const advanceTotal = pkg.advance_payment * numberOfMembers;

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Adventure </h1>
          <h2 className="text-xl text-gray-600 mb-8">{pkg.title}</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Travel Date */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-gray-700">Select Travel Date</p>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>

            {/* Number of Members */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Members <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={numberOfMembers}
                onChange={(e) => setNumberOfMembers(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>

            {/* Members Info */}
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Person 1</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={member1.name}
                    onChange={(e) => setMember1({ ...member1, name: e.target.value })}
                    placeholder="Full Name"
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <input
                    type="tel"
                    value={member1.phone}
                    onChange={(e) => setMember1({ ...member1, phone: e.target.value })}
                    placeholder="Phone Number"
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              {numberOfMembers >= 2 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Person 2</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={member2.name}
                      onChange={(e) => setMember2({ ...member2, name: e.target.value })}
                      placeholder="Full Name"
                      required
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <input
                      type="tel"
                      value={member2.phone}
                      onChange={(e) => setMember2({ ...member2, phone: e.target.value })}
                      placeholder="Phone Number"
                      required
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Booking Summary */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-3">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Booking Summary</h3>
              <div className="flex justify-between text-gray-700">
                <span>Number of Members:</span>
                <span className="font-medium">{numberOfMembers}</span>
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
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedDate}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Processing...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
