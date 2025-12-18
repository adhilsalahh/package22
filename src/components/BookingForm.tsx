import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Calendar, Upload } from 'lucide-react';
import { Package } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { sendDetailedBookingToWhatsApp } from '../lib/whatsapp';

interface BookingFormProps {
  package: Package;
  onClose: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ package: pkg, onClose }) => {
  const { addBooking, fetchAvailableDates, availableDates } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [adultMales, setAdultMales] = useState(1);
  const [adultFemales, setAdultFemales] = useState(0);
  const [childUnder5, setChildUnder5] = useState(0);
  const [child5to8, setChild5to8] = useState(0);
  const [childAbove8, setChildAbove8] = useState(0);
  const [paymentScreenshot, setPaymentScreenshot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAvailableDates(pkg.id);
  }, [pkg.id]);

  const increment = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
    setter(value + 1);
  };

  const decrement = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
    if (value > 0) setter(value - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !phone || !bookingDate) {
      alert('Please fill in all required fields');
      return;
    }

    const totalMembers = adultMales + adultFemales + childUnder5 + child5to8 + childAbove8;
    if (totalMembers === 0) {
      alert('Please add at least one traveler');
      return;
    }

    setIsSubmitting(true);

    const basePrice = Number(pkg.price_per_head || 0);
    const calculatedTotalPrice =
      ((adultMales + adultFemales + childAbove8) * basePrice) +
      (child5to8 * 500);

    try {
      // Note: user_id is assumed to be handled by backend/context if not provided
      await addBooking({
        package_id: pkg.id,
        travel_group_name: name,
        number_of_members: totalMembers,
        total_price: calculatedTotalPrice,
        booking_date: bookingDate,
        payment_screenshot: paymentScreenshot || undefined,
        adult_males: adultMales,
        adult_females: adultFemales,
        child_under_5: childUnder5,
        child_5_to_8: child5to8,
        child_above_8: childAbove8,
        advance_paid: 0,
        payment_status: 'pending'
      } as any); // Casting as any to bypass strict type check if Omit isn't matching perfectly with new fields

      sendDetailedBookingToWhatsApp(
        pkg.title,
        name,
        phone,
        bookingDate,
        calculatedTotalPrice,
        {
          adultMales,
          adultFemales,
          childUnder5,
          child5to8,
          childAbove8
        },
        paymentScreenshot
      );

      alert('Booking submitted successfully! You will be redirected to WhatsApp to complete the booking.');
      onClose();
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const basePrice = Number(pkg.price_per_head || 0);
  const totalPrice = ((adultMales + adultFemales + childAbove8) * basePrice) + (child5to8 * 500);
  const totalMembers = adultMales + adultFemales + childUnder5 + child5to8 + childAbove8;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-8">
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Book Your Advent</h2>
            <p className="text-emerald-100">{pkg.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your phone number"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-emerald-600" />
              Select Date *
            </label>
            {availableDates.length > 0 ? (
              <select
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              >
                <option value="">Choose a date</option>
                {availableDates.map((date) => (
                  <option key={date.id} value={date.date}>
                    {new Date(date.date).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {' '}
                    ({date.max_bookings - date.current_bookings} spots left)
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Travelers & Categories
            </label>
            <div className="space-y-4">
              {/* Adults */}
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="font-medium text-gray-700">Adult Males (Boys)</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => decrement(setAdultMales, adultMales)} className="p-1 bg-white rounded shadow text-emerald-600"><Minus size={16} /></button>
                  <span className="w-8 text-center font-semibold">{adultMales}</span>
                  <button type="button" onClick={() => increment(setAdultMales, adultMales)} className="p-1 bg-white rounded shadow text-emerald-600"><Plus size={16} /></button>
                </div>
              </div>

              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="font-medium text-gray-700">Adult Females (Girls)</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => decrement(setAdultFemales, adultFemales)} className="p-1 bg-white rounded shadow text-emerald-600"><Minus size={16} /></button>
                  <span className="w-8 text-center font-semibold">{adultFemales}</span>
                  <button type="button" onClick={() => increment(setAdultFemales, adultFemales)} className="p-1 bg-white rounded shadow text-emerald-600"><Plus size={16} /></button>
                </div>
              </div>

              {/* Children */}
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div>
                  <span className="block font-medium text-gray-700">Children (Above 8 yrs)</span>
                  <span className="text-xs text-gray-500">Full Price</span>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => decrement(setChildAbove8, childAbove8)} className="p-1 bg-white rounded shadow text-emerald-600"><Minus size={16} /></button>
                  <span className="w-8 text-center font-semibold">{childAbove8}</span>
                  <button type="button" onClick={() => increment(setChildAbove8, childAbove8)} className="p-1 bg-white rounded shadow text-emerald-600"><Plus size={16} /></button>
                </div>
              </div>

              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div>
                  <span className="block font-medium text-gray-700">Children (5-8 yrs)</span>
                  <span className="text-xs text-gray-500">Charged ₹500</span>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => decrement(setChild5to8, child5to8)} className="p-1 bg-white rounded shadow text-emerald-600"><Minus size={16} /></button>
                  <span className="w-8 text-center font-semibold">{child5to8}</span>
                  <button type="button" onClick={() => increment(setChild5to8, child5to8)} className="p-1 bg-white rounded shadow text-emerald-600"><Plus size={16} /></button>
                </div>
              </div>

              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div>
                  <span className="block font-medium text-gray-700">Children (Below 5 yrs)</span>
                  <span className="text-xs text-gray-500 text-green-600">Free</span>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => decrement(setChildUnder5, childUnder5)} className="p-1 bg-white rounded shadow text-emerald-600"><Minus size={16} /></button>
                  <span className="w-8 text-center font-semibold">{childUnder5}</span>
                  <button type="button" onClick={() => increment(setChildUnder5, childUnder5)} className="p-1 bg-white rounded shadow text-emerald-600"><Plus size={16} /></button>
                </div>
              </div>

            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Upload className="h-4 w-4 mr-2 text-emerald-600" />
              Payment Screenshot (Optional)
            </label>
            <input
              type="text"
              value={paymentScreenshot}
              onChange={(e) => setPaymentScreenshot(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Paste image URL"
            />
            <p className="text-sm text-gray-500 mt-1">
              You can upload payment screenshot after booking via WhatsApp
            </p>
          </div>

          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Price per person:</span>
              <span className="font-semibold text-gray-800">₹{pkg.price_per_head}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Number of members:</span>
              <span className="font-semibold text-gray-800">{totalMembers}</span>
            </div>
            <div className="border-t border-gray-300 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">Total Amount:</span>
                <span className="text-2xl font-bold text-emerald-600">₹{totalPrice}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Booking via WhatsApp'}
          </button>

          <p className="text-sm text-gray-500 text-center">
            After submitting, you will be redirected to WhatsApp to complete your booking
          </p>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
