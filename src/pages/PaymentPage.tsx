import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import QRCode from "qrcode";
import { CheckCircle } from "lucide-react";

export default function AdvancePaymentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [utr, setUtr] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load Booking + User Info
  useEffect(() => {
    if (!id) return;
    const loadBooking = async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          profiles:user_id ( full_name, phone, email ),
          packages(title)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) console.error("Error loading booking:", error);
      else setBooking(data);
    };
    loadBooking();
  }, [id]);

  // Generate QR Code
  useEffect(() => {
    if (!booking) return;
    const upi = "8129464465@okaxis";
    const name = "Va Oru Trippadikkam";
    const amount = booking.advance_amount || 0;
    const upiUrl = `upi://pay?pa=${upi}&pn=${name}&am=${amount}&cu=INR&tn=Advance`;
    QRCode.toDataURL(upiUrl).then(setQrCodeUrl);
  }, [booking]);

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const filename = `receipt_${Date.now()}.jpg`;
    try {
      const { error } = await supabase.storage
        .from("receipts")
        .upload(filename, file, { upsert: true });
      if (error) throw error;

      const { data } = supabase.storage.from("receipts").getPublicUrl(filename);
      setReceiptUrl(data.publicUrl);
      alert("Receipt uploaded successfully!");
    } catch (err: any) {
      console.error(err);
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Submit Payment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr || !receiptUrl) {
      alert("Enter UTR and upload receipt first!");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          advance_paid: true,
          advance_utr: utr,
          advance_receipt_url: receiptUrl,
          payment_status: "paid",
          status: "confirmed",
        })
        .eq("id", id);
      if (error) throw error;

      alert("Advance payment updated!");
      navigate("/bookings");
    } catch (err: any) {
      console.error("Submit error:", err);
      alert("Failed to submit payment: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return <div className="text-center mt-10">Loading...</div>;

  // Already paid UI
  if (booking.advance_paid)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow text-center">
          <CheckCircle className="text-green-600 w-16 h-16 mx-auto" />
          <h2 className="text-xl font-bold mt-3">Advance Already Paid</h2>
          <p className="mt-2">Paid Amount: ₹{booking.advance_amount}</p>
          <button
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
            onClick={() => navigate("/bookings")}
          >
            Go Back
          </button>
        </div>
      </div>
    );

  return (
    <div className="max-w-xl mx-auto mt-8 bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Pay Advance</h1>

      <div className="mb-4">
        <p><strong>Name:</strong> {booking.profiles?.full_name || "Guest"}</p>
        <p><strong>Phone:</strong> {booking.profiles?.phone || "N/A"}</p>
        <p><strong>Package:</strong> {booking.packages?.title}</p>
        <p><strong>Advance Amount:</strong> ₹{booking.advance_amount}</p>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold mb-2">Scan QR to Pay</h2>
        {qrCodeUrl && <img src={qrCodeUrl} className="mx-auto w-48" />}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">UTR / Transaction ID</label>
          <input
            className="w-full border px-3 py-2 rounded"
            value={utr}
            required
            onChange={(e) => setUtr(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Upload Payment Receipt</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {file && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="mt-2 bg-blue-600 text-white px-3 py-1 rounded"
            >
              {uploading ? "Uploading..." : "Upload Receipt"}
            </button>
          )}
          {receiptUrl && <img src={receiptUrl} className="mt-3 rounded border w-32" />}
        </div>

        <button
          type="submit"
          disabled={loading || uploading || !receiptUrl}
          className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Payment"}
        </button>
      </form>
    </div>
  );
}
