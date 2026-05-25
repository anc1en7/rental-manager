// Supabase Edge Function — delete-tenant
// Called by the house owner to permanently delete a tenant account.
// Blocks deletion if the tenant has any active lease.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── 1. Verify caller is an owner ─────────────────────────────────────
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader, apikey: Deno.env.get('SUPABASE_ANON_KEY')! } } }
    )
    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
    const { data: { user: caller }, error: authErr } = await callerClient.auth.getUser(jwt)
    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: authErr?.message ?? 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: profile } = await callerClient
      .from('profiles').select('role').eq('id', caller.id).single()
    if (profile?.role !== 'owner') {
      return new Response(JSON.stringify({ error: 'Only the house owner can delete tenants.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── 2. Parse request body ────────────────────────────────────────────
    const { tenant_id } = await req.json()
    if (!tenant_id) {
      return new Response(JSON.stringify({ error: 'tenant_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── 3. Block deletion if tenant has an active lease ──────────────────
    const { data: activeLeases } = await adminClient
      .from('leases')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('status', 'active')

    if (activeLeases && activeLeases.length > 0) {
      return new Response(JSON.stringify({ error: 'tenant_has_active_lease' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── 4. Delete auth user (cascades: profile → leases → rent_records) ──
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(tenant_id)
    if (deleteErr) {
      return new Response(JSON.stringify({ error: deleteErr.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
