import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import QRCode from 'qrcode';
import { CheckCircle } from 'lucide-react';

export default function AdvancePaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<any>(null);
  const [qr, setQr] = useState('');
  const [loading, setLoading] = useState(false);
  const [utr, setUtr] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');

  // ==========================
  // Fetch Booking
  // ==========================
  useEffect(() => {
    const fetchBooking = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return console.error(error);
      setBooking(data);
    };

    fetchBooking();
  }, [id]);

  // ==========================
  // Generate QR Code
  // ==========================
  useEffect(() => {
    if (!booking) return;

    const upiId = "8129464465@okaxis";
    const payeeName = "Va Oru Trippadikkam";

    const amount = booking.advance_amount || 0;

    const upiLink = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${amount}&cu=INR&tn=Advance Payment for Booking ${booking.id}`;

    QRCode.toDataURL(upiLink)
      .then(setQr)
      .catch((err) => console.error(err));
  }, [booking]);

  // ==========================
  // Upload Receipt
  // ==========================
  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const filePath = `receipts/${Date.now()}_${file.name}`;

    const { error, data } = await supabase.storage
      .from('receipts')
      .upload(filePath, file);

    if (error) {
      console.error(error);
      setSubmitMessage("Upload failed");
      return;
    }

    const url = supabase.storage.from('receipts').getPublicUrl(filePath).data.publicUrl;
    setReceiptUrl(url);
    setSubmitMessage("Receipt uploaded!");
  };

  // ==========================
  // Submit Payment Proof
  // ==========================
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!utr || !receiptUrl) {
      setSubmitMessage("Please enter UTR & Upload receipt");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          advance_paid: booking.advance_amount,   // Save actual amount
          advance_utr: utr,
          advance_receipt_url: receiptUrl,
          payment_status: "paid",
          status: "pending",   // ⭐ IMPORTANT: Booking still pending
        })
        .eq('id', id);

      if (error) throw error;

      setBooking({
        ...booking,
        advance_paid: booking.advance_amount,
        advance_utr: utr,
        advance_receipt_url: receiptUrl,
        payment_status: "paid",
        status: "pending"
      });

      setSubmitMessage("Payment submitted successfully! 🎉");

    } catch (err: any) {
      console.error(err);
      setSubmitMessage("Failed: " + err.message);
    }

    setLoading(false);
  };

  if (!booking) return <p>Loading…</p>;

  return (
    <div className="max-w-lg mx-auto p-4">
      
      <h1 className="text-2xl font-bold mb-4">Advance Payment</h1>

      {/* Package Info */}
      <div className="p-4 bg-gray-100 rounded-xl mb-4">
        <p><strong>Package:</strong> {booking.package_name}</p>
        <p><strong>Travel Date:</strong> {booking.travel_date}</p>
        <p><strong>Total:</strong> ₹{booking.total_amount}</p>
        <p><strong>Members:</strong> {booking.members}</p>
        <p><strong>Advance Amount:</strong> ₹{booking.advance_amount}</p>
      </div>

      {/* QR CODE */}
      <div className="flex justify-center mb-4">
        {qr && <img src={qr} alt="QR Code" className="w-56" />}
      </div>

      {/* Payment Status */}
      <div className="p-4 bg-white rounded-xl shadow mb-4">
        {booking.payment_status === "paid" ? (
          <p className="text-green-600 flex items-center gap-2">
            <CheckCircle /> Advance Paid: ₹{booking.advance_amount}
          </p>
        ) : (
          <p className="text-red-600">Advance Pending: ₹{booking.advance_amount}</p>
        )}
      </div>

      {/* Upload form */}
      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          type="text"
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Enter UTR / Transaction ID"
          required
        />

        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full border p-2 rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 w-full text-white p-2 rounded mt-2"
        >
          {loading ? "Submitting..." : "Submit Payment Proof"}
        </button>

      </form>

      {submitMessage && <p className="mt-3 text-center">{submitMessage}</p>}
    </div>
  );
}
