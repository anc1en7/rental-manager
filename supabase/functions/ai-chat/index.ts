// Supabase Edge Function — ai-chat
// Provides three AI-powered cards on the owner dashboard:
//   portfolio_insights — portfolio health summary + action items
//   draft_message      — professional message from landlord to a specific tenant
//   rent_analysis      — payment pattern analysis for the last 3 months

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST')    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })

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
      return new Response(JSON.stringify({ error: 'Only the house owner can use AI features.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── 2. Parse request body ────────────────────────────────────────────
    const { type, tenant_id, instructions } = await req.json()
    const validTypes = ['portfolio_insights', 'draft_message', 'rent_analysis']
    if (!validTypes.includes(type)) {
      return new Response(JSON.stringify({ error: 'Invalid type. Must be one of: ' + validTypes.join(', ') }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (type === 'draft_message' && !tenant_id) {
      return new Response(JSON.stringify({ error: 'tenant_id is required for draft_message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── 3. Build prompt based on type ────────────────────────────────────
    let prompt = ''

    if (type === 'portfolio_insights') {
      const { data: houses } = await adminClient
        .from('houses').select('id,name,address,city').eq('owner_id', caller.id)
      const houseIds = (houses ?? []).map((h: any) => h.id)

      let rooms: any[] = []
      let leases: any[] = []
      let rentRecords: any[] = []

      if (houseIds.length) {
        const { data: r } = await adminClient.from('rooms')
          .select('id,house_id,room_number,monthly_rent').in('house_id', houseIds)
        rooms = r ?? []
        const roomIds = rooms.map((r: any) => r.id)

        if (roomIds.length) {
          const { data: l } = await adminClient.from('leases')
            .select('id,room_id,tenant_id,monthly_rent').eq('status', 'active').in('room_id', roomIds)
          leases = l ?? []

          if (leases.length) {
            const now = new Date()
            const m0 = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
            const m1 = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
            const { data: rr } = await adminClient.from('rent_records')
              .select('id,lease_id,due_date,amount_due,amount_paid,status')
              .in('lease_id', leases.map((l: any) => l.id))
              .gte('due_date', m0).lte('due_date', m1)
            rentRecords = rr ?? []
          }
        }
      }

      const occupied  = leases.length
      const totalRooms = rooms.length
      const totalDue  = rentRecords.reduce((s: number, r: any) => s + Number(r.amount_due  || 0), 0)
      const totalPaid = rentRecords.reduce((s: number, r: any) => s + Number(r.amount_paid || 0), 0)
      const overdue   = rentRecords.filter((r: any) => r.status === 'pending' || r.status === 'partial').length
      const houseList = (houses ?? []).map((h: any) => `${h.name} (${h.city})`).join(', ') || 'none'

      prompt = `You are a helpful property management assistant. Analyze this landlord's portfolio and give concise, practical insights.

PORTFOLIO DATA (today: ${new Date().toISOString().split('T')[0]}):
- Properties: ${(houses ?? []).length} house(s) — ${houseList}
- Rooms: ${occupied} occupied / ${totalRooms} total (${totalRooms ? Math.round(occupied / totalRooms * 100) : 0}% occupancy)
- This month: €${totalDue.toFixed(2)} due, €${totalPaid.toFixed(2)} collected (${totalDue ? Math.round(totalPaid / totalDue * 100) : 0}% collection rate)
- Pending or partial payments this month: ${overdue}

Provide a brief 2-sentence portfolio health summary, then a numbered list of 2–3 specific actions the landlord should take right now. Be direct and practical.`
    }

    else if (type === 'draft_message') {
      const { data: tenantProfile } = await adminClient
        .from('profiles').select('id,name').eq('id', tenant_id).single()
      if (!tenantProfile) {
        return new Response(JSON.stringify({ error: 'Tenant not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const { data: lease } = await adminClient
        .from('leases')
        .select('id,room_id,start_date,end_date,monthly_rent,status')
        .eq('tenant_id', tenant_id).eq('status', 'active')
        .limit(1).maybeSingle()

      let recentRentSummary = 'No rent records on file.'
      if (lease) {
        const { data: rr } = await adminClient.from('rent_records')
          .select('due_date,amount_due,amount_paid,status')
          .eq('lease_id', lease.id)
          .order('due_date', { ascending: false })
          .limit(4)
        if (rr && rr.length) {
          recentRentSummary = (rr as any[]).map((r: any) =>
            `${r.due_date}: due €${r.amount_due}, paid €${r.amount_paid} (${r.status})`
          ).join('\n')
        }
      }

      prompt = `You are a property management assistant helping a landlord write professional messages to tenants.

TENANT: ${tenantProfile.name}
LEASE: ${lease ? `Active — monthly rent €${lease.monthly_rent}, started ${lease.start_date}, ends ${lease.end_date}` : 'No active lease'}
RECENT PAYMENTS:
${recentRentSummary}

LANDLORD'S INSTRUCTIONS: ${(instructions || '').trim() || 'Write a general professional message'}

Write a professional, friendly message from the landlord to this tenant. Keep it concise (3–6 sentences). Write only the message body — no subject line, no placeholder like [Your Name], ready to send as-is.`
    }

    else if (type === 'rent_analysis') {
      const { data: houses } = await adminClient
        .from('houses').select('id').eq('owner_id', caller.id)
      const houseIds = (houses ?? []).map((h: any) => h.id)

      let rentRecords: any[] = []

      if (houseIds.length) {
        const { data: rooms } = await adminClient.from('rooms').select('id').in('house_id', houseIds)
        const roomIds = (rooms ?? []).map((r: any) => r.id)

        if (roomIds.length) {
          const { data: leases } = await adminClient.from('leases')
            .select('id,tenant_id').eq('status', 'active').in('room_id', roomIds)
          const leaseIds  = (leases ?? []).map((l: any) => l.id)
          const tenantIds = [...new Set((leases ?? []).map((l: any) => l.tenant_id))]

          const leaseToTenant: Record<string, string> = {}
          if (tenantIds.length) {
            const { data: profiles } = await adminClient.from('profiles')
              .select('id,name').in('id', tenantIds)
            const nameMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p.name]))
            ;(leases ?? []).forEach((l: any) => { leaseToTenant[l.id] = nameMap[l.tenant_id] ?? 'Unknown' })
          }

          if (leaseIds.length) {
            const cutoff = new Date()
            cutoff.setMonth(cutoff.getMonth() - 3)
            const { data: rr } = await adminClient.from('rent_records')
              .select('lease_id,due_date,amount_due,amount_paid,status')
              .in('lease_id', leaseIds)
              .gte('due_date', cutoff.toISOString().split('T')[0])
              .order('due_date', { ascending: false })
            rentRecords = (rr ?? []).map((r: any) => ({ ...r, tenant_name: leaseToTenant[r.lease_id] ?? 'Unknown' }))
          }
        }
      }

      const totalDue  = rentRecords.reduce((s: number, r: any) => s + Number(r.amount_due  || 0), 0)
      const totalPaid = rentRecords.reduce((s: number, r: any) => s + Number(r.amount_paid || 0), 0)

      const byTenant: Record<string, { due: number; paid: number; pending: number }> = {}
      rentRecords.forEach((r: any) => {
        if (!byTenant[r.tenant_name]) byTenant[r.tenant_name] = { due: 0, paid: 0, pending: 0 }
        byTenant[r.tenant_name].due     += Number(r.amount_due  || 0)
        byTenant[r.tenant_name].paid    += Number(r.amount_paid || 0)
        if (r.status === 'pending' || r.status === 'partial') byTenant[r.tenant_name].pending += 1
      })
      const tenantSummary = Object.entries(byTenant)
        .map(([name, d]) => `${name}: paid €${d.paid.toFixed(2)} of €${d.due.toFixed(2)}, ${d.pending} pending/partial`)
        .join('\n') || 'No data available.'

      prompt = `You are a property management assistant. Analyze the last 3 months of rent payment data for this landlord.

PAYMENT DATA (last 3 months):
Overall: €${totalPaid.toFixed(2)} collected of €${totalDue.toFixed(2)} due (${totalDue ? Math.round(totalPaid / totalDue * 100) : 0}% collection rate)

Per-tenant breakdown:
${tenantSummary}

Provide: (1) a one-sentence overall assessment, (2) name any at-risk tenants with a specific concern, (3) one concrete recommendation. Be concise and specific.`
    }

    // ── 4. Call z.ai API (OpenAI-compatible) ────────────────────────────
    const zaiRes = await fetch('https://api.z.ai/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + Deno.env.get('ZAI_API_KEY')!,
      },
      body: JSON.stringify({
        model:      'glm-4.5-flash',
        max_tokens: 512,
        messages:   [{ role: 'user', content: prompt }],
      }),
    })

    if (!zaiRes.ok) {
      const errText = await zaiRes.text()
      console.error('z.ai API error:', zaiRes.status, errText)
      return new Response(JSON.stringify({ error: 'AI service error. Please try again.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const zaiData = await zaiRes.json()
    const content = zaiData.choices?.[0]?.message?.content ?? ''

    return new Response(JSON.stringify({ content }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
