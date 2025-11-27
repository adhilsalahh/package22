import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, PaymentSettings } from '../lib/supabase';
import { Upload, CheckCircle } from 'lucide-react';

export default function RemainingPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings[]>([]);
  const [utr, setUtr] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadBooking();
      loadPaymentSettings();
    }
  }, [id]);

  async function loadBooking() {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          package:packages(title)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setBooking(data);
    } catch (error) {
      console.error('Error loading booking:', error);
    }
  }

  async function loadPaymentSettings() {
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*');

      if (error) throw error;
      setPaymentSettings(data || []);
    } catch (error) {
      console.error('Error loading payment settings:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          remaining_paid: true,
          remaining_utr: utr,
          remaining_receipt_url: receiptUrl,
          full_payment_done: true,
          status: 'confirmed',
        })
        .eq('id', id);

      if (error) throw error;

      alert('Remaining payment submitted successfully! Booking confirmed.');
      navigate('/bookings');
    } catch (error) {
      console.error('Error submitting payment:', error);
      alert('Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  if (!booking.advance_paid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4">Advance Payment Required</h1>
          <p className="mb-4">Please pay the advance first before the remaining balance.</p>
          <button
            onClick={() => navigate(`/advance-payment/${id}`)}
            className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700"
          >
            Pay Advance
          </button>
        </div>
      </div>
    );
  }

  if (booking.full_payment_done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Payment Complete</h1>
          <p className="mb-4">Your booking is fully paid and confirmed. Thank you!</p>
          <button
            onClick={() => navigate('/bookings')}
            className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const remainingAmount = booking.total_amount - booking.advance_amount;
  const upiId = paymentSettings.find(s => s.setting_key === 'upi_id')?.setting_value || '8129464465@okaxis';
  const payeeName = paymentSettings.find(s => s.setting_key === 'payee_name')?.setting_value || 'Va Oru Trippadikkam';
  const upiLink = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${remainingAmount}&cu=INR&tn=Remaining+Payment`;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Pay Remaining Balance</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <p><strong>Package:</strong> {booking.package?.title}</p>
          <p><strong>Travel Date:</strong> {new Date(booking.travel_date).toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> ₹{booking.total_amount}</p>
          <p><strong>Advance Paid:</strong> ₹{booking.advance_amount}</p>
          <p><strong>Remaining Balance:</strong> ₹{remainingAmount}</p>
        </div>

        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 mb-6">
          <h2 className="font-semibold text-gray-800 mb-2">Payment Instructions</h2>
          <p className="mb-2">Click below to pay the remaining balance via Google Pay / UPI:</p>
          <a
            href={upiLink}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-block"
          >
            Pay ₹{remainingAmount} via UPI
          </a>
          <p className="mt-2 text-sm text-gray-600">
            After payment, enter your UTR/Transaction ID and upload receipt to confirm.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
          <div>
            <label className="block text-gray-700 font-medium mb-1">UTR / Transaction ID</label>
            <input
              type="text"
              required
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Payment Receipt URL</label>
            <input
              type="url"
              required
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="https://example.com/receipt.jpg"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Remaining Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}
