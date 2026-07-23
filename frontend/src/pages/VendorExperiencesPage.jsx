import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createVendorExperience, fetchVendorExperiences, updateVendorExperience } from '../api/client'

export default function VendorExperiencesPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    category: 'restaurant',
    description: '',
    price: 1500,
    pricing_unit: 'per_person',
    valley: 'Skardu',
    features: '',
  })

  const load = useCallback(async () => {
    try {
      setItems(await fetchVendorExperiences())
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
      await createVendorExperience({
        ...form,
        features: form.features.split(',').map((s) => s.trim()).filter(Boolean),
      })
      setShowForm(false)
      setMsg('Listing added.')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleHidden(item) {
    setError('')
    try {
      await updateVendorExperience(item.id, { hidden: !item.hidden })
      setMsg(item.hidden ? 'Listing visible again.' : 'Listing hidden.')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="container vendor-page">
      <Link to="/vendor/profile" className="back-link">← Profile</Link>
      <h1>Restaurants & activities</h1>
      <p className="plan-lead">Manage dining and experience listings travelers can book à la carte.</p>
      {error && <p className="form-error">{error}</p>}
      {msg && <p className="toast-info">{msg}</p>}

      <section className="vendor-panel">
        <div className="panel-head-row">
          <h2>Your listings</h2>
          <button type="button" className="btn-primary btn-enabled" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add listing'}
          </button>
        </div>

        {showForm && (
          <form className="vendor-inline-form vendor-form-grid" onSubmit={handleCreate}>
            <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label>Category
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="restaurant">Restaurant</option>
                <option value="activity">Activity</option>
              </select>
            </label>
            <label>Price (PKR)<input type="number" min={100} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></label>
            <label>Pricing
              <select value={form.pricing_unit} onChange={(e) => setForm({ ...form, pricing_unit: e.target.value })}>
                <option value="per_person">Per person</option>
                <option value="flat">Flat rate</option>
              </select>
            </label>
            <label>Valley<input value={form.valley} onChange={(e) => setForm({ ...form, valley: e.target.value })} /></label>
            <label className="full-width">Description<textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <label className="full-width">Tags (comma-separated)<input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} /></label>
            <button type="submit" className="btn-secondary">Save listing</button>
          </form>
        )}

        <div className="vendor-table-wrap">
          {items.length === 0 && <p>No listings yet.</p>}
          {items.map((item) => (
            <div key={item.id} className="vendor-list-row">
              <div>
                <strong>{item.name}</strong>
                <p>{item.category} · PKR {item.price.toLocaleString()} ({item.pricing_unit.replace('_', ' ')})</p>
                <p className="listing-meta">{item.hidden ? 'Hidden' : 'Live'} · {item.valley}</p>
              </div>
              <button type="button" className="btn-secondary btn-compact" onClick={() => toggleHidden(item)}>
                {item.hidden ? 'Show' : 'Hide'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
