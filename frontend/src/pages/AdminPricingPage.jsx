import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminPricing, upsertAdminPricing } from '../api/client'
import { loadAdminData, runAdminMutation } from '../lib/adminPage'

const CATEGORIES = [
  { id: 'all', label: 'All listings' },
  { id: 'room', label: 'Hotels / rooms' },
  { id: 'vehicle', label: 'All vehicles' },
  { id: 'vehicle_4x4', label: '4x4 vehicles only' },
]

const DEFAULT_FORM = {
  label: 'Global surge',
  category: 'vehicle_4x4',
  fixed_rate: '',
  surge_multiplier: 1.0,
  active: true,
}

export default function AdminPricingPage() {
  const [rules, setRules] = useState([])
  const [form, setForm] = useState(DEFAULT_FORM)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  function load() {
    loadAdminData(fetchAdminPricing, setRules, setError)
  }

  useEffect(() => {
    load()
  }, [])

  function editRule(rule) {
    setForm({
      label: rule.label,
      category: rule.category,
      fixed_rate: rule.fixed_rate ?? '',
      surge_multiplier: rule.surge_multiplier,
      active: rule.active,
    })
  }

  async function saveRule(payload, successMsg) {
    await runAdminMutation({
      action: () => upsertAdminPricing({
        label: payload.label,
        category: payload.category,
        fixed_rate: payload.fixed_rate ? Number(payload.fixed_rate) : null,
        surge_multiplier: Number(payload.surge_multiplier),
        active: payload.active,
      }),
      setError,
      setMsg,
      successMsg,
      onSuccess: load,
    })
  }

  async function handleSave(e) {
    e.preventDefault()
    await saveRule(form, form.active ? 'Pricing rule saved' : 'Pricing rule deactivated')
  }

  async function deactivateRule(rule) {
    if (!window.confirm(`Deactivate pricing rule "${rule.label}"?`)) return
    await saveRule({ ...rule, fixed_rate: rule.fixed_rate ?? '', active: false }, 'Pricing rule deactivated')
  }

  return (
    <div className="container admin-page">
      <Link to="/admin" className="back-link">← Overview</Link>
      <h1>Global pricing override</h1>
      <p className="plan-lead">Set fixed rates or surge multipliers across categories (e.g. cap all 4x4 at Rs. 18,000).</p>
      {msg && <p className="toast-info">{msg}</p>}
      {error && <p className="form-error">{error}</p>}

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
            <div>
              <strong>{r.label}</strong> · {r.category}
              {r.fixed_rate && <> · fixed Rs. {r.fixed_rate.toLocaleString()}</>}
              {r.surge_multiplier !== 1 && <> · ×{r.surge_multiplier}</>}
              {!r.active && <span className="pool-pill">Inactive</span>}
            </div>
            <div className="pricing-rule-actions">
              <button type="button" className="btn-link-sm" onClick={() => editRule(r)}>Edit</button>
              {r.active && (
                <button type="button" className="btn-link-sm danger" onClick={() => deactivateRule(r)}>Deactivate</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
