import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  adminCreateVendor,
  adminHideRoom,
  adminHideVehicle,
  adminRestoreRoom,
  adminRestoreVehicle,
  fetchAdminRegistry,
} from '../api/client'
import { loadAdminData, runAdminMutation } from '../lib/adminPage'

export default function AdminRegistryPage() {
  const [rows, setRows] = useState([])
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    business_name: '',
    vendor_type: 'hotel',
    valley: 'Skardu',
  })

  function load() {
    loadAdminData(fetchAdminRegistry, setRows, setError)
  }

  useEffect(() => {
    load()
  }, [])

  async function hideAsset(row) {
    if (!window.confirm(`Hide ${row.label} from tourist search?`)) return
    await runAdminMutation({
      action: () => (row.type === 'room' ? adminHideRoom(row.id) : adminHideVehicle(row.id)),
      setError,
      setMsg,
      successMsg: `${row.label} hidden from tourist search`,
      onSuccess: load,
    })
  }

  async function restoreAsset(row) {
    await runAdminMutation({
      action: () => (row.type === 'room' ? adminRestoreRoom(row.id) : adminRestoreVehicle(row.id)),
      setError,
      setMsg,
      successMsg: `${row.label} restored to live listings`,
      onSuccess: load,
    })
  }

  async function createVendor(e) {
    e.preventDefault()
    await runAdminMutation({
      action: () => adminCreateVendor(form),
      setError,
      setMsg,
      successMsg: `Vendor ${form.business_name} created`,
      onSuccess: () => {
        setForm({ ...form, email: '', password: '', full_name: '', business_name: '' })
        load()
      },
    })
  }

  return (
    <div className="container admin-page">
      <Link to="/admin" className="back-link">← Overview</Link>
      <h1>Asset Registry</h1>
      <p className="admin-lead">Create vendor accounts and hide or restore rooms/vehicles from public listings.</p>
      {msg && <p className="toast-info">{msg}</p>}
      {error && <p className="form-error">{error}</p>}

      <form className="vendor-panel" onSubmit={createVendor}>
        <h2>Add vendor</h2>
        <div className="form-grid">
          <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} /></label>
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
                  {r.hidden ? (
                    <button type="button" onClick={() => restoreAsset(r)}>Restore</button>
                  ) : (
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
