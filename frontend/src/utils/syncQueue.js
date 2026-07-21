const DB_NAME = 'baltitour_offline'
const SYNC_STORE = 'sync_queue'
const DB_VERSION = 2

const PRIORITY = { sos: 1, trip_complete: 2, booking: 3, chat: 4 }

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('active_booking')) {
        db.createObjectStore('active_booking')
      }
      if (!db.objectStoreNames.contains(SYNC_STORE)) {
        const store = db.createObjectStore(SYNC_STORE, { keyPath: 'id', autoIncrement: true })
        store.createIndex('priority', 'priority', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
  })
}

export async function enqueueSync(type, payload) {
  const db = await openDb()
  const item = {
    type,
    priority: PRIORITY[type] || 9,
    payload,
    created_at: Date.now(),
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE, 'readwrite')
    const req = tx.objectStore(SYNC_STORE).add(item)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function listQueue() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE, 'readonly')
    const req = tx.objectStore(SYNC_STORE).getAll()
    req.onsuccess = () => {
      const items = (req.result || []).sort((a, b) => a.priority - b.priority || a.created_at - b.created_at)
      resolve(items)
    }
    req.onerror = () => reject(req.error)
  })
}

async function removeItem(id) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE, 'readwrite')
    tx.objectStore(SYNC_STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

const API_BASE = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'baltitour_token'

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

async function dispatchItem(item) {
  const { type, payload } = item
  if (type === 'sos') {
    const res = await fetch(`${API_BASE}/api/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('SOS sync failed')
    return res.json()
  }
  if (type === 'chat') {
    const res = await fetch(`${API_BASE}/api/bookings/${encodeURIComponent(payload.reference)}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload.message),
    })
    if (!res.ok) throw new Error('Chat sync failed')
    return res.json()
  }
  if (type === 'trip_complete') {
    const token = getToken()
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`${API_BASE}/api/vendor/trips/complete`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Trip completion sync failed')
    return res.json()
  }
  if (type === 'booking') {
    const res = await fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Booking sync failed')
    return res.json()
  }
  throw new Error(`Unknown sync type: ${type}`)
}

export async function flushSyncQueue() {
  if (!navigator.onLine) return { flushed: 0 }
  const items = await listQueue()
  let flushed = 0
  for (const item of items) {
    try {
      await dispatchItem(item)
      await removeItem(item.id)
      flushed += 1
    } catch {
      break
    }
  }
  return { flushed }
}

export function startSyncListener() {
  window.addEventListener('online', () => {
    flushSyncQueue()
  })
}

export async function sendSos(payload) {
  if (navigator.onLine) {
    const res = await fetch(`${API_BASE}/api/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.detail || 'SOS failed')
    return data
  }
  await enqueueSync('sos', payload)
  return { status: 'queued', sms_sent: false, message: 'SOS queued — will send when signal returns' }
}

export async function sendChatMessage(reference, message) {
  if (navigator.onLine) {
    const res = await fetch(`${API_BASE}/api/bookings/${encodeURIComponent(reference)}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.detail || 'Send failed')
    return data
  }
  await enqueueSync('chat', { reference, message })
  return { queued: true, body: message.body, sender_name: message.sender_name }
}
