// ============================================================
// utils.js — Shared helpers used by every page
// ============================================================
export { supabase, SUPABASE_URL } from './supabase.js'
import { supabase } from './supabase.js'
import { translations } from './i18n.js'

// ── Language ────────────────────────────────────────────────
export function getLang() {
  return localStorage.getItem('lang') || 'en'
}
export function setLang(lang) {
  localStorage.setItem('lang', lang)
  window.location.reload()
}
export function t(key) {
  const lang = getLang()
  return translations[lang]?.[key] ?? translations['en'][key] ?? key
}

// ── Auth ─────────────────────────────────────────────────────
export async function getUser() {
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return null
  const { data: profile, error: profileErr } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (profileErr) {
    // Surface the real error so it isn't silently swallowed
    throw new Error(`Profile query failed: ${profileErr.message} (code: ${profileErr.code})`)
  }
  return profile ? { ...user, ...profile } : null
}

function rootPath() {
  const p = window.location.pathname
  return (p.includes('/owner/') || p.includes('/tenant/')) ? '../' : './'
}

export async function requireAuth(expectedRole = null) {
  const user = await getUser()
  if (!user) { window.location.href = rootPath() + 'index.html'; return null }
  if (expectedRole && user.role !== expectedRole) {
    window.location.href = rootPath() + (user.role === 'owner' ? 'owner/dashboard.html' : 'tenant/dashboard.html')
    return null
  }
  return user
}

// ── Formatting ───────────────────────────────────────────────
export function formatCurrency(amount) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount ?? 0)
}

export function formatDate(d) {
  if (!d) return t('not_available')
  return new Intl.DateTimeFormat(getLang() === 'de' ? 'de-DE' : 'en-GB').format(new Date(d))
}

export function formatMonthYear(d) {
  if (!d) return ''
  return new Intl.DateTimeFormat(getLang() === 'de' ? 'de-DE' : 'en-GB', { month: 'long', year: 'numeric' }).format(new Date(d))
}

// ── Status badge ─────────────────────────────────────────────
export function badge(status) {
  const map = {
    pending:  'bg-amber-100 text-amber-800',
    partial:  'bg-orange-100 text-orange-800',
    paid:     'bg-emerald-100 text-emerald-800',
    active:   'bg-emerald-100 text-emerald-800',
    ended:    'bg-gray-100 text-gray-600',
    occupied: 'bg-blue-100 text-blue-800',
    vacant:   'bg-gray-100 text-gray-600',
  }
  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] ?? map.ended}">${t(status) || status}</span>`
}

// ── Toast ────────────────────────────────────────────────────
export function toast(msg, type = 'success') {
  document.getElementById('_toast')?.remove()
  const colors = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-indigo-600' }
  const el = document.createElement('div')
  el.id = '_toast'
  el.className = `fixed bottom-5 right-5 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-xl ${colors[type] ?? colors.info}`
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3500)
}

