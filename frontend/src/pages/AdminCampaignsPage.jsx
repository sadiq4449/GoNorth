import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminCampaigns, upsertAdminCampaign } from '../api/client'

const EMPTY = {
  id: '',
  title: '',
  message: '',
  valley: '',
  discount_label: '',
  cta_url: '/plan',
  cta_label: 'Start Your Adventure',
  season: 'off-season',
  active: true,
  sort_order: 0,
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  function load() {
    fetchAdminCampaigns().then(setCampaigns).catch((e) => setError(e.message))
  }

  useEffect(() => {
    load()
  }, [])

  function edit(c) {
    setForm({
      id: c.id,
      title: c.title,
      message: c.message,
      valley: c.valley || '',
      discount_label: c.discount_label || '',
      cta_url: c.cta_url || '/plan',
      cta_label: c.cta_label || 'Start Your Adventure',
      season: c.season || 'off-season',
      active: c.active,
      sort_order: c.sort_order || 0,
    })
  }

  async function save(e) {
    e.preventDefault()
    setError('')
    setMsg('')
    try {
      await upsertAdminCampaign({
        ...form,
        id: form.id || undefined,
        valley: form.valley || null,
        sort_order: Number(form.sort_order),
      })
      setMsg(form.id ? 'Campaign updated' : 'Campaign created')
      setForm(EMPTY)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="container admin-page">
      <Link to="/admin" className="back-link">← Overview</Link>
      <h1>Promo campaigns</h1>
      <p className="plan-lead">
        Manage off-season and peak promotional banners shown on the homepage and trip builder.
      </p>

      {error && <p className="form-error">{error}</p>}
      {msg && <p className="toast-info">{msg}</p>}

      <form className="vendor-panel" onSubmit={save}>
        <h2>{form.id ? 'Edit campaign' : 'New campaign'}</h2>
        <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required minLength={3} /></label>
        <label>Message<textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required minLength={5} rows={3} /></label>
        <label>Valley (optional — blank = all)<input value={form.valley} onChange={(e) => setForm({ ...form, valley: e.target.value })} placeholder="Skardu" /></label>
        <label>Discount label<input value={form.discount_label} onChange={(e) => setForm({ ...form, discount_label: e.target.value })} placeholder="Up to 20% off" /></label>
        <label>CTA URL<input value={form.cta_url} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} /></label>
        <label>CTA label<input value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} /></label>
        <label>Season
          <select value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}>
            <option value="off-season">Off-season</option>
            <option value="peak">Peak</option>
            <option value="general">General</option>
          </select>
        </label>
        <label>Sort order<input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></label>
        <label className="check-inline">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          Active
        </label>
        <div className="form-actions-row">
          <button type="submit" className="btn-primary">{form.id ? 'Update' : 'Create'} campaign</button>
          {form.id && <button type="button" className="btn-secondary" onClick={() => setForm(EMPTY)}>Cancel edit</button>}
        </div>
      </form>

      <table className="registry-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Valley</th>
            <th>Discount</th>
            <th>Season</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id}>
              <td>{c.title}</td>
              <td>{c.valley || 'All'}</td>
              <td>{c.discount_label || '—'}</td>
              <td>{c.season}</td>
              <td>{c.active ? 'Active' : 'Inactive'}</td>
              <td><button type="button" className="btn-link-sm" onClick={() => edit(c)}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
