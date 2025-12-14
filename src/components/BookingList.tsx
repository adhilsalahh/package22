import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, MessageCircle, Save } from 'lucide-react';
import { supabase, Booking, Package, Profile } from '../../lib/supabase';
import { sendConfirmationToUser } from '../../lib/whatsapp';
import axios from 'axios';

interface BookingManagementProps {
  showToast: (message: string, type: 'success' | 'error') => void;
}

type BookingWithDetails = Booking & {
  package?: Package;
  profile?: Profile;
  advance_receipt_url?: string;
};

export function BookingManagement({ showToast }: BookingManagementProps) {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'pending_payment' | 'confirmed' | 'cancelled'>('all');
  const [cancellationReason, setCancellationReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const RESEND_API_KEY = "re_DNGK73TN_D5MEY7rQ3KzactPs43dXmRS8";

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (selectedBooking) {
      setAdminNotes(selectedBooking.admin_notes || '');
      setCancellationReason('');
    }
  }, [selectedBooking]);

  // Fetch bookings with package & profile details
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

  // --- Helper: format date ---
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No Date';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // --- Email HTML Templates ---
  const bookingConfirmedHtml = (booking: BookingWithDetails) => {
    const advancePaid = Number(booking.advance_paid || 0);
    const totalAmount = Number(booking.total_price || 0);
    const remainingAmount = totalAmount - advancePaid;
    const formattedDate = formatDate(booking.booking_date || (booking as any).travel_date);

    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #1E40AF;">Dear ${booking.profile?.username || 'User'},</h2>
        <p>Your booking has been <strong style="color: #059669;">CONFIRMED</strong>!</p>
        <p><strong>Booking Details:</strong></p>
        <table style="width:100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Package Title</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${booking.package?.title || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Package ID</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${booking.package_id}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Travel Date</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${formattedDate}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Amount</strong></td><td style="padding: 8px; border: 1px solid #ddd;">₹${totalAmount.toLocaleString()}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Advance Paid</strong></td><td style="padding: 8px; border: 1px solid #ddd;">₹${advancePaid.toLocaleString()}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Remaining Amount</strong></td><td style="padding: 8px; border: 1px solid #ddd;">₹${remainingAmount.toLocaleString()}</td></tr>
        </table>
        <p style="margin-top: 16px;">Thank you for booking with <strong>Va Oru Trippadikkam</strong>!</p>
        <p style="font-size: 12px; color: #888;">This is an automated email. For questions, reply to this email.</p>
      </div>
    `;
  };

  const bookingCancelledHtml = (booking: BookingWithDetails, reason: string) => {
    const formattedDate = formatDate(booking.booking_date || (booking as any).travel_date);
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #B91C1C;">Dear ${booking.profile?.username || 'User'},</h2>
        <p>Your booking for <strong>${booking.package?.title || 'the package'}</strong> scheduled on <strong>${formattedDate}</strong> has been <strong style="color: #B91C1C;">CANCELLED</strong>.</p>
        <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
        <p style="margin-top: 16px;">For queries, contact <strong>info@vaorutrippadikkam.com</strong>.</p>
        <p style="font-size: 12px; color: #888;">This is an automated email.</p>
      </div>
    `;
  };

  const paymentConfirmedHtml = (booking: BookingWithDetails) => {
    const advancePaid = Number(booking.advance_paid || 0);
    const formattedDate = formatDate(booking.booking_date || (booking as any).travel_date);
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #059669;">Dear ${booking.profile?.username || 'User'},</h2>
        <p>We have verified your payment of <strong>₹${advancePaid.toLocaleString()}</strong> for <strong>${booking.package?.title || ''}</strong> scheduled on <strong>${formattedDate}</strong>.</p>
        <p>Your booking is now <strong style="color: #1E40AF;">CONFIRMED</strong>.</p>
        <p style="margin-top: 16px;">Thank you for booking with <strong>Va Oru Trippadikkam</strong>!</p>
        <p style="font-size: 12px; color: #888;">This is an automated email.</p>
      </div>
    `;
  };

  // --- Send email ---
  const sendBookingEmail = async (email: string, subject: string, html: string) => {
    try {
      await axios.post(
        'https://api.resend.com/emails',
        { from: 'Va Oru Trippadikkam <info@vaorutrippadikkam.com>', to: email, subject, html },
        { headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      console.error('Email sending failed:', err);
    }
  };

  // --- Update booking status ---
  const updateBookingStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      const updatePayload: any = { status };
      if (status === 'cancelled') updatePayload.admin_notes = cancellationReason || 'Cancelled by admin';

      const { error } = await supabase.from('bookings').update(updatePayload).eq('id', id);
      if (error) throw error;

      const booking = bookings.find((b) => b.id === id);
      if (!booking) return;

      if (status === 'cancelled' && booking.profile?.email) {
        await sendBookingEmail(booking.profile.email, 'Booking Cancelled', bookingCancelledHtml(booking, cancellationReason));
      }
      if (status === 'confirmed' && booking.profile?.email) {
        await sendBookingEmail(booking.profile.email, 'Booking Confirmed', bookingConfirmedHtml(booking));
      }

      showToast(`Booking ${status} successfully`, 'success');
      setCancellationReason('');
      setSelectedBooking(null);
      await fetchBookings();
    } catch (err: any) {
      console.error('Error updating booking status:', err);
      showToast(err.message || 'Failed to update booking', 'error');
    }
  };

  const saveAdminNotes = async () => {
    if (!selectedBooking) return;
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ admin_notes: adminNotes })
        .eq('id', selectedBooking.id);
      
      if (error) throw error;
      showToast('Notes saved successfully', 'success');
      // Update local state
      setBookings(bookings.map(b => b.id === selectedBooking.id ? { ...b, admin_notes: adminNotes } : b));
    } catch (err: any) {
       console.error('Error saving notes:', err);
       showToast('Failed to save notes', 'error');
    }
  };

  const handleWhatsAppConfirmation = () => {
    if (!selectedBooking) return;
    // Prefer phone from explicit booking field if available (not in types currently, assuming profile)
    // Or check if 'booking.phone' exists (it should if BookingForm saves it)
    const phone = (selectedBooking as any).phone || selectedBooking.profile?.phone;
    
    if (!phone) {
      showToast('No phone number available for this user', 'error');
      return;
    }

    const packageTitle = selectedBooking.package?.title || 'your trip';
    const bookingDate = formatDate(selectedBooking.booking_date || (selectedBooking as any).travel_date);

    sendConfirmationToUser(phone, packageTitle, bookingDate);
  };

  // --- Payment verification ---
  const updateBookingPaymentStatus = async (id: string, paymentStatus: 'paid' | 'not_paid') => {
    try {
      const booking = bookings.find((b) => b.id === id);
      if (!booking) return;

      const advanceAmount = Number(booking.advance_paid || 0) || 500;
      const { error } = await supabase
        .from('bookings')
        .update({
          payment_status: paymentStatus,
          status: paymentStatus === 'paid' ? 'confirmed' : 'pending',
          advance_paid: paymentStatus === 'paid' ? advanceAmount : 0,
        })
        .eq('id', id);
      if (error) throw error;

      if (paymentStatus === 'paid' && booking.profile?.email) {
        await sendBookingEmail(booking.profile.email, 'Payment Confirmed - Booking Confirmed', paymentConfirmedHtml(booking));
      }

      showToast(`Payment ${paymentStatus === 'paid' ? 'confirmed' : 'rejected'}`, 'success');
      setSelectedBooking(null);
      await fetchBookings();
    } catch (err: any) {
      console.error('Error updating payment status:', err);
      showToast(err.message || 'Failed to update payment status', 'error');
    }
  };

  const filteredBookings = bookings.filter(
    (b) =>
      filterStatus === 'all' ||
      (filterStatus === 'pending_payment' && b.payment_status === 'pending') ||
      b.status === filterStatus
  );

  const getReceiptPublicUrl = (path?: string) => {
    if (!path) return null;
    const { data } = supabase.storage.from('receipts').getPublicUrl(path);
    return (data as any)?.publicUrl || (data as any)?.public_url || null;
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );

  return (
    <div>
     <div>
  {/* Filter */}
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-bold text-gray-800">Booking Management</h2>
    <div className="flex space-x-2">
      {(['all', 'pending', 'pending_payment', 'confirmed', 'cancelled'] as const).map((status) => (
        <button
          key={status}
          onClick={() => setFilterStatus(status)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterStatus === status ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Advance</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {filteredBookings.map((booking) => {
            const advancePaid = booking.advance_paid ? Number(booking.advance_paid) : 0;
            const displayDate = booking.booking_date || (booking as any).travel_date || null;

            return (
              <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.id?.slice(0, 8)}...</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{booking.profile?.username || (booking as any).name || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">{booking.profile?.email || 'N/A'}</div>
                   <div className="text-xs text-gray-500">{(booking as any).phone || booking.profile?.phone || ''}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{booking.package?.title || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {displayDate ? new Date(displayDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No Date'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">₹{advancePaid.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => setSelectedBooking(booking)} className="text-emerald-600 hover:text-emerald-800 transition-colors">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-fade-in-up">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
           <div>
            <h3 className="text-2xl font-bold text-gray-800">Booking Details</h3>
            <p className="text-sm text-gray-500">ID: {selectedBooking.id}</p>
          </div>
          <button onClick={() => setSelectedBooking(null)} className="hover:bg-gray-100 p-2 rounded-full transition-colors">
            <XCircle className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">User Information</h4>
              <div className="space-y-2">
                <p><span className="text-gray-500">Name:</span> <span className="font-semibold">{selectedBooking.profile?.username || (selectedBooking as any).name || 'Unknown'}</span></p>
                <p><span className="text-gray-500">Email:</span> {selectedBooking.profile?.email || 'N/A'}</p>
                <p><span className="text-gray-500">Phone:</span> {(selectedBooking as any).phone || selectedBooking.profile?.phone || 'N/A'}</p>
                <p><span className="text-gray-500">User ID:</span> {selectedBooking.user_id}</p>
              </div>
            </div>

            {/* Package Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Package Information</h4>
              <div className="space-y-2">
                <p><span className="text-gray-500">Package:</span> <span className="font-semibold">{selectedBooking.package?.title || 'N/A'}</span></p>
                <p><span className="text-gray-500">Date:</span> {formatDate(selectedBooking.booking_date || (selectedBooking as any).travel_date)}</p>
                <p><span className="text-gray-500">Price Per Head:</span> ₹{selectedBooking.package?.price_per_head || selectedBooking.package?.price || 0}</p>
              </div>
            </div>
          </div>

          {/* Members (Full Data) */}
          {(selectedBooking as any).members && (selectedBooking as any).members.length > 0 && (
             <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-bold text-gray-800 mb-3">Members ({ (selectedBooking as any).members.length })</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {(selectedBooking as any).members.map((m: any, idx: number) => (
                  <div key={idx} className="bg-white p-2 rounded shadow-sm text-sm">
                    <span className="font-medium">{idx + 1}. {m.name}</span> <span className="text-gray-500">({m.age} yrs)</span>
                  </div>
                ))}
              </div>
             </div>
          )}

          {/* Admin Notes */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
             <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-gray-800">Admin Notes</h4>
                <button onClick={saveAdminNotes} className="flex items-center text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors">
                    <Save className="h-3 w-3 mr-1" /> Save
                </button>
             </div>
             <textarea 
               value={adminNotes} 
               onChange={(e) => setAdminNotes(e.target.value)}
               className="w-full p-2 border rounded resize-y focus:ring-2 focus:ring-yellow-500 focus:outline-none"
               rows={3}
               placeholder="Add internal notes here..."
             />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
                 <div>
                    <p className="text-lg font-bold">Total Amount: ₹{(selectedBooking.total_price ?? 0).toLocaleString()}</p>
                    <p className="text-emerald-600 font-semibold">Advance Paid: ₹{(selectedBooking.advance_paid ?? 0).toLocaleString()}</p>
                    {selectedBooking.utr_id && <p className="text-gray-700">UTR: {selectedBooking.utr_id}</p>}
                 </div>
                 {/* WhatsApp Confirmation Button */}
                 {selectedBooking.status === 'confirmed' && (
                    <button 
                        onClick={handleWhatsAppConfirmation}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center shadow-lg transition-all transform hover:scale-105"
                    >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Send WhatsApp Confirmation
                    </button>
                 )}
            </div>

            {selectedBooking.advance_receipt_url && (
              <div className="pt-4">
                <p className="font-medium text-gray-500 mb-2">Payment Screenshot:</p>
                <div className="relative group">
                     <img
                  src={getReceiptPublicUrl(selectedBooking.advance_receipt_url) || ''}
                  alt="Payment Screenshot"
                  className="border rounded-lg max-h-96 object-contain shadow-md"
                />
                </div>
              </div>
            )}
          </div>

          {/* Payment verify buttons */}
          {selectedBooking.payment_status === 'pending' && (
            <div className="flex gap-4 pt-4 border-t">
              <button
                onClick={() => updateBookingPaymentStatus(selectedBooking.id, 'paid')}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-3 rounded-lg flex items-center justify-center font-bold shadow-lg transition-all"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Confirm Payment
              </button>
              <button
                onClick={() => updateBookingPaymentStatus(selectedBooking.id, 'not_paid')}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white py-3 rounded-lg flex items-center justify-center font-bold shadow-lg transition-all"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Reject Payment
              </button>
            </div>
          )}

          {/* Booking status confirm / cancel */}
          {selectedBooking.status === 'pending' && selectedBooking.payment_status === 'paid' && (
            <div className="flex gap-4 pt-4 border-t">
              <button
                onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-3 rounded-lg flex items-center justify-center font-bold shadow-lg transition-all"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Confirm Booking
              </button>

              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Reason for cancellation..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
                <button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                  className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white py-3 rounded-lg flex items-center justify-center font-bold shadow-lg transition-all"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Cancel Booking
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )}
</div>

    </div>
  );
}
