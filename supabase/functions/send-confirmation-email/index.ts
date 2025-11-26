import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

interface EmailRequest {
  bookingId: string
  userEmail: string
  userName: string
  packageTitle: string
  travelDate: string
  totalAmount: number
  advanceAmount: number
  members: Array<{ name: string; phone: string }>
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    const emailData: EmailRequest = await req.json()

    const membersList = emailData.members
      .map((m, i) => `${i + 1}. ${m.name} - ${m.phone}`)
      .join('\n')

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #6b7280; }
            .value { color: #111827; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Booking Confirmed!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your adventure awaits</p>
            </div>
            
            <div class="content">
              <div class="success-badge">✓ Confirmed</div>
              
              <div class="info-box">
                <h2 style="margin-top: 0; color: #10b981;">Trip Details</h2>
                <div class="info-row">
                  <span class="label">Package:</span>
                  <span class="value">${emailData.packageTitle}</span>
                </div>
                <div class="info-row">
                  <span class="label">Travel Date:</span>
                  <span class="value">${emailData.travelDate}</span>
                </div>
                <div class="info-row">
                  <span class="label">Booking ID:</span>
                  <span class="value">${emailData.bookingId.slice(0, 8)}</span>
                </div>
              </div>

              <div class="info-box">
                <h2 style="margin-top: 0; color: #10b981;">Payment Summary</h2>
                <div class="info-row">
                  <span class="label">Total Amount:</span>
                  <span class="value">₹${emailData.totalAmount.toLocaleString()}</span>
                </div>
                <div class="info-row">
                  <span class="label">Advance Paid:</span>
                  <span class="value">₹${emailData.advanceAmount.toLocaleString()}</span>
                </div>
                <div class="info-row">
                  <span class="label">Balance Due:</span>
                  <span class="value">₹${(emailData.totalAmount - emailData.advanceAmount).toLocaleString()}</span>
                </div>
              </div>

              <div class="info-box">
                <h2 style="margin-top: 0; color: #10b981;">Travelers</h2>
                <pre style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 10px 0;">${membersList}</pre>
              </div>

              <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1e40af;">Contact Information</h3>
                <p style="margin: 5px 0;">📞 Phone: +91 7592049934</p>
                <p style="margin: 5px 0;">📞 Phone: +91 9495919934</p>
                <p style="margin: 5px 0;">📧 Email: info@vaorutrippadikkam.com</p>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                If you have any questions or need to make changes to your booking, please contact us using the details above.
              </p>
            </div>

            <div class="footer">
              <p>Thank you for choosing Va Oru Trippadikkam!</p>
              <p>We look forward to making your trip memorable.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const emailText = `
Booking Confirmed!

Dear ${emailData.userName},

Your booking has been confirmed!

Trip Details:
- Package: ${emailData.packageTitle}
- Travel Date: ${emailData.travelDate}
- Booking ID: ${emailData.bookingId.slice(0, 8)}

Payment Summary:
- Total Amount: ₹${emailData.totalAmount.toLocaleString()}
- Advance Paid: ₹${emailData.advanceAmount.toLocaleString()}
- Balance Due: ₹${(emailData.totalAmount - emailData.advanceAmount).toLocaleString()}

Travelers:
${membersList}

Contact Information:
- Phone: +91 7592049934 / +91 9495919934
- Email: info@vaorutrippadikkam.com

Thank you for choosing Va Oru Trippadikkam!
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Va Oru Trippadikkam <onboarding@resend.dev>',
        to: [emailData.userEmail],
        subject: `Booking Confirmed - ${emailData.packageTitle}`,
        html: emailHtml,
        text: emailText,
      }),
    })

    const responseData = await res.json()

    if (!res.ok) {
      console.error('Resend API error:', responseData)
      throw new Error(`Failed to send email: ${JSON.stringify(responseData)}`)
    }

    return new Response(
      JSON.stringify({ success: true, messageId: responseData.id }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending confirmation email:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    )
  }
})
