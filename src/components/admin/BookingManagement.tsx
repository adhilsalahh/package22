import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { supabase, Booking, Package, Profile } from '../../lib/supabase';
import axios from 'axios';

interface BookingManagementProps {
  showToast: (message: string, type: 'success' | 'error') => void;
}

type BookingWithDetails = Booking & {
  package?: Package;
  profile?: Profile;
};

export function BookingManagement({ showToast }: BookingManagementProps) {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'pending_payment' | 'confirmed' | 'cancelled'>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
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
          };
        })
      );

      setBookings(bookingsWithDetails);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  //  Email send function
  // =========================================
  const sendBookingEmail = async (email: string, username: string, pkg: string, date: string) => {
    try {
      await axios.post("https://api.resend.com/emails", {
        from: "Va Oru Trippadikkam <noreply@yourdomain.com>",
        to: email,
        subject: "Your Booking is Confirmed!",
        html: `
          <h2>Dear ${username},</h2>
          <p>Your booking has been <b>confirmed</b>.</p>
          <p><b>Package:</b> ${pkg}</p>
          <p><b>Travel Date:</b> ${date}</p>
          <p>Thank you for choosing Va Oru Trippadikkam.</p>
        `
      }, {
        headers: {
          Authorization: `Bearer YOUR_RESEND_API_KEY`,
          "Content-Type": "application/json"
        }
      });
    } catch (err) {
      console.error("Email sending failed:", err);
    }
  };

  // =========================================
  //  Booking Status update
  // =========================================
  const updateBookingStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
      if (error) throw error;

      showToast(`Booking ${status} successfully`, 'success');

      const booking = bookings.find(b => b.id === id);
      if (status === 'confirmed' && booking?.profile?.email) {
        await sendBookingEmail(
          booking.profile.email,
          booking.profile.username || 'User',
          booking.package?.title || '',
          booking.travel_date
        );
      }

      fetchBookings();
      setSelectedBooking(null);
    } catch (err: any) {
      console.error('Error updating booking:', err);
      showToast(err.message || 'Failed to update booking', 'error');
    }
  };

  // =========================================
  //  Payment status update (Admin verifies advance)
  // =========================================
  const updateBookingPaymentStatus = async (id: string, paymentStatus: 'paid' | 'not_paid') => {
    try {
      const { error } = await supabase.from('bookings').update({
        payment_status: paymentStatus,
        status: paymentStatus === 'paid' ? 'confirmed' : 'pending'
      }).eq('id', id);

      if (error) throw error;

      showToast(`Payment ${paymentStatus === 'paid' ? 'confirmed' : 'rejected'}`, 'success');
      fetchBookings();
      setSelectedBooking(null);
    } catch (err: any) {
      console.error('Error updating payment status:', err);
      showToast(err.message || 'Failed to update payment status', 'error');
    }
  };

  const filteredBookings = bookings.filter(b =>
    filterStatus === 'all' ||
    (filterStatus === 'pending_payment' && b.payment_status === 'pending') ||
    b.status === filterStatus
  );

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div>
      {/* Filter */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Booking Management</h2>
        <div className="flex space-x-2">
          {(['all', 'pending', 'pending_payment', 'confirmed', 'cancelled'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === status ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3">Booking ID</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Package</th>
                <th className="px-6 py-3">Travel Date</th>
                <th className="px-6 py-3">Advance Paid</th>
                <th className="px-6 py-3">UTR / Txn ID</th>
                <th className="px-6 py-3">Total Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map(booking => {
                const advancePaid = booking.advance_paid ? Number(booking.advance_paid) : 0;
                const totalAmount = booking.total_price ? Number(booking.total_price) : 0;

                return (
                  <tr key={booking.id}>
                    <td className="px-6 py-4">{booking.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4">
                      {booking.profile?.username || 'Unknown'}
                      <div className="text-xs text-gray-500">{booking.profile?.email}</div>
                    </td>
                    <td className="px-6 py-4">{booking.package?.title || 'N/A'}</td>
                    <td className="px-6 py-4">{new Date(booking.travel_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">₹{advancePaid.toLocaleString()}</td>
                    <td className="px-6 py-4">{booking.utr_id || '—'}</td>
                    <td className="px-6 py-4">₹{totalAmount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => setSelectedBooking(booking)} className="text-blue-600">
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Booking Details</h3>
              <button onClick={() => setSelectedBooking(null)}>
                <XCircle className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-gray-500">User</p>
                  <p>{selectedBooking.profile?.username}</p>
                  <p className="text-sm text-gray-500">{selectedBooking.profile?.email}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Package</p>
                  <p>{selectedBooking.package?.title}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Travel Date</p>
                  <p>{new Date(selectedBooking.travel_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-lg font-bold">Total Amount: ₹{(selectedBooking.total_price ?? 0).toLocaleString()}</p>
                <p className="text-blue-600 font-semibold">Advance Paid: ₹{(selectedBooking.advance_paid ?? 0).toLocaleString()}</p>
                {selectedBooking.utr_id && <p className="text-gray-700">UTR / Txn ID: {selectedBooking.utr_id}</p>}
              </div>

              {/* Payment verify */}
              {selectedBooking.payment_status === 'pending' && (
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => updateBookingPaymentStatus(selectedBooking.id, 'paid')}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg flex items-center justify-center"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Confirm Payment
                  </button>
                  <button
                    onClick={() => updateBookingPaymentStatus(selectedBooking.id, 'not_paid')}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg flex items-center justify-center"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Reject Payment
                  </button>
                </div>
              )}

              {/* Booking status confirm */}
              {selectedBooking.status === 'pending' && selectedBooking.payment_status === 'paid' && (
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg flex items-center justify-center"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Confirm Booking
                  </button>
                  <button
                    onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg flex items-center justify-center"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Cancel Booking
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
