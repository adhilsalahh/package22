import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { supabase, Booking, Package, Profile } from '../../lib/supabase';

interface BookingManagementProps {
  showToast: (message: string, type: 'success' | 'error') => void;
}

type BookingWithDetails = Booking & {
  package?: Package;
  profile?: Profile;
  advance_receipt_url?: string;
  package_title?: string; // ✅ Added
};

export function BookingManagement({ showToast }: BookingManagementProps) {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'pending_payment' | 'confirmed' | 'cancelled'>('all');
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  // ----------------------------------------
  // FETCH ALL BOOKINGS + RELATIONS
  // ----------------------------------------
  const fetchBookings = async () => {
    try {
      setLoading(true);

      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const bookingsWithDetails = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          const [packageRes, profileRes] = await Promise.all([
            supabase.from('packages').select('*').eq('id', booking.package_id).maybeSingle(),
            supabase.from('profiles').select('*').eq('id', booking.user_id).maybeSingle(),
          ]);

          return {
            ...booking,
            package: packageRes.data || undefined,
            profile: profileRes.data || undefined,
            advance_receipt_url: booking.advance_receipt_url || undefined,
            package_title: booking.package_title || '', // ✅ now stored
          };
        })
      );

      setBookings(bookingsWithDetails);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      showToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------
  // SEND CONFIRMATION EMAIL (EDGE FUNCTION)
  // ----------------------------------------
  const sendConfirmationEmail = async (booking: BookingWithDetails) => {
    try {
      if (!booking.profile?.email) return;

      const travelDate = booking.booking_date || (booking as any).travel_date || new Date().toISOString();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      await fetch(`${supabaseUrl}/functions/v1/send-confirmation-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: booking.profile.email,
          bookingData: {
            id: booking.id,
            guest_name: booking.profile.username || 'User',
           
            package_title: booking.package_title || booking.package?.title || '',
            booking_date: travelDate,
           
            number_of_members: booking.number_of_members || 1,
            total_price: String(booking.total_price || 0),
            advance_paid: String(booking.advance_paid || 0),
            status: booking.status || 'pending',
            payment_status: booking.payment_status || 'pending',
            advance_receipt_url: booking.advance_receipt_url || '',
          },
        }),
      });
    } catch (err) {
      console.error('Error Sending Email:', err);
    }
  };

  // ----------------------------------------
  // GET PUBLIC RECEIPT URL
  // ----------------------------------------
  const getReceiptPublicUrl = (path?: string) => {
    if (!path) return null;
    try {
      const { data } = supabase.storage.from('receipts').getPublicUrl(path);
      return (data as any)?.publicUrl || null;
    } catch {
      return null;
    }
  };

  // ----------------------------------------
  // UPDATE BOOKING STATUS (Confirmed / Cancelled)
  // ----------------------------------------
  const updateBookingStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      const updatePayload: any = { status };
      if (status === 'cancelled') updatePayload.admin_notes = cancellationReason || 'Cancelled by admin';

      const { error } = await supabase.from('bookings').update(updatePayload).eq('id', id);
      if (error) throw error;

      const booking = bookings.find((b) => b.id === id);
      if (!booking) return;

      if (status === 'confirmed') await sendConfirmationEmail(booking);

      showToast(`Booking ${status}`, 'success');
      setSelectedBooking(null);
      setCancellationReason('');
      fetchBookings();
    } catch (err: any) {
      showToast(err.message || 'Failed to update booking', 'error');
    }
  };

  // ----------------------------------------
  // UPDATE PAYMENT STATUS (Paid / Not Paid)
  // ----------------------------------------
  const updateBookingPaymentStatus = async (id: string, paymentStatus: 'paid' | 'not_paid') => {
    try {
      const booking = bookings.find((b) => b.id === id);
      if (!booking) return;

      const advanceAmount = Number(booking.advance_amount || booking.advance_paid || 0);

      const { error } = await supabase
        .from('bookings')
        .update({
          payment_status: paymentStatus,
          status: paymentStatus === 'paid' ? 'confirmed' : 'pending',
          advance_paid: paymentStatus === 'paid' ? advanceAmount : 0,
        })
        .eq('id', id);

      if (error) throw error;

      if (paymentStatus === 'paid') await sendConfirmationEmail(booking);

      showToast(`Payment ${paymentStatus === 'paid' ? 'confirmed' : 'rejected'}`, 'success');
      setSelectedBooking(null);
      fetchBookings();
    } catch (err: any) {
      showToast(err.message || 'Failed to update payment status', 'error');
    }
  };

  // ----------------------------------------
  // FILTER LOGIC
  // ----------------------------------------
  const filteredBookings = bookings.filter(
    (b) =>
      filterStatus === 'all' ||
      (filterStatus === 'pending_payment' && b.payment_status === 'pending') ||
      b.status === filterStatus
  );

  // ----------------------------------------
  // LOADING STATE
  // ----------------------------------------
  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full"></div>
      </div>
    );

  // ----------------------------------------
  // MAIN RETURN
  // ----------------------------------------
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Booking Management</h2>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'pending_payment', 'confirmed', 'cancelled'] as const).map((status) => (
          <button
            key={status}
            className={`px-3 py-1 rounded ${
              filterStatus === status ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setFilterStatus(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Booking Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3">Booking ID</th>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Package</th>
              <th className="px-6 py-3">Travel Date</th>
              <th className="px-6 py-3">Advance Paid</th>
              <th className="px-6 py-3">UTR</th>
              <th className="px-6 py-3">Total</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBookings.map((b) => {
              const displayDate = b.booking_date || (b as any).travel_date;

              return (
                <tr key={b.id}>
                  <td className="px-6 py-4">{b.id.slice(0, 8)}...</td>

                  <td className="px-6 py-4">
                    {b.profile?.username || 'Unknown'}
                    <div className="text-xs text-gray-500">{b.profile?.email}</div>
                  </td>

                  <td className="px-6 py-4">
                    {b.package_title || b.package?.title || 'N/A'}
                  </td>

                  <td className="px-6 py-4">
                    {displayDate
                      ? new Date(displayDate).toLocaleDateString('en-IN')
                      : 'No Date'}
                  </td>

                  <td className="px-6 py-4">₹{Number(b.advance_paid || 0).toLocaleString()}</td>
                  <td className="px-6 py-4">{b.advance_utr || '—'}</td>
                  <td className="px-6 py-4">₹{Number(b.total_price || 0).toLocaleString()}</td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        b.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : b.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="text-blue-600"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ---------------- MODAL ---------------- */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Booking Details</h3>
              <button onClick={() => setSelectedBooking(null)}>
                <XCircle className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <p>User: {selectedBooking.profile?.username}</p>
              <p>Email: {selectedBooking.profile?.email}</p>

              <p>
                Package:{" "}
                {selectedBooking.package_title ||
                  selectedBooking.package?.title ||
                  'N/A'}
              </p>

              <p>
                Travel Date:{' '}
                {selectedBooking.booking_date
                  ? new Date(selectedBooking.booking_date).toLocaleDateString('en-IN')
                  : 'No Date'}
              </p>

              <p>Total Amount: ₹{Number(selectedBooking.total_price).toLocaleString()}</p>
              <p>Advance Paid: ₹{Number(selectedBooking.advance_paid).toLocaleString()}</p>

              {selectedBooking.advance_receipt_url && (
                <div>
                  <p className="mb-2">Payment Screenshot:</p>
                  <img
                    src={getReceiptPublicUrl(selectedBooking.advance_receipt_url) || ''}
                    className="max-h-60 object-contain border rounded-lg"
                  />
                </div>
              )}

              {/* Payment Buttons */}
              {selectedBooking.payment_status === 'pending' && (
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => updateBookingPaymentStatus(selectedBooking.id, 'paid')}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg flex items-center justify-center"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" /> Confirm Payment
                  </button>

                  <button
                    onClick={() => updateBookingPaymentStatus(selectedBooking.id, 'not_paid')}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg flex items-center justify-center"
                  >
                    <XCircle className="h-5 w-5 mr-2" /> Reject Payment
                  </button>
                </div>
              )}

              {/* Booking Status */}
              {selectedBooking.status === 'pending' &&
                selectedBooking.payment_status === 'paid' && (
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg flex items-center justify-center"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" /> Confirm Booking
                    </button>

                    <div className="flex-1 flex flex-col">
                      <input
                        type="text"
                        placeholder="Cancellation reason"
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        className="border rounded-lg px-3 py-2 mb-2 w-full"
                      />
                      <button
                        onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                        className="bg-red-600 text-white py-2 rounded-lg flex items-center justify-center w-full"
                      >
                        <XCircle className="h-5 w-5 mr-2" /> Cancel Booking
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
