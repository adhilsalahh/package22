import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import QRCode from 'qrcode';
import { CheckCircle } from 'lucide-react';

interface Booking {
  id: string;
  booking_date: string;
  total_price: number;
  advance_amount: number;
  advance_paid: boolean;
  package: { title: string };
  user: { full_name: string };
}

interface PaymentSetting {
  setting_key: string;
  setting_value: string;
}

export default function AdvancePaymentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [utr, setUtr] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [loading, setLoading] = useState(false);

  // Load booking
  useEffect(() => {
    if (!id) return;

    async function loadBooking() {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          package:packages(title),
          user:profiles(full_name)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Booking load error:', error);
        return;
      }
      setBooking(data);
    }

    async function loadPaymentSettings() {
      const { data, error } = await supabase.from('payment_settings').select('*');
      if (error) {
        console.error('Payment settings load error:', error);
        return;
      }
      setPaymentSettings(data || []);
    }

    loadBooking();
    loadPaymentSettings();
  }, [id]);

  // Generate QR Code
  useEffect(() => {
    if (!booking || booking.advance_paid) return;

    const advanceAmount = booking.advance_amount || 0;
    const upiId = paymentSettings.find((s) => s.setting_key === 'upi_id')?.setting_value || '8129464465@okaxis';
    const payeeName = paymentSettings.find((s) => s.setting_key === 'payee_name')?.setting_value || 'Va Oru Trippadikkam';

    const upiString = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${advanceAmount}&cu=INR&tn=Advance Payment`;

    QRCode.toDataURL(upiString)
      .then(setQrCodeUrl)
      .catch((err) => console.error('QR generation error:', err));
  }, [booking, paymentSettings]);

  // Submit advance payment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    setLoading(true);

    const { error } = await supabase
      .from('bookings')
      .update({
        advance_paid: true,
        advance_utr: utr,
        advance_receipt_url: receiptUrl,
      })
      .eq('id', booking.id);

    if (error) {
      alert('Payment submission failed!');
      console.error(error);
    } else {
      alert('Advance payment submitted!');
      navigate('/bookings');
    }
    setLoading(false);
  };

  // Loading screen
  if (!booking) return <p className="text-center mt-20">Loading booking...</p>;

  // Already paid screen
  if (booking.advance_paid)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Advance Paid</h1>
          <p className="mb-4">You have already paid the advance for this booking.</p>
          <button
            onClick={() => navigate('/bookings')}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );

  // Render advance payment
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Pay Advance</h1>

        {/* Booking Details */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <p><strong>Customer:</strong> {booking.user.full_name}</p>
          <p><strong>Package:</strong> {booking.package.title}</p>
          <p><strong>Travel Date:</strong> {new Date(booking.booking_date).toLocaleDateString()}</p>
          <p><strong>Advance Amount:</strong> ₹{booking.advance_amount.toLocaleString()}</p>
        </div>

        {/* QR Code */}
        <div className="bg-white p-6 rounded-lg shadow-md text-center mb-6">
          <h2 className="text-xl font-semibold mb-4">Scan QR to Pay via UPI</h2>
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="UPI QR Code" className="mx-auto" />
          ) : (
            <p>Generating QR code...</p>
          )}
          <p className="mt-2 font-medium text-gray-700">Amount: ₹{booking.advance_amount}</p>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <div>
            <label className="block mb-1 font-medium">UTR / Transaction ID</label>
            <input
              type="text"
              value={utr}
              required
              onChange={(e) => setUtr(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Payment Receipt URL</label>
            <input
              type="url"
              value={receiptUrl}
              required
              placeholder="https://example.com/receipt.jpg"
              onChange={(e) => setReceiptUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Advance Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}
