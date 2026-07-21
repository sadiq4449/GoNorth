import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { completeTripScan, fetchVendorPendingTrips } from '../api/client'
import { enqueueSync, flushSyncQueue } from '../utils/syncQueue'

export default function VendorTripsPage() {
  const [trips, setTrips] = useState([])
  const [token, setToken] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [offlineCount, setOfflineCount] = useState(0)

  const load = useCallback(() => {
    fetchVendorPendingTrips().then(setTrips).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    load()
    flushSyncQueue().then((r) => {
      if (r.flushed) {
        setMsg(`Synced ${r.flushed} offline completion(s)`)
        load()
      }
    })
  }, [load])

  async function completeWithToken(tripToken) {
    setError('')
    const payload = { token: tripToken, lat: 35.297, lng: 75.633 }
    try {
      if (navigator.onLine) {
        await completeTripScan(payload)
        setMsg('Trip marked complete — escrow release scheduled')
      } else {
        await enqueueSync('trip_complete', payload)
        setOfflineCount((c) => c + 1)
        setMsg('Completion queued — will sync when back online')
      }
      setToken('')
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="container vendor-page">
      <Link to="/vendor" className="back-link">← Dashboard</Link>
      <h1>Trip completion queue</h1>
      <p className="plan-lead">Scan tourist QR or paste completion token. Works offline with auto-sync.</p>
      {!navigator.onLine && <p className="offline-badge">Offline — completions will queue locally</p>}
      {offlineCount > 0 && <p className="portal-note">{offlineCount} completion(s) queued for sync</p>}
      {msg && <p className="toast-info">{msg}</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="vendor-panel">
        <label>
          Completion token
          <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste token from tourist QR" />
        </label>
        <button type="button" className="btn-primary" disabled={!token} onClick={() => completeWithToken(token)}>
          Mark trip complete
        </button>
      </div>

      <div className="vendor-admin-list">
        {trips.map((t) => (
          <div key={t.reference} className="vendor-admin-card">
            <div>
              <strong>{t.reference}</strong>
              <span className="meta">{t.destination} · {t.traveler_name}</span>
              <span className="meta">Escrow: {t.escrow_status}</span>
            </div>
            <button type="button" onClick={() => completeWithToken(t.completion_token)}>
              Complete
            </button>
          </div>
        ))}
        {!trips.length && <p>No pending trips for your inventory.</p>}
      </div>
    </div>
  )
}
