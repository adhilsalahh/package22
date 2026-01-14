import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, MessageCircle, Mail, Plus, Minus } from 'lucide-react';
import { supabase, Package } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { sendWhatsAppBookingRequest } from '../lib/whatsapp';

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
  // Demographics
  const [adultMales, setAdultMales] = useState(1);
  const [adultFemales, setAdultFemales] = useState(0);
  const [childUnder5, setChildUnder5] = useState(0);
  const [child5to8, setChild5to8] = useState(0);
  const [couples, setCouples] = useState(0);

  const [member1, setMember1] = useState({ name: '', phone: '' });
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
      checkRestrictedPackage(pkgFromState);
    }
  }, [packageId, user, pkgFromState]);

  const checkRestrictedPackage = (packageData: Package) => {
    const titleLower = packageData.title.toLowerCase();
    if (titleLower.includes('meesapulimala') || titleLower.includes('homestay')) {
      setBookingType('whatsapp');
    }
  };

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
      checkRestrictedPackage(data);

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

  const increment = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
    setter(value + 1);
  };

  const decrement = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
    if (value > 0) setter(value - 1);
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

    const totalMembers = adultMales + adultFemales + (couples * 2) + childUnder5 + child5to8;
    if (totalMembers === 0) {
      setError('Please add at least one traveler');
      return;
    }

    setSubmitting(true);
    try {
      const basePrice = pkg.price_per_head;
      const totalPrice = ((adultMales + adultFemales + (couples * 2)) * basePrice) + (child5to8 * 500);

      const advanceTotal = pkg.advance_payment * (adultMales + adultFemales + (couples * 2)) + (child5to8 * 500);
      // Logic check: if child5to8 pays 500 total, is advance 500? Assuming yes.
      // If free child, advance 0.

      // Calculate remaining
      // If child 5-8 price is 500 and advance is 500, remaining is 0 for them.
      // For adults, remaining is price - advance.

      const travelGroupName = `${member1.name}${totalMembers > 1 ? ` & ${totalMembers - 1} others` : ''}`;

      // Create booking record first
      const { data: bookingData, error: insertError } = await supabase
        .from('bookings')
        .insert({
          user_id: user?.id || null,
          package_id: pkg.id,
          booking_date: selectedDate,
          travel_group_name: travelGroupName,
          number_of_members: totalMembers,
          total_price: totalPrice,
          advance_paid: 0,
          advance_amount: advanceTotal,
          status: 'pending', // Pending admin confirmation
          payment_status: 'not_paid', // Will pay via WA link or later
          guest_name: member1.name,
          guest_phone: member1.phone,
          admin_notes: 'Booked via WhatsApp Request',
          adult_males: adultMales,
          adult_females: adultFemales,
          couples: couples,
          child_under_5: childUnder5,
          child_5_to_8: child5to8
        })
        .select()
        .single();


      if (insertError) throw insertError;
      const bookingId = bookingData.id;

      // Add members (just primary for now as per updated simplified flow, or placeholder members)
      // Since we removed individual member inputs, we just add the primary guest as a member. 
      // Or we can add dummy members if strict FK or structure required, but typically just primary is enough if we have counts.
      await supabase.from('booking_members').insert([
        { booking_id: bookingId, member_name: member1.name, member_phone: member1.phone }
      ]);

      const remainingAmount = totalPrice - advanceTotal;
      sendWhatsAppBookingRequest(
        pkg.title,
        selectedDate,
        totalMembers,
        member1.name,
        member1.phone,
        totalPrice,
        advanceTotal,
        remainingAmount,
        bookingId
      );

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

    const totalMembers = adultMales + adultFemales + (couples * 2) + childUnder5 + child5to8;
    if (totalMembers === 0) {
      setError('Please add at least one traveler');
      return;
    }

    if (bookingType === 'whatsapp') {
      handleWhatsAppBooking();
      return;
    }

    setSubmitting(true);
    try {
      const basePrice = pkg!.price_per_head;
      const totalPrice = ((adultMales + adultFemales + (couples * 2)) * basePrice) + (child5to8 * 500);
      const advanceTotal = pkg!.advance_payment * (adultMales + adultFemales + (couples * 2)) + (child5to8 * 500);

      const travelGroupName = `${member1.name}${totalMembers > 1 ? ` & ${totalMembers - 1} others` : ''}`;

      const { data: bookingData, error: insertError } = await supabase
        .from('bookings')
        .insert({
          user_id: user?.id || null,
          package_id: pkg!.id,
          booking_date: selectedDate,
          travel_group_name: travelGroupName,
          number_of_members: totalMembers,
          total_price: totalPrice,
          advance_paid: 0,
          advance_amount: advanceTotal,
          status: 'pending',
          payment_status: 'not_paid',
          guest_name: member1.name,
          guest_phone: member1.phone,
          adult_males: adultMales,
          adult_females: adultFemales,
          couples: couples,
          child_under_5: childUnder5,
          child_5_to_8: child5to8
        })
        .select()
        .single();

      if (insertError) throw insertError;
      const bookingId = bookingData.id;

      await supabase.from('booking_members').insert([
        { booking_id: bookingId, member_name: member1.name, member_phone: member1.phone }
      ]);

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
              {(!pkg.title.toLowerCase().includes('meesapulimala') && !pkg.title.toLowerCase().includes('homestay')) && (
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
              )}
              <button
                type="button"
                onClick={() => setBookingType('whatsapp')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${bookingType === 'whatsapp'
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-green-200 text-gray-600'
                  } ${(pkg.title.toLowerCase().includes('meesapulimala') || pkg.title.toLowerCase().includes('homestay')) ? 'col-span-2' : ''}`}
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

            {/* Travelers & Categories */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Travelers & Categories
              </label>
              <div className="space-y-4">
                {/* Adult Males */}
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <span className="font-medium text-gray-700"> Males (Boys)</span>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => decrement(setAdultMales, adultMales)} className="p-1 bg-white rounded shadow text-emerald-600 outline-none"><Minus size={16} /></button>
                    <span className="w-8 text-center font-semibold">{adultMales}</span>
                    <button type="button" onClick={() => increment(setAdultMales, adultMales)} className="p-1 bg-white rounded shadow text-emerald-600 outline-none"><Plus size={16} /></button>
                  </div>
                </div>

                {/* Adult Females */}
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <span className="font-medium text-gray-700">Females (Girls)</span>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => decrement(setAdultFemales, adultFemales)} className="p-1 bg-white rounded shadow text-emerald-600 outline-none"><Minus size={16} /></button>
                    <span className="w-8 text-center font-semibold">{adultFemales}</span>
                    <button type="button" onClick={() => increment(setAdultFemales, adultFemales)} className="p-1 bg-white rounded shadow text-emerald-600 outline-none"><Plus size={16} /></button>
                  </div>
                </div>

                {/* Couples */}
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <div>
                    <span className="block font-medium text-gray-700">Couples</span>
                    <span className="text-xs text-gray-500">2 People</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => decrement(setCouples, couples)} className="p-1 bg-white rounded shadow text-emerald-600 outline-none"><Minus size={16} /></button>
                    <span className="w-8 text-center font-semibold">{couples}</span>
                    <button type="button" onClick={() => increment(setCouples, couples)} className="p-1 bg-white rounded shadow text-emerald-600 outline-none"><Plus size={16} /></button>
                  </div>
                </div>

                {/* Child < 5 */}
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <div>
                    <span className="block font-medium text-gray-700">Children (Below 5 yrs)</span>
                    <span className="text-xs text-gray-500 text-green-600">Free</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => decrement(setChildUnder5, childUnder5)} className="p-1 bg-white rounded shadow text-emerald-600 outline-none"><Minus size={16} /></button>
                    <span className="w-8 text-center font-semibold">{childUnder5}</span>
                    <button type="button" onClick={() => increment(setChildUnder5, childUnder5)} className="p-1 bg-white rounded shadow text-emerald-600 outline-none"><Plus size={16} /></button>
                  </div>
                </div>

                {/* Child 5-8 */}
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <div>
                    <span className="block font-medium text-gray-700">Children (5-8 yrs)</span>
                    <span className="text-xs text-gray-500">Charged ₹500</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => decrement(setChild5to8, child5to8)} className="p-1 bg-white rounded shadow text-emerald-600 outline-none"><Minus size={16} /></button>
                    <span className="w-8 text-center font-semibold">{child5to8}</span>
                    <button type="button" onClick={() => increment(setChild5to8, child5to8)} className="p-1 bg-white rounded shadow text-emerald-600 outline-none"><Plus size={16} /></button>
                  </div>
                </div>

              </div>
            </div>

            {/* Members Info */}
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Primary Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" value={member1.name} onChange={e => setMember1({ ...member1, name: e.target.value })} placeholder="Full Name" required className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                  <input type="tel" value={member1.phone} onChange={e => setMember1({ ...member1, phone: e.target.value.replace(/\D/g, '') })} placeholder="Phone Number" maxLength={10} required className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>
            </div>

            {/* Booking Summary */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-3">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Booking Summary</h3>
              <div className="flex justify-between text-gray-700"><span>Number of Members:</span><span className="font-medium">{adultMales + adultFemales + (couples * 2) + childUnder5 + child5to8}</span></div>
              <div className="flex justify-between text-gray-700"><span>Price per Person:</span><span className="font-medium">₹{pkg.price_per_head}</span></div>
              <div className="flex justify-between text-gray-700 border-t pt-3"><span className="font-medium">Total Price:</span><span className="font-bold text-xl">₹{((adultMales + adultFemales + (couples * 2)) * pkg.price_per_head) + (child5to8 * 500)}</span></div>
              {bookingType === 'online' && (
                <div className="flex justify-between text-emerald-600 border-t pt-3"><span className="font-medium">Advance Payment Required:</span><span className="font-bold text-xl">₹{pkg.advance_payment * (adultMales + adultFemales + (couples * 2)) + (child5to8 * 500)}</span></div>
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