// ── Modal ────────────────────────────────────────────────────
export function openModal(title, body, footer = '') {
  document.getElementById('_modal')?.remove()
  const el = document.createElement('div')
  el.id = '_modal'
  el.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
  el.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 class="text-base font-semibold text-gray-900">${title}</h2>
        <button onclick="document.getElementById('_modal').remove()"
          class="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">&times;</button>
      </div>
      <div class="px-6 py-5 overflow-y-auto flex-1 space-y-4">${body}</div>
      ${footer ? `<div class="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">${footer}</div>` : ''}
    </div>`
  el.addEventListener('click', e => { if (e.target === el) el.remove() })
  document.body.appendChild(el)
}

export function closeModal() { document.getElementById('_modal')?.remove() }

// ── Form field helpers ───────────────────────────────────────
export const inp  = `w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`
export const lbl  = `block text-sm font-medium text-gray-700 mb-1`
export const btn  = `px-4 py-2 rounded-lg text-sm font-medium transition`
export const btnP = `${btn} bg-indigo-600 hover:bg-indigo-700 text-white`
export const btnS = `${btn} border border-gray-300 hover:bg-gray-50 text-gray-700`
export const btnD = `${btn} bg-red-600 hover:bg-red-700 text-white`

// ── Navigation HTML ──────────────────────────────────────────
export function ownerSidebar(active, name) {
  const lang  = getLang()
  const other = lang === 'en' ? 'DE' : 'EN'
  const items = [
    { key: 'dashboard', icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`, href: 'dashboard.html' },
    { key: 'houses',    icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`, href: 'houses.html' },
    { key: 'tenants',   icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`, href: 'tenants.html' },
    { key: 'rent',      icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>`, href: 'rent.html' },
  ]
  const nav = items.map(({ key, icon, href }) => {
    const a = active === key
    return `<a href="${href}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${a ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}">${icon}${t(key)}</a>`
  }).join('')
  return `
    <div class="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
      <div class="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm select-none">R</div>
      <span class="font-bold text-gray-900 text-sm">${t('app_name')}</span>
    </div>
    <nav class="flex-1 px-3 py-4 space-y-0.5">${nav}</nav>
    <div class="px-4 py-4 border-t border-gray-100">
      <p class="text-xs text-gray-400 truncate mb-2">${name ?? ''}</p>
      <div class="flex gap-2">
        <button onclick="window.__langToggle()" class="text-xs px-2.5 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 font-medium">${other}</button>
        <button onclick="window.__logout()" class="text-xs px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg font-medium">${t('logout')}</button>
      </div>
    </div>`
}

export function tenantTopNav(active, name) {
  const lang  = getLang()
  const other = lang === 'en' ? 'DE' : 'EN'
  const items = [
    { key: 'dashboard',    href: 'dashboard.html' },
    { key: 'rent_history', href: 'rent-history.html' },
  ]
  const links = items.map(({ key, href }) => {
    const a = active === key
    return `<a href="${href}" class="px-3 py-2 rounded-lg text-sm font-medium transition ${a ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}">${t(key)}</a>`
  }).join('')
  return `
    <div class="flex items-center gap-2">
      <div class="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs select-none">R</div>
      <span class="font-bold text-gray-900 text-sm">${t('app_name')}</span>
    </div>
    <div class="flex items-center gap-1">${links}</div>
    <div class="flex items-center gap-2">
      <span class="text-xs text-gray-400 hidden sm:inline">${name ?? ''}</span>
      <button onclick="window.__langToggle()" class="text-xs px-2.5 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 font-medium">${other}</button>
      <button onclick="window.__logout()" class="text-xs px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg font-medium">${t('logout')}</button>
    </div>`
}

// ── Page bootstrap ───────────────────────────────────────────
export async function setupOwnerPage(active) {
  const user = await requireAuth('owner')
  if (!user) return null
  document.getElementById('sidebar').innerHTML = ownerSidebar(active, user.name)
  window.__langToggle = () => setLang(getLang() === 'en' ? 'de' : 'en')
  window.__logout = async () => { await supabase.auth.signOut(); window.location.href = '../index.html' }
  return user
}

export async function setupTenantPage(active) {
  const user = await requireAuth('tenant')
  if (!user) return null
  document.getElementById('topnav').innerHTML = tenantTopNav(active, user.name)
  window.__langToggle = () => setLang(getLang() === 'en' ? 'de' : 'en')
  window.__logout = async () => { await supabase.auth.signOut(); window.location.href = '../index.html' }
  return user
}

// ── Owner layout shell ────────────────────────────────────────
export const ownerShell = (pageTitle, bodyHtml) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${pageTitle} — RentManager</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
</head>
<body class="bg-gray-50 min-h-screen">
  <div class="flex min-h-screen">
    <aside id="sidebar" class="w-56 bg-white border-r border-gray-100 flex-shrink-0 flex flex-col"></aside>
    <main class="flex-1 p-8 min-w-0">
      <div id="content">${bodyHtml}</div>
    </main>
  </div>
</body>
</html>`

// ── Rent record generator ─────────────────────────────────────
export async function generateRentRecords(leaseId, startDate, endDate, monthlyRent, dueDay) {
  const records = []
  const end = new Date(endDate)
  let current = new Date(startDate)
  // Align to due day
  current = new Date(current.getFullYear(), current.getMonth(), dueDay)
  if (current < new Date(startDate)) {
    current = new Date(current.getFullYear(), current.getMonth() + 1, dueDay)
  }
  while (current <= end) {
    records.push({
      lease_id:    leaseId,
      due_date:    current.toISOString().split('T')[0],
      amount_due:  parseFloat(monthlyRent),
      amount_paid: 0,
      status:      'pending'
    })
    current = new Date(current.getFullYear(), current.getMonth() + 1, dueDay)
  }
  if (records.length) {
    const { error } = await supabase.from('rent_records').insert(records)
    if (error) throw error
  }
  return records.length
}
