import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createVendorPackage, fetchVendorPackages, updateVendorPackage } from '../api/client'

const VIBES = ['backpacker', 'adventure', 'luxury']

export default function VendorPackagesPage() {
  const [packages, setPackages] = useState([])
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    destination: 'Skardu',
    valley: 'Skardu',
    nights: 5,
    vibe: 'backpacker',
    description: '',
    budget_hint: 65000,
    highlights: '',
    inclusions: '',
    exclusions: '',
  })

  const load = useCallback(async () => {
    try {
      setPackages(await fetchVendorPackages())
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
      await createVendorPackage({
        ...form,
        highlights: form.highlights.split('\n').filter(Boolean),
        inclusions: form.inclusions.split('\n').filter(Boolean),
        exclusions: form.exclusions.split('\n').filter(Boolean),
      })
      setShowForm(false)
      setMsg('Tour package published.')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleActive(pkg) {
    setError('')
    try {
      await updateVendorPackage(pkg.id, { active: !pkg.active })
      setMsg(pkg.active ? 'Package paused.' : 'Package activated.')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="container vendor-page">
      <Link to="/vendor/profile" className="back-link">← Profile</Link>
      <h1>Tour packages</h1>
      <p className="plan-lead">Create and manage bookable tour SKUs for the GoNorth marketplace.</p>
      {error && <p className="form-error">{error}</p>}
      {msg && <p className="toast-info">{msg}</p>}

      <section className="vendor-panel">
        <div className="panel-head-row">
          <h2>Your packages</h2>
          <button type="button" className="btn-primary btn-enabled" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New package'}
          </button>
        </div>

        {showForm && (
          <form className="vendor-inline-form vendor-form-grid" onSubmit={handleCreate}>
            <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
            <label>Destination<input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required /></label>
            <label>Valley<input value={form.valley} onChange={(e) => setForm({ ...form, valley: e.target.value })} /></label>
            <label>Nights<input type="number" min={1} max={30} value={form.nights} onChange={(e) => setForm({ ...form, nights: Number(e.target.value) })} /></label>
            <label>Vibe
              <select value={form.vibe} onChange={(e) => setForm({ ...form, vibe: e.target.value })}>
                {VIBES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <label>Starting budget (PKR)<input type="number" min={5000} value={form.budget_hint} onChange={(e) => setForm({ ...form, budget_hint: Number(e.target.value) })} /></label>
            <label className="full-width">Description<textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <label className="full-width">Highlights (one per line)<textarea rows={3} value={form.highlights} onChange={(e) => setForm({ ...form, highlights: e.target.value })} /></label>
            <label className="full-width">Inclusions<textarea rows={2} value={form.inclusions} onChange={(e) => setForm({ ...form, inclusions: e.target.value })} /></label>
            <label className="full-width">Exclusions<textarea rows={2} value={form.exclusions} onChange={(e) => setForm({ ...form, exclusions: e.target.value })} /></label>
            <button type="submit" className="btn-secondary">Publish package</button>
          </form>
        )}

        <div className="vendor-table-wrap">
          {packages.length === 0 && <p>No packages yet — create your first tour SKU above.</p>}
          {packages.map((pkg) => (
            <div key={pkg.id} className="vendor-list-row">
              <div>
                <strong>{pkg.title}</strong>
                <p>{pkg.destination} · {pkg.nights} nights · PKR {pkg.starting_price?.toLocaleString()}</p>
                <p className="listing-meta">{pkg.bookable ? 'Bookable' : 'Needs inventory link'} · {pkg.active ? 'Active' : 'Paused'}</p>
              </div>
              <div className="row-actions">
                <Link to={`/packages/${pkg.slug}`} className="btn-secondary btn-compact">Preview</Link>
                <button type="button" className="btn-secondary btn-compact" onClick={() => toggleActive(pkg)}>
                  {pkg.active ? 'Pause' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
