import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminFleet } from '../api/client'
import { loadAdminData } from '../lib/adminPage'

export default function AdminFleetPage() {
  const [trips, setTrips] = useState([])
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    loadAdminData(fetchAdminFleet, (rows) => {
      setTrips(rows)
      setSelected(rows[0] || null)
    }, setError)
  }, [])

  return (
    <div className="container admin-page">
      <Link to="/admin" className="back-link">← Overview</Link>
      <h1>Fleet Map (Demo)</h1>
      <div className="admin-demo-banner">
        <span aria-hidden>⚠</span>
        <span>
          Demo telemetry only — coordinates are static destination pins, not live GPS.
          Integrate a telematics provider for production fleet tracking.
        </span>
      </div>
      {error && <p className="form-error">{error}</p>}

      <div className="fleet-layout">
        <div className="fleet-map-panel">
          <div className="fleet-map-placeholder">
            {selected ? (
              <>
                <span className="map-pin">📍</span>
                <strong>{selected.destination}</strong>
                <p>{selected.traveler_name} · {selected.driver_name || 'Unassigned'}</p>
                <p className="meta">Lat {selected.lat.toFixed(3)}, Lng {selected.lng.toFixed(3)}</p>
                <p className="meta">Last ping: {selected.last_ping ? new Date(selected.last_ping).toLocaleString() : '—'}</p>
              </>
            ) : (
              <p>No active confirmed trips</p>
            )}
          </div>
        </div>
        <ul className="fleet-trip-list">
          {trips.map((t) => (
            <li key={t.reference}>
              <button
                type="button"
                className={selected?.reference === t.reference ? 'active' : ''}
                onClick={() => setSelected(t)}
              >
                <strong>{t.reference}</strong>
                <span>{t.destination}</span>
                <span className="meta">{t.driver_name || 'Driver TBD'} · {t.traveler_name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
