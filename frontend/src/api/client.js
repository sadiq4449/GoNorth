import { isSupabaseConfigured, uploadVendorAsset } from '../lib/supabase.js'

const API_BASE = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'baltitour_token'
const USER_KEY = 'baltitour_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = data.detail
    const msg = Array.isArray(detail)
      ? detail.map((d) => d.msg).join(', ')
      : detail || `Request failed (${res.status})`
    throw new Error(msg)
  }
  return data
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error('Health check failed')
  return res.json()
}

export async function fetchRecommendation({ destination, nights, budget, vibe }) {
  return apiFetch('/api/recommend', {
    method: 'POST',
    body: JSON.stringify({ destination, nights, budget, vibe }),
  })
}

export async function fetchSearch({ destination, nights, guests, budget, vibe, stops, soloSafe, womenFriendly, featuredOnly }) {
  const params = new URLSearchParams({
    destination,
    nights: String(nights),
    guests: String(guests),
  })
  if (budget) params.set('budget', String(budget))
  if (vibe) params.set('vibe', vibe)
  if (stops?.length) params.set('stops', stops.join(','))
  if (soloSafe) params.set('solo_safe', 'true')
  if (womenFriendly) params.set('women_friendly', 'true')
  if (featuredOnly) params.set('featured_only', 'true')
  return apiFetch(`/api/search?${params}`)
}

