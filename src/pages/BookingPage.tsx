import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, MessageCircle, Mail } from 'lucide-react';
import { supabase, Package } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const BookingPage = () => {
  const { id: packageId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { package: pkgFromState } = location.state || {};
  const [pkg, setPkg] = useState<Package | null>(pkgFromState || null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [soldOutDates, setSoldOutDates] = useState<Date[]>([]);
  // Use a reliable way to compare dates - normalize to midnight
  const soldOutDateObjects = soldOutDates.map(d => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const [bookingType, setBookingType] = useState<'online' | 'whatsapp'>('online');
  const [numberOfMembers, setNumberOfMembers] = useState<number | string>(2);
  const [member1, setMember1] = useState({ name: '', phone: '' });
  const [member2, setMember2] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(!pkgFromState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user, profile } = useAuth();

  useEffect(() => {
    if (profile) {
      setMember1(prev => ({
        ...prev,
        // Only autofill if empty to avoid overwriting user edits if they navigate back/forth or something, 
        // though typically this runs on mount. 
        // Actually, enforcing profile name is requested: "add this name only code update"
        name: profile.full_name || prev.name,
        phone: profile.phone || prev.phone
      }));
    }
  }, [profile]);

  useEffect(() => {
    // If not logged in, only redirect if trying to do 'online' booking? 
    // Or generally require auth? The prompt implies online booking needs email confirmation.
    if (!user) {
      navigate('/login');
      return;
    }
    if (!pkgFromState && packageId) {
      loadData();
    } else if (pkgFromState) {
      // Even if we have package from state, we should load sold-out dates
      loadSoldOutDates(pkgFromState.id);
    }
  }, [packageId, user, pkgFromState]);

  const loadSoldOutDates = async (pkgId: string) => {
    try {
      const { data: soldData } = await supabase
        .from('package_soldout_dates')
        .select('soldout_date')
        .eq('package_id', pkgId);
      if (soldData) {
        setSoldOutDates(soldData.map((d: any) => {
          const parts = d.soldout_date.split('-');
          return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        }));
      }
    } catch (err) {
      console.error("Failed to load sold out dates:", err);
      // Optionally set an error state or handle it
    }
  };

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

      if (data) {
        const { data: soldData } = await supabase
          .from('package_soldout_dates')
          .select('soldout_date')
          .eq('package_id', data.id);
        if (soldData) {
          // Parse 'YYYY-MM-DD' and ensuring it's treated as local date part or midnight
          setSoldOutDates(soldData.map((d: any) => {
            // Appending T00:00:00 to ensure local time interpretation if just a date string
            // Or split and create manually
            const parts = d.soldout_date.split('-');
            return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          }));
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load package details');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppBooking = async () => {
    if (!pkg) return;

    if (!selectedDate) {
      setError('Please select a date');
      return;
    }
    if (!member1.name.trim()) {
      setError('Please enter your name');
      return;
    }

    setSubmitting(true);
    try {
      const totalPrice = pkg.price_per_head * Number(numberOfMembers);
      const advanceTotal = pkg.advance_payment * Number(numberOfMembers);
      const remainingAmount = totalPrice - advanceTotal;
      const travelGroupName = `${member1.name}${Number(numberOfMembers) >= 2 ? ` & ${member2.name}` : ''} ${Number(numberOfMembers) > 2 ? `& ${Number(numberOfMembers) - 2} others` : ''}`;

      // Create booking record first
      const { data: bookingData, error: insertError } = await supabase
        .from('bookings')
        .insert({
          user_id: user?.id || null,
          package_id: pkg.id,
          booking_date: selectedDate,
          travel_group_name: travelGroupName,
          number_of_members: Number(numberOfMembers),
          total_price: totalPrice,
          advance_paid: 0,
          advance_amount: advanceTotal,
          status: 'pending', // Pending admin confirmation
          payment_status: 'not_paid', // Will pay via WA link or later
          guest_name: member1.name,
          guest_phone: member1.phone,
          admin_notes: 'Booked via WhatsApp Request'
        })
        .select()
        .single();

      if (insertError) throw insertError;
      const bookingId = bookingData.id;

      // Add members
      const membersToInsert = [
        { booking_id: bookingId, member_name: member1.name, member_phone: member1.phone },
        ...(Number(numberOfMembers) >= 2
          ? [{ booking_id: bookingId, member_name: member2.name, member_phone: member2.phone }]
          : []),
      ];
      await supabase.from('booking_members').insert(membersToInsert);

      // Construct detailed message
      const message = `*New Booking Request* 🏕️\n\n` +
        `*Package:* ${pkg.title}\n` +
        `*Date:* ${selectedDate}\n` +
        `*Members:* ${numberOfMembers}\n` +
        `*Guest Name:* ${member1.name}\n` +
        `--------------------------------\n` +
        `*Total Price:* ₹${totalPrice}\n` +
        `*Advance Required:* ₹${advanceTotal}\n` +
        `*Remaining:* ₹${remainingAmount}\n` +
        `--------------------------------\n` +
        `*Booking ID:* ${bookingId.slice(0, 8)}\n\n` +
        `Please confirm availability and share payment details.`;

      const phoneNumber = "917592049934";
      const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

      // Navigate to bookings page to show it's "placed" or just open WA?
      // User likely wants to see it in their "My Bookings" too.
      // We will redirect cleanly.

      window.open(url, '_blank');
      navigate('/bookings'); // Send them to my bookings where they can see it's pending

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to initiate WhatsApp booking');
    } finally {
      setSubmitting(false);
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
    if (Number(numberOfMembers) >= 2 && (!member2.name.trim() || !member2.phone.trim())) {
      setError('Please fill in all details for Person 2');
      return;
    }

    if (bookingType === 'whatsapp') {
      handleWhatsAppBooking();
      return;
    }

    setSubmitting(true);
    try {
      const totalPrice = pkg!.price_per_head * Number(numberOfMembers);
      const advanceTotal = pkg!.advance_payment * Number(numberOfMembers);
      const travelGroupName = `${member1.name}${Number(numberOfMembers) >= 2 ? ` & ${member2.name}` : ''}`;

      const { data: bookingData, error: insertError } = await supabase
        .from('bookings')
        .insert({
          user_id: user?.id || null,
          package_id: pkg!.id,
          booking_date: selectedDate,
          travel_group_name: travelGroupName,
          number_of_members: Number(numberOfMembers),
          total_price: totalPrice,
          advance_paid: 0,
          advance_amount: advanceTotal,
          status: 'pending',
          payment_status: 'not_paid',
          guest_name: member1.name,
          guest_phone: member1.phone
        })
        .select()
        .single();

      if (insertError) throw insertError;
      const bookingId = bookingData.id;

      const membersToInsert = [
        { booking_id: bookingId, member_name: member1.name, member_phone: member1.phone },
        ...(Number(numberOfMembers) >= 2
          ? [{ booking_id: bookingId, member_name: member2.name, member_phone: member2.phone }]
          : []),
      ];

      const { error: membersError } = await supabase.from('booking_members').insert(membersToInsert);
      if (membersError) throw membersError;

      // Ensure we don't double insert sold-out dates if multiple people book (race condition possible but ignores constraint usually)
      // Actually strictly, multiple bookings for same date might be allowed unless it's a 1-group package?
      // The prompt implies "when a user books a package and the date is sold out". 
      // If we mark it sold out NOW, no one else can book? 
      // Assuming 'private trip' logic -> blocking the date.

      // Check if date already exists to avoid error if unique constraint exists
      await supabase.from('package_soldout_dates').insert({
        package_id: pkg!.id,
        soldout_date: selectedDate
      }).select().maybeSingle();

      // Proceed to payment
      navigate(`/payment/${bookingId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );

  if (!pkg || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Package not found</p>
    </div>
  );

  const totalPrice = pkg.price_per_head * Number(numberOfMembers);
  const advanceTotal = pkg.advance_payment * Number(numberOfMembers);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate(`/package/${packageId}`)} className="flex items-center text-emerald-600 hover:text-emerald-700 mb-6">
          <ChevronLeft className="h-5 w-5" /> Back to Package Details
        </button>

        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Adventure</h1>
          <h2 className="text-xl text-gray-600 mb-8">{pkg.title}</h2>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Booking Type Selection */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                type="button"
                onClick={() => setBookingType('online')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${bookingType === 'online'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 hover:border-emerald-200 text-gray-600'
                  }`}
              >
                <Mail className="h-8 w-8 mb-2" />
                <span className="font-semibold">Normal Booking</span>
                <span className="text-xs text-center mt-1">Confirmed via Email</span>
              </button>
              <button
                type="button"
                onClick={() => setBookingType('whatsapp')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${bookingType === 'whatsapp'
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-green-200 text-gray-600'
                  }`}
              >
                <MessageCircle className="h-8 w-8 mb-2" />
                <span className="font-semibold">WhatsApp Booking</span>
                <span className="text-xs text-center mt-1">Book via WhatsApp Chat</span>
              </button>
            </div>

            {/* Travel Date */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-gray-700">Select Travel Date</p>
              <DatePicker
                selected={selectedDate ? new Date(selectedDate) : null}
                onChange={(date: Date | null) => {
                  // Adjust to local date string 'YYYY-MM-DD'
                  if (!date) {
                    setSelectedDate('');
                    return;
                  }
                  // Force local YYYY-MM-DD to avoid timezone shifts
                  const offset = date.getTimezoneOffset();
                  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
                  setSelectedDate(adjustedDate.toISOString().split('T')[0]);
                }}
                inline
                highlightDates={[{ 'react-datepicker__day--highlighted-soldout': soldOutDateObjects }]}
                filterDate={date => {
                  // Check if date is in soldOutDateObjects (comparing timestamps at midnight)
                  const dTime = new Date(date).setHours(0, 0, 0, 0);
                  return !soldOutDateObjects.some(s => s.getTime() === dTime);
                }}
                minDate={new Date()}
              />
              <p className="mt-2 text-red-600 font-semibold text-sm">Red dates are sold out</p>
              <style>{`
                .react-datepicker__day--highlighted-soldout {
                  background-color: #ef4444 !important;
                  color: white !important;
                  border-radius: 50%;
                }
                .react-datepicker__day--highlighted-soldout:hover {
                    background-color: #dc2626 !important;
                }
              `}</style>
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
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') setNumberOfMembers('');
                  else {
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) setNumberOfMembers(num);
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>

            {/* Members Info */}
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Person 1</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" value={member1.name} onChange={e => setMember1({ ...member1, name: e.target.value })} placeholder="Full Name" required className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                  <input type="tel" value={member1.phone} onChange={e => setMember1({ ...member1, phone: e.target.value.replace(/\D/g, '') })} placeholder="Phone Number" maxLength={10} required className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>

              {Number(numberOfMembers) >= 2 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Person 2</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" value={member2.name} onChange={e => setMember2({ ...member2, name: e.target.value })} placeholder="Full Name" required className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                    <input type="tel" value={member2.phone} onChange={e => setMember2({ ...member2, phone: e.target.value.replace(/\D/g, '') })} placeholder="Phone Number" maxLength={10} required className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                  </div>
                </div>
              )}
            </div>

            {/* Booking Summary */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-3">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Booking Summary</h3>
              <div className="flex justify-between text-gray-700"><span>Number of Members:</span><span className="font-medium">{numberOfMembers}</span></div>
              <div className="flex justify-between text-gray-700"><span>Price per Person:</span><span className="font-medium">₹{pkg.price_per_head}</span></div>
              <div className="flex justify-between text-gray-700 border-t pt-3"><span className="font-medium">Total Price:</span><span className="font-bold text-xl">₹{totalPrice}</span></div>
              {bookingType === 'online' && (
                <div className="flex justify-between text-emerald-600 border-t pt-3"><span className="font-medium">Advance Payment Required:</span><span className="font-bold text-xl">₹{advanceTotal}</span></div>
              )}
            </div>

            <button type="submit" disabled={submitting || !selectedDate} className={`w-full text-white py-3 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${bookingType === 'whatsapp'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-emerald-600 hover:bg-emerald-700'
              }`}>
              {submitting ? 'Processing...' : (bookingType === 'whatsapp' ? 'Continue on WhatsApp' : 'Confirm & Pay Advance')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
