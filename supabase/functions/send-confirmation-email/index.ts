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
  adult_males?: number;
  adult_females?: number;
  couples?: number;
  child_5_to_8?: number;
  child_under_5?: number;
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
  const shortId = data.id.slice(-5).toUpperCase();

  const balance =
    parseFloat(data.total_price) - parseFloat(data.advance_paid);

  return `
  <html>
    <body style="font-family: Arial, sans-serif; max-width:600px;margin:0 auto;padding:20px;">
      
      <div style="background:#815536;color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0;">
        <h1>${siteName}</h1>
        <p>Booking Confirmation</p>
      </div>

      <div style="background:white;padding:30px;border:1px solid #ddd;border-top:none;">

        <h2 style="color:#815536;">Hi ${data.guest_name},</h2>
        <p>Thank you for booking with us! Here are your booking details.</p>

        <div style="border: 2px dashed #815536; padding: 20px; margin-top: 20px; border-radius: 10px; background:#fafafa;">

          <h3 style="margin-top:0;color:#815536;">Booking Receipt</h3>

          <table style="width:100%;margin-top:10px;">
            <tr>
              <td>Booking ID</td>
              <td style="text-align:right;font-weight:bold;">#${shortId}</td>
            </tr>
            <tr>
              <td>Date</td>
              <td style="text-align:right;font-weight:bold;">
                ${new Date(data.booking_date).toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })}
              </td>
            </tr>
            <tr>
              <td>Package</td>
              <td style="text-align:right;font-weight:bold;">
                ${data.package_title || "N/A"}
              </td>
            </tr>
          </table>

          <hr style="margin:15px 0;" />

          <h4>Guest Details (${data.number_of_members} Total)</h4>
          <ul style="font-size:14px;line-height:1.6;">
            ${data.couples ? `<li>Couples: <strong>${data.couples}</strong> (${data.couples * 2} persons)</li>` : ""}
            ${data.adult_males ? `<li>Adult Males: <strong>${data.adult_males}</strong></li>` : ""}
            ${data.adult_females ? `<li>Adult Females: <strong>${data.adult_females}</strong></li>` : ""}
            ${data.child_5_to_8 ? `<li>Children (5–8 yrs): <strong>${data.child_5_to_8}</strong></li>` : ""}
            ${data.child_under_5 ? `<li>Children (Below 5 yrs): <strong>${data.child_under_5}</strong></li>` : ""}
          </ul>

          <table style="width:100%;margin-top:20px;border-top:2px solid #ddd;">
            <tr>
              <td><strong>Total Amount</strong></td>
              <td style="text-align:right;font-weight:bold;color:#815536;">
                ₹${parseFloat(data.total_price).toLocaleString()}
              </td>
            </tr>
            <tr>
              <td style="color:#2ecc71;">Advance Paid</td>
              <td style="text-align:right;color:#2ecc71;">
                - ₹${parseFloat(data.advance_paid).toLocaleString()}
              </td>
            </tr>
            <tr>
              <td style="color:#e74c3c;"><strong>Balance Due</strong></td>
              <td style="text-align:right;color:#e74c3c;font-weight:bold;">
                ₹${balance.toLocaleString()}
              </td>
            </tr>
          </table>
        </div>

        <div style="margin-top:25px;text-align:center;">
          ${data.advance_receipt_url
      ? `<a href="${data.advance_receipt_url}" style="background:#815536;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">View Payment Receipt</a>`
      : ""
    }
          <p style="margin-top:15px;font-size:14px;color:#666;">
            Please show this email at the time of arrival.
          </p>
        </div>

      </div>

      <div style="background:#815536;color:white;text-align:center;padding:20px;border-radius:0 0 10px 10px;">
        © 2025 ${siteName}. All rights reserved.
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

    // Fetch settings from new smtp_settings table
    const { data: settingsArray } = await supabase
      .from("smtp_settings")
      .select("setting_key,setting_value");

    const settings: Record<string, any> = {};
    settingsArray?.forEach((s: any) => {
      settings[s.setting_key] = s.setting_value;
    });

    const siteName = settings.from_name || "Va Oru Trippadikkam";

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
