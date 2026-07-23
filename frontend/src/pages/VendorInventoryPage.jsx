import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchVendorDashboard,
  fetchVendorRooms,
  createVendorRoom,
  updateVendorRoom,
  fetchRoomCalendar,
  toggleRoomBlock,
  fetchSeasonPricing,
  updateSeasonPricing,
  uploadVendorImage,
} from '../api/client'

const AMENITIES = ['WiFi', 'Hot Shower', 'Breakfast', 'Mountain View', 'K2 View', 'Garden']
const SEASONS = [
  { id: 'high', label: 'High Season (Apr–May, Jul)' },
  { id: 'mid', label: 'Mid Season (Jun, Aug)' },
  { id: 'low', label: 'Low Season (Oct–Mar)' },
]
const MULTIPLIERS = [
  { value: 1.5, label: '+50% surge' },
  { value: 1.3, label: '+30% surge' },
  { value: 1.0, label: 'Standard rate' },
  { value: 0.8, label: '-20% discount' },
  { value: 0.7, label: '-30% discount' },
]

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function VendorInventoryPage() {
  const [dash, setDash] = useState(null)
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [calendar, setCalendar] = useState(null)
  const [seasonRules, setSeasonRules] = useState([])
  const [seasonForm, setSeasonForm] = useState({ season: 'high', multiplier: 1.3, room_id: '' })
  const [seasonPreview, setSeasonPreview] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    capacity: 2,
    price_per_night: 5000,
    amenities: ['WiFi'],
    images: [],
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [d, r, s] = await Promise.all([
        fetchVendorDashboard(),
        fetchVendorRooms(),
        fetchSeasonPricing(),
      ])
      setDash(d)
      setRooms(r)
      setSeasonRules(s)
      if (r.length) setSelectedRoom((prev) => prev || r[0].id)
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!selectedRoom) return
    fetchRoomCalendar(selectedRoom, todayIso())
      .then(setCalendar)
      .catch((e) => setError(e.message))
  }, [selectedRoom])

  async function handleToggle(date, blocked) {
    await toggleRoomBlock(selectedRoom, { date, blocked: !blocked })
    const cal = await fetchRoomCalendar(selectedRoom, todayIso())
    setCalendar(cal)
  }

  async function handleSaveRoom(e) {
    e.preventDefault()
    try {
      await createVendorRoom(form)
      setShowForm(false)
      setForm({ name: '', capacity: 2, price_per_night: 5000, amenities: ['WiFi'], images: [] })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleHideRoom(room) {
    await updateVendorRoom(room.id, { hidden: !room.hidden })
    await load()
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { url } = await uploadVendorImage(file)
      setForm((f) => ({ ...f, images: [...f.images, url] }))
    } catch (err) {
      setError(err.message)
    }
  }

  async function applySeasonPricing() {
    const rule = {
      season: seasonForm.season,
      multiplier: seasonForm.multiplier,
      room_id: seasonForm.room_id || null,
    }
    const merged = [...seasonRules.filter((r) => r.season !== rule.season || r.room_id !== rule.room_id), rule]
    const preview = await updateSeasonPricing(merged.map((r) => ({
      season: r.season,
      multiplier: r.multiplier,
      room_id: r.room_id,
    })))
    setSeasonPreview(preview)
    setSeasonRules(merged)
  }

  if (dash && dash.vendor_type === 'transport') {
    return (
      <div className="container placeholder-page">
        <Link to="/vendor" className="back-link">← Dashboard</Link>
        <h1>Hotel inventory</h1>
        <p>This account is registered as transport-only. Manage fleet on the Tariffs page.</p>
        <Link to="/vendor/tariffs" className="btn-secondary-link">Go to tariffs →</Link>
      </div>
    )
  }

  if (dash && dash.vendor_type === 'guide') {
    return (
      <div className="container placeholder-page">
        <Link to="/vendor" className="back-link">← Dashboard</Link>
        <h1>Hotel inventory</h1>
        <p>Guide accounts manage services on the Guides page.</p>
        <Link to="/vendor/guides" className="btn-secondary-link">Manage guides →</Link>
      </div>
    )
  }

  return (
    <div className="container vendor-page">
      <Link to="/vendor" className="back-link">← Dashboard</Link>
      <h1>Inventory & calendar</h1>
      <p className="plan-lead">Manage rooms, block walk-in dates, and set seasonal pricing.</p>
      {error && <p className="form-error">{error}</p>}
      {loading && <p>Loading…</p>}

      <section className="vendor-panel">
        <div className="panel-head-row">
          <h2>My rooms</h2>
          <button type="button" className="btn-primary btn-enabled" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add room'}
          </button>
        </div>

        {showForm && (
          <form className="vendor-form" onSubmit={handleSaveRoom}>
            <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label>Capacity<input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></label>
            <label>Price/night<input type="number" min={500} step={500} value={form.price_per_night} onChange={(e) => setForm({ ...form, price_per_night: Number(e.target.value) })} /></label>
            <fieldset>
              <legend>Amenities</legend>
              {AMENITIES.map((a) => (
                <label key={a} className="check-inline">
                  <input
                    type="checkbox"
                    checked={form.amenities.includes(a)}
                    onChange={() => setForm((f) => ({
                      ...f,
                      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
                    }))}
                  />
                  {a}
                </label>
              ))}
            </fieldset>
            <label className="file-label">
              Room photo
              <input type="file" accept="image/*" onChange={handleImageUpload} />
            </label>
            <button type="submit" className="btn-primary btn-enabled">Save room</button>
          </form>
        )}

        <div className="room-admin-grid">
          {rooms.map((room) => (
            <div key={room.id} className={`room-admin-card ${selectedRoom === room.id ? 'selected' : ''}`}>
              <button type="button" className="room-select-btn" onClick={() => setSelectedRoom(room.id)}>
                <strong>{room.name}</strong>
                <span>{room.capacity} beds · {room.amenities.slice(0, 3).join(', ')}</span>
                <span className="room-price">Rs. {room.effective_price?.toLocaleString() || room.price_per_night.toLocaleString()} / night</span>
              </button>
              <button type="button" className="btn-secondary-sm" onClick={() => handleHideRoom(room)}>
                {room.hidden ? 'Show' : 'Hide'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {calendar && (
        <section className="vendor-panel">
          <h2>Room calendar — {calendar.room_name}</h2>
          <p className="plan-lead">Click a date to block or unblock for online bookings.</p>
          <div className="cal-grid">
            <div className="cal-header">Date</div>
            <div className="cal-header">Status</div>
            {calendar.days.map((day) => (
              <div key={day.date} className="cal-row">
                <div className="cal-room-label">{day.date}</div>
                <button
                  type="button"
                  className={`cal-cell ${day.blocked ? 'blocked' : ''}`}
                  onClick={() => handleToggle(day.date, day.blocked)}
                >
                  {day.blocked ? 'Blocked' : 'Open'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="vendor-panel">
        <h2>Seasonal pricing</h2>
        <div className="pricing-control-row">
          <label>
            Season
            <select value={seasonForm.season} onChange={(e) => setSeasonForm({ ...seasonForm, season: e.target.value })}>
              {SEASONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
          <label>
            Multiplier
            <select value={seasonForm.multiplier} onChange={(e) => setSeasonForm({ ...seasonForm, multiplier: Number(e.target.value) })}>
              {MULTIPLIERS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </label>
          <label>
            Room (optional)
            <select value={seasonForm.room_id} onChange={(e) => setSeasonForm({ ...seasonForm, room_id: e.target.value })}>
              <option value="">All rooms</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <button type="button" className="btn-primary btn-enabled" onClick={applySeasonPricing}>Apply pricing</button>
        </div>
        {seasonPreview.length > 0 && (
          <ul className="season-preview">
            {seasonPreview.map((p, i) => (
              <li key={i}>{p.room_name} ({p.season} ×{p.multiplier}): Rs. {p.base_rate.toLocaleString()} → Rs. {p.effective_rate.toLocaleString()}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
