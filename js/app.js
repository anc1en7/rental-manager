// app.js — All shared utilities for RentManager
// Loaded as a plain <script> tag (no ES modules).
// Requires window.supabase to be loaded first via CDN <script> tag.

;(function () {
  'use strict'

  // ── Supabase client ────────────────────────────────────────────────────────
  var SUPABASE_URL      = 'https://wkiuzbsvydmvqjowhnxf.supabase.co'
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndraXV6YnN2eWRtdnFqb3dobnhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzEyNTUsImV4cCI6MjA5MTIwNzI1NX0.CcLnJgrNdETrdIW-hclDeHUnzOuHQjkW9ZJRXf_nR6k'
  var db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // ── Translations ──────────────────────────────────────────────────────────
  var translations = {
    en: {
      app_name:'RentManager', login:'Login', logout:'Logout', email:'Email', password:'Password',
      login_error:'Invalid email or password. Please try again.',
      dashboard:'Dashboard', houses:'Houses', tenants:'Tenants', rent:'Rent', rent_history:'Rent History',
      total_houses:'Total Houses', occupied_rooms:'Occupied Rooms',
      rent_due_this_month:'Rent Due This Month', rent_collected_this_month:'Collected This Month',
      add_house:'Add House', house_name:'House Name', address:'Address', city:'City', country:'Country',
      no_houses:'No houses yet. Add your first house to get started.',
      edit_house:'Edit House', delete_house:'Delete House',
      delete_house_confirm:'Delete this house? All rooms and data will be permanently deleted.',
      rooms_count:'rooms', occupied:'occupied', vacant:'Vacant',
      add_room:'Add Room', room_number:'Room Number / Name', floor:'Floor', area_sqm:'Area (m\u00b2)',
      monthly_rent:'Monthly Rent (\u20ac)', utilities_included:'Utilities Included',
      utility_details:'Utility Details', description:'Description',
      no_rooms:'No rooms yet. Add the first room to this house.',
      edit_room:'Edit Room', delete_room:'Delete Room',
      delete_room_confirm:'Delete this room? All lease and rent history will be lost.',
      back_to_house:'Back to House',
      assign_tenant:'Assign Tenant', create_lease:'Create Lease', select_tenant:'\u2014 Select Tenant \u2014',
      start_date:'Lease Start Date', end_date:'Lease End Date',
      rent_due_day:'Rent Due Day', rent_due_day_hint:'Day of month when rent is due (1\u201328)',
      end_lease:'End Lease', end_lease_confirm:'End this lease? The room will be marked as vacant.',
      current_tenant:'Current Tenant', no_lease:'This room is currently vacant.',
      lease_start:'Lease Start', lease_end:'Lease End', back_to_rooms:'Back to Rooms',
      no_tenants_for_lease:'No tenants available. Add a tenant from the Tenants page first.',
      rent_records:'Rent Records', no_rent_records:'No rent records yet.',
      add_tenant:'Invite Tenant', tenant_name:'Full Name', tenant_email:'Email Address',
      tenant_invite_info:'The tenant will receive an email to set their own password.',
      no_tenants:'No active tenants yet.',
      mark_as_paid:'Mark as Paid', mark_partial:'Partial Payment',
      pending:'Pending', partial:'Partial', paid:'Paid',
      amount_due:'Amount Due', amount_paid:'Amount Paid', due_date:'Due Date',
      paid_on:'Paid On', status:'Status', notes:'Notes (optional)',
      all_houses:'All Houses', all_statuses:'All Statuses', filter_month:'Month',
      payment_amount:'Payment Amount (\u20ac)', no_rent_records_filtered:'No records match the current filters.',
      welcome:'Welcome', your_room:'Your Room', your_house:'Your House',
      current_rent:'Rent This Month', no_active_lease:'You have no active lease. Please contact your landlord.',
      lease_period:'Lease Period', monthly_amount:'Monthly Amount',
      save:'Save', cancel:'Cancel', edit:'Edit', delete:'Delete', close:'Close',
      loading:'Loading\u2026', error:'Something went wrong. Please try again.', success:'Saved successfully.',
      back:'Back', actions:'Actions', name:'Name', not_available:'\u2014', per_month:'/mo',
      floor_label:'Floor', utilities:'Utilities', yes:'Yes', no:'No',
      all_months:'All Months', house_label:'House', room_label:'Room', tenant_label:'Tenant',
      summary:'Summary', total_due:'Total Due', total_paid:'Total Paid', outstanding:'Outstanding',
      active:'Active', ended:'Ended',
    },
    de: {
      app_name:'RentManager', login:'Anmelden', logout:'Abmelden', email:'E-Mail', password:'Passwort',
      login_error:'Ung\u00fcltige E-Mail oder Passwort. Bitte erneut versuchen.',
      dashboard:'\u00dcbersicht', houses:'H\u00e4user', tenants:'Mieter', rent:'Miete', rent_history:'Miethistorie',
      total_houses:'H\u00e4user gesamt', occupied_rooms:'Belegte Zimmer',
      rent_due_this_month:'F\u00e4llige Miete diesen Monat', rent_collected_this_month:'Eingezahlt diesen Monat',
      add_house:'Haus hinzuf\u00fcgen', house_name:'Hausname', address:'Adresse', city:'Stadt', country:'Land',
      no_houses:'Noch keine H\u00e4user. F\u00fcge dein erstes Haus hinzu.',
      edit_house:'Haus bearbeiten', delete_house:'Haus l\u00f6schen',
      delete_house_confirm:'Dieses Haus l\u00f6schen? Alle Zimmer und Daten werden dauerhaft gel\u00f6scht.',
      rooms_count:'Zimmer', occupied:'belegt', vacant:'Leer',
      add_room:'Zimmer hinzuf\u00fcgen', room_number:'Zimmernummer / Name', floor:'Etage', area_sqm:'Fl\u00e4che (m\u00b2)',
      monthly_rent:'Monatsmiete (\u20ac)', utilities_included:'Nebenkosten inklusive',
      utility_details:'Details zu Nebenkosten', description:'Beschreibung',
      no_rooms:'Noch keine Zimmer. F\u00fcge das erste Zimmer hinzu.',
      edit_room:'Zimmer bearbeiten', delete_room:'Zimmer l\u00f6schen',
      delete_room_confirm:'Dieses Zimmer l\u00f6schen? Alle Mietvertrag- und Zahlungsdaten gehen verloren.',
      back_to_house:'Zur\u00fcck zum Haus',
      assign_tenant:'Mieter zuweisen', create_lease:'Mietvertrag erstellen', select_tenant:'\u2014 Mieter ausw\u00e4hlen \u2014',
      start_date:'Mietbeginn', end_date:'Mietende',
      rent_due_day:'F\u00e4lligkeitstag', rent_due_day_hint:'Tag des Monats, an dem die Miete f\u00e4llig ist (1\u201328)',
      end_lease:'Mietvertrag beenden', end_lease_confirm:'Diesen Mietvertrag beenden? Das Zimmer wird als leer markiert.',
      current_tenant:'Aktueller Mieter', no_lease:'Dieses Zimmer ist derzeit leer.',
      lease_start:'Mietbeginn', lease_end:'Mietende', back_to_rooms:'Zur\u00fcck zu Zimmern',
      no_tenants_for_lease:'Keine Mieter verf\u00fcgbar. F\u00fcge zuerst einen Mieter hinzu.',
      rent_records:'Mietdatens\u00e4tze', no_rent_records:'Noch keine Mietdatens\u00e4tze.',
      add_tenant:'Mieter einladen', tenant_name:'Vollst\u00e4ndiger Name', tenant_email:'E-Mail-Adresse',
      tenant_invite_info:'Der Mieter erh\u00e4lt eine E-Mail zum Einrichten seines Passworts.',
      no_tenants:'Noch keine aktiven Mieter.',
      mark_as_paid:'Als bezahlt markieren', mark_partial:'Teilzahlung erfassen',
      pending:'Ausstehend', partial:'Teilzahlung', paid:'Bezahlt',
      amount_due:'F\u00e4lliger Betrag', amount_paid:'Bezahlter Betrag', due_date:'F\u00e4lligkeitsdatum',
      paid_on:'Bezahlt am', status:'Status', notes:'Notizen (optional)',
      all_houses:'Alle H\u00e4user', all_statuses:'Alle Status', filter_month:'Monat',
      payment_amount:'Zahlungsbetrag (\u20ac)', no_rent_records_filtered:'Keine Datens\u00e4tze f\u00fcr die aktuellen Filter.',
      welcome:'Willkommen', your_room:'Dein Zimmer', your_house:'Dein Haus',
      current_rent:'Miete diesen Monat', no_active_lease:'Du hast keinen aktiven Mietvertrag. Bitte kontaktiere deinen Vermieter.',
      lease_period:'Mietzeitraum', monthly_amount:'Monatlicher Betrag',
      save:'Speichern', cancel:'Abbrechen', edit:'Bearbeiten', delete:'L\u00f6schen', close:'Schlie\u00dfen',
      loading:'L\u00e4dt\u2026', error:'Etwas ist schiefgelaufen. Bitte erneut versuchen.', success:'Erfolgreich gespeichert.',
      back:'Zur\u00fcck', actions:'Aktionen', name:'Name', not_available:'\u2014', per_month:'/Mon.',
      floor_label:'Etage', utilities:'Nebenkosten', yes:'Ja', no:'Nein',
      all_months:'Alle Monate', house_label:'Haus', room_label:'Zimmer', tenant_label:'Mieter',
      summary:'Zusammenfassung', total_due:'Gesamt f\u00e4llig', total_paid:'Gesamt bezahlt', outstanding:'Offen',
      active:'Aktiv', ended:'Beendet',
    }
  }

  // ── Language helpers ───────────────────────────────────────────────────────
  function getLang() { return localStorage.getItem('lang') || 'en' }
  function setLang(l) { localStorage.setItem('lang', l); location.reload() }
  function t(key) {
    var l = getLang()
    return (translations[l] && translations[l][key] != null)
      ? translations[l][key]
      : (translations.en[key] != null ? translations.en[key] : key)
  }

  // ── Routing helpers ────────────────────────────────────────────────────────
  function rootPath() {
    var p = window.location.pathname
    return (p.indexOf('/owner/') !== -1 || p.indexOf('/tenant/') !== -1) ? '../' : './'
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
  async function getUser() {
    var authRes = await db.auth.getUser()
    if (authRes.error || !authRes.data.user) return null
    var uid = authRes.data.user.id
    var profRes = await db.from('profiles').select('*').eq('id', uid).single()
    if (profRes.error) {
      throw new Error('Could not load profile: ' + profRes.error.message +
        '. Make sure you ran the SQL schema in Supabase and set your role to "owner".')
    }
    if (!profRes.data) return null
    return Object.assign({}, authRes.data.user, profRes.data)
  }

  async function requireAuth(role) {
    var user = await getUser()
    if (!user) { window.location.href = rootPath() + 'index.html'; return null }
    if (role && user.role !== role) {
      window.location.href = rootPath() + (user.role === 'owner' ? 'owner/dashboard.html' : 'tenant/dashboard.html')
      return null
    }
    return user
  }

  // ── Formatting ─────────────────────────────────────────────────────────────
  function formatCurrency(n) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n || 0)
  }
  function formatDate(d) {
    if (!d) return t('not_available')
    return new Intl.DateTimeFormat(getLang() === 'de' ? 'de-DE' : 'en-GB').format(new Date(d))
  }
  function formatMonthYear(d) {
    if (!d) return ''
    return new Intl.DateTimeFormat(getLang() === 'de' ? 'de-DE' : 'en-GB',
      { month: 'long', year: 'numeric' }).format(new Date(d))
  }

  // ── Status badge ───────────────────────────────────────────────────────────
  function badge(status) {
    var map = {
      pending:'bg-amber-100 text-amber-800', partial:'bg-orange-100 text-orange-800',
      paid:'bg-emerald-100 text-emerald-800', active:'bg-emerald-100 text-emerald-800',
      ended:'bg-gray-100 text-gray-600', occupied:'bg-blue-100 text-blue-800', vacant:'bg-gray-100 text-gray-600'
    }
    var cls = map[status] || 'bg-gray-100 text-gray-600'
    return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' + cls + '">' + (t(status) || status) + '</span>'
  }

  // ── Toast ──────────────────────────────────────────────────────────────────
  function toast(msg, type) {
    var old = document.getElementById('_toast'); if (old) old.remove()
    var colors = { success:'bg-emerald-600', error:'bg-red-600', info:'bg-indigo-600' }
    var el = document.createElement('div')
    el.id = '_toast'
    el.className = 'fixed bottom-5 right-5 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-xl ' + (colors[type] || colors.success)
    el.textContent = msg
    document.body.appendChild(el)
    setTimeout(function() { el.remove() }, 3500)
  }

  // ── Modal ──────────────────────────────────────────────────────────────────
  function openModal(title, body, footer) {
    var old = document.getElementById('_modal'); if (old) old.remove()
    var el = document.createElement('div')
    el.id = '_modal'
    el.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
    el.innerHTML =
      '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">' +
        '<div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">' +
          '<h2 class="text-base font-semibold text-gray-900">' + title + '</h2>' +
          '<button onclick="RM.closeModal()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">&times;</button>' +
        '</div>' +
        '<div class="px-6 py-5 overflow-y-auto flex-1 space-y-4">' + body + '</div>' +
        (footer ? '<div class="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">' + footer + '</div>' : '') +
      '</div>'
    el.addEventListener('click', function(e) { if (e.target === el) el.remove() })
    document.body.appendChild(el)
  }
  function closeModal() { var el = document.getElementById('_modal'); if (el) el.remove() }

  // ── Form class helpers ─────────────────────────────────────────────────────
  var inp  = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
  var lbl  = 'block text-sm font-medium text-gray-700 mb-1'
  var btnP = 'px-4 py-2 rounded-lg text-sm font-medium transition bg-indigo-600 hover:bg-indigo-700 text-white'
  var btnS = 'px-4 py-2 rounded-lg text-sm font-medium transition border border-gray-300 hover:bg-gray-50 text-gray-700'
  var btnD = 'px-4 py-2 rounded-lg text-sm font-medium transition bg-red-600 hover:bg-red-700 text-white'

  // ── Sidebar / Nav HTML ─────────────────────────────────────────────────────
  function ownerSidebar(active, name) {
    var other = getLang() === 'en' ? 'DE' : 'EN'
    var items = [
      { key:'dashboard', href:'dashboard.html', icon:'&#8962;' },
      { key:'houses',    href:'houses.html',    icon:'&#127968;' },
      { key:'tenants',   href:'tenants.html',   icon:'&#128100;' },
      { key:'rent',      href:'rent.html',       icon:'&#128202;' },
    ]
    var nav = items.map(function(item) {
      var a = item.key === active
      var cls = a
        ? 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-indigo-50 text-indigo-700'
        : 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition'
      return '<a href="' + item.href + '" class="' + cls + '"><span>' + item.icon + '</span>' + t(item.key) + '</a>'
    }).join('')
    return '<div class="flex items-center gap-3 px-4 py-5 border-b border-gray-100">' +
        '<div class="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">R</div>' +
        '<span class="font-bold text-gray-900 text-sm">' + t('app_name') + '</span>' +
      '</div>' +
      '<nav class="flex-1 px-3 py-4 space-y-0.5">' + nav + '</nav>' +
      '<div class="px-4 py-4 border-t border-gray-100">' +
        '<p class="text-xs text-gray-400 truncate mb-2">' + (name || '') + '</p>' +
        '<div class="flex gap-2">' +
          '<button onclick="window.__langToggle()" class="text-xs px-2.5 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 font-medium">' + other + '</button>' +
          '<button onclick="window.__logout()" class="text-xs px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg font-medium">' + t('logout') + '</button>' +
        '</div>' +
      '</div>'
  }

  function tenantTopNav(active, name) {
    var other = getLang() === 'en' ? 'DE' : 'EN'
    var items = [
      { key:'dashboard',    href:'dashboard.html' },
      { key:'rent_history', href:'rent-history.html' },
    ]
    var links = items.map(function(item) {
      var a = item.key === active
      var cls = a ? 'px-3 py-2 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700'
                  : 'px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition'
      return '<a href="' + item.href + '" class="' + cls + '">' + t(item.key) + '</a>'
    }).join('')
    return '<div class="flex items-center gap-2">' +
        '<div class="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">R</div>' +
        '<span class="font-bold text-gray-900 text-sm">' + t('app_name') + '</span>' +
      '</div>' +
      '<div class="flex items-center gap-1">' + links + '</div>' +
      '<div class="flex items-center gap-2">' +
        '<span class="text-xs text-gray-400 hidden sm:inline">' + (name || '') + '</span>' +
        '<button onclick="window.__langToggle()" class="text-xs px-2.5 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 font-medium">' + other + '</button>' +
        '<button onclick="window.__logout()" class="text-xs px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg font-medium">' + t('logout') + '</button>' +
      '</div>'
  }

  // ── Error display ──────────────────────────────────────────────────────────
  function showPageError(msg) {
    var el = document.getElementById('content')
    if (!el) return
    el.innerHTML =
      '<div class="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800">' +
        '<p class="font-semibold mb-2">Error</p>' +
        '<p class="text-sm font-mono whitespace-pre-wrap">' + String(msg) + '</p>' +
      '</div>'
  }

  // ── Page setup ─────────────────────────────────────────────────────────────
  async function setupOwnerPage(active) {
    var user
    try { user = await requireAuth('owner') } catch(e) { showPageError(e); return null }
    if (!user) return null
    document.getElementById('sidebar').innerHTML = ownerSidebar(active, user.name)
    window.__langToggle = function() { setLang(getLang() === 'en' ? 'de' : 'en') }
    window.__logout = async function() { await db.auth.signOut(); window.location.href = '../index.html' }
    return user
  }

  async function setupTenantPage(active) {
    var user
    try { user = await requireAuth('tenant') } catch(e) { showPageError(e); return null }
    if (!user) return null
    document.getElementById('topnav').innerHTML = tenantTopNav(active, user.name)
    window.__langToggle = function() { setLang(getLang() === 'en' ? 'de' : 'en') }
    window.__logout = async function() { await db.auth.signOut(); window.location.href = '../index.html' }
    return user
  }

  // ── Rent record generator ──────────────────────────────────────────────────
  async function generateRentRecords(leaseId, startDate, endDate, monthlyRent, dueDay) {
    var records = []
    var end = new Date(endDate)
    var current = new Date(startDate)
    current = new Date(current.getFullYear(), current.getMonth(), dueDay)
    if (current < new Date(startDate)) {
      current = new Date(current.getFullYear(), current.getMonth() + 1, dueDay)
    }
    while (current <= end) {
      records.push({ lease_id:leaseId, due_date:current.toISOString().split('T')[0],
        amount_due:parseFloat(monthlyRent), amount_paid:0, status:'pending' })
      current = new Date(current.getFullYear(), current.getMonth() + 1, dueDay)
    }
    if (records.length) {
      var res = await db.from('rent_records').insert(records)
      if (res.error) throw res.error
    }
    return records.length
  }

  // ── Expose global RM ───────────────────────────────────────────────────────
  window.RM = {
    db: db,
    t: t, getLang: getLang, setLang: setLang,
    formatCurrency: formatCurrency, formatDate: formatDate, formatMonthYear: formatMonthYear,
    badge: badge, toast: toast, openModal: openModal, closeModal: closeModal,
    inp: inp, lbl: lbl, btnP: btnP, btnS: btnS, btnD: btnD,
    ownerSidebar: ownerSidebar, tenantTopNav: tenantTopNav,
    setupOwnerPage: setupOwnerPage, setupTenantPage: setupTenantPage,
    showPageError: showPageError, generateRentRecords: generateRentRecords,
    SUPABASE_URL: SUPABASE_URL,
  }
})()
