import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BookingData {
  id: string;
  guest_name: string;
  package_title?: string;
  booking_date: string;
  number_of_members: number;
  total_price: string;
  advance_paid: string;
  status: string;
  payment_status: string;
  advance_receipt_url?: string;
}

interface EmailRequest {
  to: string;
  bookingData: BookingData;
}

// ---------------- Email template ----------------
function generateBookingEmailHTML(
  data: BookingData,
  siteName: string
): string {
  // Use last 5 digits for short ID
  const shortId = data.id.slice(-5).toUpperCase();

  return `
    <html>
      <body style="font-family: Arial, sans-serif; max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:#815536;color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0;">
          <h1>${siteName}</h1>
          <p>Booking Confirmation</p>
        </div>

        <div style="background:white;padding:30px;border:1px solid #ddd;border-top:none;">

          <h2 style="color:#815536;">Hi ${data.guest_name},</h2>
          <p>Thank you for booking with us! Here is your booking summary:</p>

          <h3 style="margin-top:25px;">Booking Details</h3>

          <p><strong>Booking ID:</strong> #${shortId}</p>
          <p><strong>Booking Date:</strong> ${new Date(
    data.booking_date
  ).toLocaleDateString("en-IN")}</p>

          <p><strong>Package Title:</strong> ${data.package_title || "N/A"
    }</p>

          <p><strong>Members:</strong> ${data.number_of_members}</p>

          <p><strong>Total Price:</strong> ₹${parseFloat(
      data.total_price
    ).toLocaleString()}</p>

          <p><strong>Advance Paid:</strong> ₹${parseFloat(
      data.advance_paid
    ).toLocaleString()}</p>

          <p><strong>Payment Status:</strong> ${data.payment_status}</p>

          ${data.advance_receipt_url
      ? `<p><strong>Receipt:</strong> <a href="${data.advance_receipt_url}">View Receipt</a></p>`
      : ""
    }

          <p style="margin-top:25px;">We look forward to serving you.</p>
        </div>

        <div style="background:#815536;padding:20px;text-align:center;border-radius:0 0 10px 10px;color:white;">
          <p>© 2025 ${siteName}. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

// ---------------- Email sending ----------------
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  settings: Record<string, any>
) {
  try {
    const smtpConfig = {
      smtp_host: settings.smtp_host,
      smtp_port: settings.smtp_port,
      smtp_user: settings.smtp_user,
      smtp_password: settings.smtp_pass,
      from_email: settings.from_email,
      from_name: settings.from_name || "Va Oru Trippadikkam",
    };

    if (
      !smtpConfig.smtp_host ||
      !smtpConfig.smtp_port ||
      !smtpConfig.smtp_user ||
      !smtpConfig.smtp_password ||
      !smtpConfig.from_email
    ) {
      return { success: false, error: "SMTP config missing" };
    }

    const transporter = nodemailer.createTransport({
      host: smtpConfig.smtp_host,
      port: parseInt(smtpConfig.smtp_port),
      secure: parseInt(smtpConfig.smtp_port) === 465,
      auth: {
        user: smtpConfig.smtp_user,
        pass: smtpConfig.smtp_password,
      },
    });

    await transporter.sendMail({
      from: `${smtpConfig.from_name} <${smtpConfig.from_email}>`,
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ---------------- Edge Function ----------------
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const { to, bookingData }: EmailRequest = await req.json();

    if (!to || !bookingData || !bookingData.id)
      throw new Error("Missing required fields");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch settings
    const { data: settingsArray } = await supabase
      .from("site_settings")
      .select("setting_key,setting_value");

    const settings: Record<string, any> = {};
    settingsArray?.forEach((s: any) => {
      settings[s.setting_key] = s.setting_value;
    });

    const siteName = settings.site_name || "Va Oru Trippadikkam";

    const html = generateBookingEmailHTML(bookingData, siteName);

    // Short ID for subject too
    const shortId = bookingData.id.slice(-5).toUpperCase();

    const result = await sendEmail(
      to,
      `Booking Confirmed - #${shortId}`,
      html,
      settings
    );

    if (result.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Booking confirmation email sent",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
