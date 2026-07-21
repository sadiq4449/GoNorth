import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  adminCreateVendor,
  adminHideRoom,
  adminHideVehicle,
  fetchAdminRegistry,
} from '../api/client'

export default function AdminRegistryPage() {
  const [rows, setRows] = useState([])
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '',
    password: 'vendor123',
    full_name: '',
    business_name: '',
    vendor_type: 'hotel',
    valley: 'Skardu',
  })

  function load() {
    fetchAdminRegistry().then(setRows).catch((e) => setError(e.message))
  }

  useEffect(() => {
    load()
  }, [])

  async function hideAsset(row) {
    try {
      if (row.type === 'room') await adminHideRoom(row.id)
      else await adminHideVehicle(row.id)
      setMsg(`${row.label} hidden from tourist search`)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function createVendor(e) {
    e.preventDefault()
    setError('')
    try {
      await adminCreateVendor(form)
      setMsg(`Vendor ${form.business_name} created`)
      setForm({ ...form, email: '', full_name: '', business_name: '' })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="container admin-page">
      <Link to="/admin" className="back-link">← Overview</Link>
      <h1>Asset Registry</h1>
      <p className="admin-lead">Create vendor accounts and hide rooms/vehicles from public listings.</p>
      {msg && <p className="toast-info">{msg}</p>}
      {error && <p className="form-error">{error}</p>}

      <form className="vendor-panel" onSubmit={createVendor}>
        <h2>Add vendor</h2>
        <div className="form-grid">
          <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label>Password<input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
          <label>Contact name<input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></label>
          <label>Business<input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required /></label>
          <label>
            Type
            <select value={form.vendor_type} onChange={(e) => setForm({ ...form, vendor_type: e.target.value })}>
              <option value="hotel">Hotel</option>
              <option value="transport">Transport</option>
              <option value="guide">Guide</option>
            </select>
          </label>
          <label>Valley<input value={form.valley} onChange={(e) => setForm({ ...form, valley: e.target.value })} /></label>
        </div>
        <button type="submit" className="btn-primary">Create vendor</button>
      </form>

      <div className="registry-table-wrap">
        <table className="registry-table">
          <thead>
            <tr><th>Type</th><th>Label</th><th>Vendor</th><th>Valley</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.type}-${r.id}`} className={r.hidden ? 'hidden-row' : ''}>
                <td>{r.type}</td>
                <td>{r.label}</td>
                <td>{r.vendor_name}</td>
                <td>{r.valley}</td>
                <td>{r.hidden ? 'Hidden' : 'Live'}</td>
                <td>
                  {!r.hidden && (
                    <button type="button" className="danger" onClick={() => hideAsset(r)}>Hide</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
