import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminSettings, updateAdminSettings } from '../api/client'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null)
  const [form, setForm] = useState({
    advisory_live_weather: true,
    advisory_ndma_sync: true,
    advisory_seasonal_rules: true,
    allow_direct_booking: true,
    usd_pkr_rate: 280,
  })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  function load() {
    fetchAdminSettings()
      .then((data) => {
        setSettings(data)
        setForm({
          advisory_live_weather: data.advisory_live_weather,
          advisory_ndma_sync: data.advisory_ndma_sync,
          advisory_seasonal_rules: data.advisory_seasonal_rules,
          allow_direct_booking: data.allow_direct_booking,
          usd_pkr_rate: data.usd_pkr_rate,
        })
      })
      .catch((e) => setError(e.message))
  }

  useEffect(() => {
    load()
  }, [])

  async function save(e) {
    e.preventDefault()
    setMsg('')
    setError('')
    try {
      await updateAdminSettings(form)
      setMsg('Platform settings updated')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!settings) {
    return (
      <div className="container admin-page">
        <Link to="/admin" className="back-link">← Overview</Link>
        <p>{error || 'Loading settings…'}</p>
      </div>
    )
  }

  return (
    <div className="container admin-page">
      <Link to="/admin" className="back-link">← Overview</Link>
      <h1>Platform & AI settings</h1>
      <p className="admin-lead">
        Super Admin uses a single platform operator role. Sub-admin permissions are not enabled in this MVP.
      </p>

      {msg && <p className="toast-info">{msg}</p>}
      {error && <p className="form-error">{error}</p>}

      <section className="vendor-panel">
        <h2>AI trip builder</h2>
        <ul className="admin-settings-list">
          <li><strong>Status:</strong> {settings.ai_configured ? 'Configured (OpenRouter)' : 'Rules fallback only'}</li>
          <li><strong>Model:</strong> {settings.ai_model}</li>
          <li className="meta">Set <code>OPENROUTER_API_KEY</code> in backend environment to enable live AI recommendations.</li>
        </ul>
      </section>

      <form className="vendor-panel" onSubmit={save}>
        <h2>Runtime configuration</h2>
        <label className="check-label">
          <input
            type="checkbox"
            checked={form.advisory_live_weather}
            onChange={(e) => setForm({ ...form, advisory_live_weather: e.target.checked })}
          />
          Live weather advisories (Open-Meteo)
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={form.advisory_ndma_sync}
            onChange={(e) => setForm({ ...form, advisory_ndma_sync: e.target.checked })}
          />
          NDMA disaster alert sync
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={form.advisory_seasonal_rules}
            onChange={(e) => setForm({ ...form, advisory_seasonal_rules: e.target.checked })}
          />
          Seasonal pass rules (Babusar, Deosai closures)
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={form.allow_direct_booking}
            onChange={(e) => setForm({ ...form, allow_direct_booking: e.target.checked })}
          />
          Allow direct tourist checkout
        </label>
        <label>
          USD → PKR rate for Stripe
          <input
            type="number"
            min={1}
            step={0.1}
            value={form.usd_pkr_rate}
            onChange={(e) => setForm({ ...form, usd_pkr_rate: Number(e.target.value) })}
          />
        </label>
        <button type="submit" className="btn-primary btn-enabled">Save settings</button>
      </form>

      <section className="vendor-panel">
        <h2>Integrations</h2>
        <ul className="admin-settings-list">
          <li><strong>SMS gateway:</strong> {settings.sms_configured ? 'Configured' : 'Mock / offline mode'}</li>
          <li><strong>Stripe:</strong> {settings.stripe_configured ? 'Configured' : 'Sandbox only'}</li>
          <li><strong>Destinations content:</strong> Managed in <code>frontend/src/lib/destinations.js</code> (static catalog for MVP).</li>
        </ul>
      </section>
    </div>
  )
}
