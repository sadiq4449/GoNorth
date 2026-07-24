import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminBookings, updateAdminBooking, fetchAdminAuditLog } from '../api/client'
import { runAdminMutation } from '../lib/adminPage'

const EMPTY_EDIT = {
  destination: '',
  nights: 5,
  guests: 2,
  status: 'confirmed',
  traveler_name: '',
  phone: '',
  email: '',
  check_in: '',
  room_id: '',
  vehicle_id: '',
}

export default function AdminTripsPage() {
  const [bookings, setBookings] = useState([])
  const [audit, setAudit] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [edit, setEdit] = useState(EMPTY_EDIT)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  function load(q = search) {
    setError('')
    Promise.all([fetchAdminBookings(q), fetchAdminAuditLog()])
      .then(([bookingRows, auditRows]) => {
        setBookings(bookingRows)
        setAudit(auditRows)
        if (selected) {
          const match = bookingRows.find((b) => b.reference === selected)
          if (match) selectBooking(match)
        }
      })
      .catch((e) => setError(e.message || 'Failed to load bookings'))
  }

  useEffect(() => {
    load()
  }, [])

  function selectBooking(b) {
    setSelected(b.reference)
    setSelectedBooking(b)
    setEdit({
      destination: b.destination,
      nights: b.nights,
      guests: b.guests,
      status: b.status,
      traveler_name: b.traveler_name,
      phone: b.phone,
      email: b.email,
      check_in: b.check_in || '',
      room_id: b.room_id || '',
      vehicle_id: b.vehicle_id || '',
    })
  }

  async function saveEdit(e) {
    e.preventDefault()
    const payload = {
      ...edit,
      check_in: edit.check_in || null,
      room_id: edit.room_id || null,
      vehicle_id: edit.vehicle_id || null,
    }
    await runAdminMutation({
      action: () => updateAdminBooking(selected, payload),
      setError,
      setMsg,
      successMsg: 'Booking updated — logged to audit trail',
      onSuccess: () => load(),
    })
  }

  return (
    <div className="container admin-page">
      <Link to="/admin" className="back-link">← Overview</Link>
      <h1>Trip editor & audit log</h1>
      <p className="admin-lead">Resolve trip issues: update traveler contact, stay/transport IDs, dates, and booking status.</p>
      {msg && <p className="toast-info">{msg}</p>}
      {error && <p className="form-error">{error}</p>}

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
                  {b.escrow && <span className="meta"> · escrow: {b.escrow.status}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="vendor-panel">
          <h2>Edit trip</h2>
          {selected && selectedBooking ? (
            <>
              <div className="admin-booking-summary">
                <p><strong>Total:</strong> PKR {selectedBooking.total.toLocaleString()} · Subtotal {selectedBooking.subtotal.toLocaleString()}</p>
                {selectedBooking.driver_name && (
                  <p className="meta">Driver: {selectedBooking.driver_name}{selectedBooking.driver_phone ? ` · ${selectedBooking.driver_phone}` : ''}</p>
                )}
                {selectedBooking.escrow && (
                  <p className="meta">Escrow: {selectedBooking.escrow.status} · vendor share Rs. {selectedBooking.escrow.vendor_share.toLocaleString()}</p>
                )}
                {selectedBooking.line_items?.length > 0 && (
                  <ul className="meta line-items-compact">
                    {selectedBooking.line_items.map((item, i) => (
                      <li key={i}>{item.label} — Rs. {item.total?.toLocaleString?.() ?? item.total}</li>
                    ))}
                  </ul>
                )}
              </div>
              <form className="vendor-form" onSubmit={saveEdit}>
                <label>Traveler<input value={edit.traveler_name} onChange={(e) => setEdit({ ...edit, traveler_name: e.target.value })} /></label>
                <label>Email<input type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></label>
                <label>Phone<input value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></label>
                <label>Destination<input value={edit.destination} onChange={(e) => setEdit({ ...edit, destination: e.target.value })} /></label>
                <label>Check-in<input type="date" value={edit.check_in} onChange={(e) => setEdit({ ...edit, check_in: e.target.value })} /></label>
                <label>Nights<input type="number" min={1} value={edit.nights} onChange={(e) => setEdit({ ...edit, nights: Number(e.target.value) })} /></label>
                <label>Guests<input type="number" min={1} value={edit.guests} onChange={(e) => setEdit({ ...edit, guests: Number(e.target.value) })} /></label>
                <label>Room ID<input value={edit.room_id} onChange={(e) => setEdit({ ...edit, room_id: e.target.value })} placeholder="UUID from registry" /></label>
                <label>Vehicle ID<input value={edit.vehicle_id} onChange={(e) => setEdit({ ...edit, vehicle_id: e.target.value })} placeholder="UUID from registry" /></label>
                <label>Status
                  <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                    <option value="confirmed">confirmed</option>
                    <option value="cancelled">cancelled</option>
                    <option value="completed">completed</option>
                  </select>
                </label>
                <button type="submit" className="btn-primary btn-enabled">Save changes</button>
              </form>
            </>
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
              {Object.keys(a.details || {}).length > 0 && (
                <span className="meta"> · {JSON.stringify(a.details)}</span>
              )}
              <span>{new Date(a.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
