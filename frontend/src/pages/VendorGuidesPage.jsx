import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createVendorGuide, fetchVendorGuides, updateVendorGuide } from '../api/client'

export default function VendorGuidesPage() {
  const [guides, setGuides] = useState([])
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    specialty: '',
    daily_rate: 4000,
    languages: ['Urdu', 'English'],
  })

  const load = useCallback(async () => {
    try {
      setGuides(await fetchVendorGuides())
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    try {
      await createVendorGuide(form)
      setForm({ name: '', specialty: '', daily_rate: 4000, languages: ['Urdu', 'English'] })
      setShowForm(false)
      setMsg('Guide profile added.')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleUpdate(guide) {
    setError('')
    try {
      await updateVendorGuide(guide.id, {
        name: guide.name,
        specialty: guide.specialty,
        daily_rate: Number(guide.daily_rate),
        languages: guide.languages,
      })
      setMsg('Guide updated.')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="container vendor-page">
      <Link to="/vendor/profile" className="back-link">← Profile</Link>
      <h1>Guide services</h1>
      <p className="plan-lead">Manage your guide profiles, specialties, and daily rates.</p>
      {error && <p className="form-error">{error}</p>}
      {msg && <p className="toast-info">{msg}</p>}

      <section className="vendor-panel">
        <div className="panel-head-row">
          <h2>Your guides</h2>
          <button type="button" className="btn-primary btn-enabled" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add guide'}
          </button>
        </div>

        {showForm && (
          <form className="vendor-inline-form" onSubmit={handleCreate}>
            <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label>Specialty<input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} required /></label>
            <label>Daily rate (PKR)<input type="number" min={1000} value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: Number(e.target.value) })} /></label>
            <button type="submit" className="btn-secondary">Save guide</button>
          </form>
        )}

        {guides.length === 0 && !showForm && (
          <p className="meta">No guides yet. Add your first guide profile to appear in tourist search.</p>
        )}

        <div className="guide-admin-list">
          {guides.map((g) => (
            <article key={g.id} className="guide-admin-card">
              <label>
                Name
                <input value={g.name} onChange={(e) => setGuides((list) => list.map((x) => x.id === g.id ? { ...x, name: e.target.value } : x))} />
              </label>
              <label>
                Specialty
                <input value={g.specialty} onChange={(e) => setGuides((list) => list.map((x) => x.id === g.id ? { ...x, specialty: e.target.value } : x))} />
              </label>
              <label>
                Daily rate (PKR)
                <input type="number" min={1000} value={g.daily_rate} onChange={(e) => setGuides((list) => list.map((x) => x.id === g.id ? { ...x, daily_rate: e.target.value } : x))} />
              </label>
              <button type="button" className="btn-secondary" onClick={() => handleUpdate(guides.find((x) => x.id === g.id))}>
                Update
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
