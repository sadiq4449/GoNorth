import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminBookings, updateAdminBooking, fetchAdminAuditLog } from '../api/client'

export default function AdminTripsPage() {
  const [bookings, setBookings] = useState([])
  const [audit, setAudit] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [edit, setEdit] = useState({ destination: '', nights: 5, guests: 2, status: 'confirmed', traveler_name: '' })
  const [msg, setMsg] = useState('')

  function load(q = search) {
    fetchAdminBookings(q).then(setBookings).catch(() => {})
    fetchAdminAuditLog().then(setAudit).catch(() => {})
  }

  useEffect(() => {
    load()
  }, [])

  function selectBooking(b) {
    setSelected(b.reference)
    setEdit({
      destination: b.destination,
      nights: b.nights,
      guests: b.guests,
      status: b.status,
      traveler_name: b.traveler_name,
    })
  }

  async function saveEdit(e) {
    e.preventDefault()
    await updateAdminBooking(selected, edit)
    setMsg('Booking updated — logged to audit trail')
    load()
  }

  return (
    <div className="container admin-page">
      <Link to="/admin" className="back-link">← Overview</Link>
      <h1>Trip editor & audit log</h1>
      {msg && <p className="toast-info">{msg}</p>}

      <div className="panel-head-row">
        <input
          placeholder="Search booking ref…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
        />
        <button type="button" className="btn-secondary" onClick={() => load()}>Search</button>
      </div>

      <div className="admin-split">
        <section className="vendor-panel">
          <h2>Bookings</h2>
          <ul className="booking-picker">
            {bookings.map((b) => (
              <li key={b.reference}>
                <button type="button" className={selected === b.reference ? 'active' : ''} onClick={() => selectBooking(b)}>
                  <strong>{b.reference}</strong> · {b.destination} · {b.traveler_name}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="vendor-panel">
          <h2>Edit trip</h2>
          {selected ? (
            <form className="vendor-form" onSubmit={saveEdit}>
              <label>Traveler<input value={edit.traveler_name} onChange={(e) => setEdit({ ...edit, traveler_name: e.target.value })} /></label>
              <label>Destination<input value={edit.destination} onChange={(e) => setEdit({ ...edit, destination: e.target.value })} /></label>
              <label>Nights<input type="number" min={1} value={edit.nights} onChange={(e) => setEdit({ ...edit, nights: Number(e.target.value) })} /></label>
              <label>Guests<input type="number" min={1} value={edit.guests} onChange={(e) => setEdit({ ...edit, guests: Number(e.target.value) })} /></label>
              <label>Status
                <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                  <option value="confirmed">confirmed</option>
                  <option value="cancelled">cancelled</option>
                  <option value="completed">completed</option>
                </select>
              </label>
              <button type="submit" className="btn-primary btn-enabled">Save changes</button>
            </form>
          ) : (
            <p className="plan-lead">Select a booking to edit.</p>
          )}
        </section>
      </div>

      <section className="vendor-panel">
        <h2>Audit log</h2>
        <ul className="audit-log">
          {audit.map((a) => (
            <li key={a.id}>
              <strong>{a.action}</strong> · {a.entity_type}/{a.entity_id}
              <span>{new Date(a.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