export async function fetchCartQuote(payload) {
  return apiFetch('/api/cart/quote', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function createBooking(payload) {
  return apiFetch('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchBooking(reference) {
  return apiFetch(`/api/bookings/${encodeURIComponent(reference)}`)
}

export async function fetchCompletionToken(reference) {
  return apiFetch(`/api/bookings/${encodeURIComponent(reference)}/completion-token`)
}

export async function completeTripScan(payload) {
  return apiFetch('/api/vendor/trips/complete', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchVendorKyc() {
  return apiFetch('/api/vendor/kyc')
}

export async function saveVendorKyc(payload) {
  return apiFetch('/api/vendor/kyc', { method: 'PUT', body: JSON.stringify(payload) })
}

export async function submitVendorKyc() {
  return apiFetch('/api/vendor/kyc/submit', { method: 'POST' })
}

export async function startPennyTest() {
  return apiFetch('/api/vendor/kyc/penny-test', { method: 'POST' })
}

export async function verifyPennyTest(code) {
  return apiFetch('/api/vendor/kyc/penny-verify', { method: 'POST', body: JSON.stringify({ code }) })
}

export async function fetchVendorWallet() {
  return apiFetch('/api/vendor/wallet')
}

export async function fetchAdminKyc(status = 'submitted') {
  return apiFetch(`/api/admin/kyc?status=${encodeURIComponent(status)}`)
}

export async function reviewAdminKyc(kycId, payload) {
  return apiFetch(`/api/admin/kyc/${kycId}/review`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchAdminEscrow(status) {
  const q = status ? `?status=${encodeURIComponent(status)}` : ''
  return apiFetch(`/api/admin/escrow${q}`)
}

export async function processDueEscrow() {
  return apiFetch('/api/admin/escrow/process-due', { method: 'POST' })
}

export async function disputeEscrow(escrowId, reason = 'Admin dispute') {
  return apiFetch(`/api/admin/escrow/${escrowId}/dispute?reason=${encodeURIComponent(reason)}`, { method: 'POST' })
}

export async function resolveEscrow(escrowId, action) {
  return apiFetch(`/api/admin/escrow/${escrowId}/resolve?action=${action}`, { method: 'POST' })
}

export async function forceEscrowPayout(escrowId) {
  return apiFetch(`/api/admin/escrow/${escrowId}/force-payout`, { method: 'POST' })
}

export async function fetchAdvisories(region) {
  const q = region ? `?region=${encodeURIComponent(region)}` : ''
  return apiFetch(`/api/advisories${q}`)
}

export async function fetchAdminAdvisories() {
  return apiFetch('/api/admin/advisories')
}

export async function upsertAdminAdvisory(payload) {
  return apiFetch('/api/admin/advisories', { method: 'PUT', body: JSON.stringify(payload) })
}

export async function fetchChatMessages(reference) {
  return apiFetch(`/api/bookings/${encodeURIComponent(reference)}/chat`)
}

export async function postChatMessage(reference, payload) {
  return apiFetch(`/api/bookings/${encodeURIComponent(reference)}/chat`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchActivePools(memberIds = []) {
  const params = memberIds.length ? `?member_ids=${memberIds.join(',')}` : ''
  return apiFetch(`/api/pools/active${params}`)
}

export async function joinPool(poolId, payload) {
  return apiFetch(`/api/pools/${poolId}/join`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function leavePool(poolId, memberId) {
  return apiFetch(`/api/pools/${poolId}/leave?member_id=${encodeURIComponent(memberId)}`, {
    method: 'POST',
  })
}

export async function login(email, password) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function registerVendor(payload) {
  return apiFetch('/api/auth/register/vendor', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchMe() {
  return apiFetch('/api/auth/me')
}

export async function fetchListings(valley) {
  const q = valley ? `?valley=${encodeURIComponent(valley)}` : ''
  return apiFetch(`/api/listings${q}`)
}

export async function fetchVendorMe() {
  return apiFetch('/api/vendors/me')
}

export async function fetchVendorDashboard() {
  return apiFetch('/api/vendor/dashboard')
}

export async function fetchVendorRooms() {
  return apiFetch('/api/vendor/rooms')
}

export async function createVendorRoom(payload) {
  return apiFetch('/api/vendor/rooms', { method: 'POST', body: JSON.stringify(payload) })
}

export async function updateVendorRoom(roomId, payload) {
  return apiFetch(`/api/vendor/rooms/${roomId}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function fetchRoomCalendar(roomId, start, days = 14) {
  const params = new URLSearchParams({ start, days: String(days) })
  return apiFetch(`/api/vendor/rooms/${roomId}/calendar?${params}`)
}

export async function toggleRoomBlock(roomId, payload) {
  return apiFetch(`/api/vendor/rooms/${roomId}/calendar/toggle`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchSeasonPricing() {
  return apiFetch('/api/vendor/season-pricing')
}

export async function updateSeasonPricing(rules) {
  return apiFetch('/api/vendor/season-pricing', {
    method: 'PUT',
    body: JSON.stringify({ rules }),
  })
}

export async function fetchVendorVehicles() {
  return apiFetch('/api/vendor/vehicles')
}

export async function createVendorVehicle(payload) {
  return apiFetch('/api/vendor/vehicles', { method: 'POST', body: JSON.stringify(payload) })
}

export async function updateVendorVehicle(vehicleId, payload) {
  return apiFetch(`/api/vendor/vehicles/${vehicleId}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function fetchVendorTariffs() {
  return apiFetch('/api/vendor/tariffs')
}

export async function createVendorTariff(payload) {
  return apiFetch('/api/vendor/tariffs', { method: 'POST', body: JSON.stringify(payload) })
}

export async function updateVendorTariff(tariffId, payload) {
  return apiFetch(`/api/vendor/tariffs/${tariffId}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function fetchFleetDrivers() {
  return apiFetch('/api/vendor/drivers')
}

export async function createFleetDriver(payload) {
  return apiFetch('/api/vendor/drivers', { method: 'POST', body: JSON.stringify(payload) })
}

export async function uploadVendorImage(file) {
  if (isSupabaseConfigured()) {
    const url = await uploadVendorAsset(file, 'vendor')
    return { url }
  }
  const form = new FormData()
  form.append('file', file)
  const token = getToken()
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE}/api/vendor/uploads`, { method: 'POST', headers, body: form })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || 'Upload failed')
  return data
}

export async function fetchAllVendors(status) {
  const q = status ? `?status=${status}` : ''
  return apiFetch(`/api/vendors${q}`)
}

export async function updateVendorStatus(vendorId, status) {
  return apiFetch(`/api/vendors/${vendorId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function fetchPointsBalance(email, subtotal = 0) {
  const params = new URLSearchParams({ email, subtotal: String(subtotal) })
  return apiFetch(`/api/points/balance?${params}`)
}

export async function fetchAdminPricing() {
  return apiFetch('/api/admin/pricing')
}

export async function upsertAdminPricing(payload) {
  return apiFetch('/api/admin/pricing', { method: 'PUT', body: JSON.stringify(payload) })
}

export async function fetchAdminBookings(q) {
  const params = q ? `?q=${encodeURIComponent(q)}` : ''
  return apiFetch(`/api/admin/bookings${params}`)
}

export async function updateAdminBooking(reference, payload) {
  return apiFetch(`/api/admin/bookings/${encodeURIComponent(reference)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function fetchAdminAuditLog() {
  return apiFetch('/api/admin/audit-log')
}

export async function fetchAdminDisputes(status) {
  const q = status ? `?status=${encodeURIComponent(status)}` : ''
  return apiFetch(`/api/admin/disputes${q}`)
}

export async function resolveAdminDispute(ticketId, action) {
  return apiFetch(`/api/admin/disputes/${encodeURIComponent(ticketId)}/resolve?action=${action}`, {
    method: 'POST',
  })
}

export async function fileBookingDispute(reference, payload) {
  return apiFetch(`/api/bookings/${encodeURIComponent(reference)}/dispute`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function initPayment(payload) {
  return apiFetch('/api/payments/init', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchPaymentDetail(sessionId) {
  return apiFetch(`/api/payments/sessions/${encodeURIComponent(sessionId)}/detail`)
}

export async function fetchPaymentStatus(sessionId) {
  return apiFetch(`/api/payments/sessions/${encodeURIComponent(sessionId)}`)
}

export async function completeSandboxPayment(sessionId) {
  return apiFetch(`/api/payments/sandbox/complete/${encodeURIComponent(sessionId)}`, { method: 'POST' })
}

export async function fetchAdminPayouts() {
  return apiFetch('/api/admin/payouts')
}

export async function runAdminPayouts() {
  return apiFetch('/api/admin/payouts/run', { method: 'POST' })
}

export async function fetchReviews() {
  return apiFetch('/api/community/reviews')
}

export async function postReview(payload) {
  return apiFetch('/api/community/reviews', { method: 'POST', body: JSON.stringify(payload) })
}

export async function fetchForum(valley) {
  const q = valley ? `?valley=${encodeURIComponent(valley)}` : ''
  return apiFetch(`/api/community/forum${q}`)
}

export async function postForum(payload) {
  return apiFetch('/api/community/forum', { method: 'POST', body: JSON.stringify(payload) })
}

export async function cartAbandon(payload) {
  return apiFetch('/api/community/cart/abandon', { method: 'POST', body: JSON.stringify(payload) })
}

export async function smsVendorRegister(payload) {
  return apiFetch('/api/community/vendor/sms-register', { method: 'POST', body: JSON.stringify(payload) })
}

export async function fetchAdminSmsLeads() {
  return apiFetch('/api/community/admin/sms-leads')
}

export async function fetchAdminFleet() {
  return apiFetch('/api/admin/fleet/active')
}

export async function adminCreateVendor(payload) {
  return apiFetch('/api/admin/vendors/create', { method: 'POST', body: JSON.stringify(payload) })
}

export async function adminPhysicalVet(vendorId, vetted = true) {
  return apiFetch(`/api/admin/vendors/${vendorId}/physical-vet?vetted=${vetted}`, { method: 'PATCH' })
}

export async function fetchAdminRegistry() {
  return apiFetch('/api/admin/registry')
}

export async function adminHideRoom(roomId) {
  return apiFetch(`/api/admin/rooms/${roomId}`, { method: 'DELETE' })
}

export async function adminHideVehicle(vehicleId) {
  return apiFetch(`/api/admin/vehicles/${vehicleId}`, { method: 'DELETE' })
}

export async function fetchVendorPendingTrips() {
  return apiFetch('/api/vendor/trips/pending')
}

export async function vendorBoost(days = 14) {
  return apiFetch('/api/vendor/boost', { method: 'POST', body: JSON.stringify({ days }) })
}
