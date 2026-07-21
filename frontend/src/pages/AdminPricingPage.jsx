import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminPricing, upsertAdminPricing } from '../api/client'

const CATEGORIES = [
  { id: 'all', label: 'All listings' },
  { id: 'room', label: 'Hotels / rooms' },
  { id: 'vehicle', label: 'All vehicles' },
  { id: 'vehicle_4x4', label: '4x4 vehicles only' },
]

export default function AdminPricingPage() {
  const [rules, setRules] = useState([])
  const [form, setForm] = useState({
    label: 'Global surge',
    category: 'vehicle_4x4',
    fixed_rate: '',
    surge_multiplier: 1.0,
    active: true,
  })
  const [msg, setMsg] = useState('')

  function load() {
    fetchAdminPricing().then(setRules).catch(() => {})
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    await upsertAdminPricing({
      label: form.label,
      category: form.category,
      fixed_rate: form.fixed_rate ? Number(form.fixed_rate) : null,
      surge_multiplier: Number(form.surge_multiplier),
      active: form.active,
    })
    setMsg('Pricing rule saved')
    load()
  }

  return (
    <div className="container admin-page">
      <Link to="/admin" className="back-link">← Overview</Link>
      <h1>Global pricing override</h1>
      <p className="plan-lead">Set fixed rates or surge multipliers across categories (e.g. cap all 4x4 at Rs. 18,000).</p>
      {msg && <p className="toast-info">{msg}</p>}

      <form className="vendor-panel vendor-form inline-grid" onSubmit={handleSave}>
        <label>Label<input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required /></label>
        <label>Category
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <label>Fixed rate (PKR, optional)<input type="number" value={form.fixed_rate} onChange={(e) => setForm({ ...form, fixed_rate: e.target.value })} placeholder="e.g. 18000" /></label>
        <label>Surge multiplier<input type="number" step={0.05} min={0.5} max={3} value={form.surge_multiplier} onChange={(e) => setForm({ ...form, surge_multiplier: e.target.value })} /></label>
        <label className="check-inline"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
        <button type="submit" className="btn-primary btn-enabled">Apply override</button>
      </form>

      <ul className="pricing-rules-list">
        {rules.map((r) => (
          <li key={r.id}>
            <strong>{r.label}</strong> · {r.category}
            {r.fixed_rate && <> · fixed Rs. {r.fixed_rate.toLocaleString()}</>}
            {r.surge_multiplier !== 1 && <> · ×{r.surge_multiplier}</>}
            {!r.active && <span className="pool-pill">Inactive</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
