// Supabase Edge Function — send-password-reset
// Generates a password reset link via the admin API and sends it
// through SMTP2GO's HTTP API, bypassing Supabase's built-in mailer.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })

  try {
    const { email, redirectTo } = await req.json()
    if (!email) {
      return new Response(JSON.stringify({ error: 'email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── 1. Generate reset link via admin API ─────────────────────────────────
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: redirectTo || Deno.env.get('SITE_URL') + '/index.html' },
    })

    if (linkErr) {
      console.error('generateLink error:', JSON.stringify(linkErr))
      return new Response(JSON.stringify({ error: linkErr.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const resetUrl  = data.properties.action_link
    const fromEmail = Deno.env.get('SMTP_FROM') || 'noreply@appetitico.com'
    const fromName  = Deno.env.get('SMTP_FROM_NAME') || 'RentManager'

    // ── 2. Send via SMTP2GO HTTP API ─────────────────────────────────────────
    const smtp2goRes = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key:   Deno.env.get('SMTP2GO_API_KEY'),
        to:        [email],
        sender:    `${fromName} <${fromEmail}>`,
        subject:   'Reset your RentManager password',
        html_body: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 16px">
            <h2 style="font-size:20px;font-weight:700;color:#111827;margin-bottom:8px">Reset your password</h2>
            <p style="color:#6b7280;font-size:14px;margin-bottom:24px">
              Click the button below to set a new password for your RentManager account.
              This link expires in 1 hour.
            </p>
            <a href="${resetUrl}"
              style="display:inline-block;background:#4f46e5;color:#fff;font-weight:600;
                     font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none">
              Reset Password
            </a>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>`,
        text_body: `Reset your RentManager password:\n\n${resetUrl}\n\nThis link expires in 1 hour.\nIf you didn't request this, ignore this email.`,
      }),
    })

    const smtp2goBody = await smtp2goRes.json()
    if (!smtp2goRes.ok || smtp2goBody.data?.error) {
      console.error('SMTP2GO error:', JSON.stringify(smtp2goBody))
      return new Response(JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
