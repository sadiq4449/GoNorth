import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminPackages, updateAdminPackage } from '../api/client'
import { loadAdminData, runAdminMutation } from '../lib/adminPage'

export default function AdminApprovalsPage() {
  const [packages, setPackages] = useState([])
  const [filter, setFilter] = useState('all')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  function load() {
    loadAdminData(fetchAdminPackages, setPackages, setError)
  }

  useEffect(() => {
    load()
  }, [])

  async function toggle(pkg, field, value) {
    await runAdminMutation({
      action: () => updateAdminPackage(pkg.id, { [field]: value }),
      setError,
      setMsg,
      successMsg: `${pkg.title}: ${field} ${value ? 'enabled' : 'disabled'}`,
      onSuccess: load,
    })
  }

  const visible = packages.filter((p) => {
    if (filter === 'inactive') return !p.active
    if (filter === 'featured') return p.featured
    return true
  })

  return (
    <div className="container admin-page">
      <Link to="/admin" className="back-link">← Overview</Link>
      <h1>Package & listing approvals</h1>
      <p className="admin-lead">
        Approve tour packages for the marketplace. Hotels, transport, and guides inherit vendor approval from Vendors & KYC.
      </p>
      {msg && <p className="toast-info">{msg}</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="filter-row">
        <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All packages</button>
        <button type="button" className={filter === 'inactive' ? 'active' : ''} onClick={() => setFilter('inactive')}>Inactive</button>
        <button type="button" className={filter === 'featured' ? 'active' : ''} onClick={() => setFilter('featured')}>Featured</button>
      </div>

      <div className="vendor-admin-list">
        {visible.map((pkg) => (
          <div key={pkg.id} className="vendor-admin-card">
            <div>
              <strong>{pkg.title}</strong>
              <span className="meta">{pkg.vendor_name} · {pkg.destination}</span>
              <span className="meta">PKR {pkg.starting_price.toLocaleString()} · {pkg.bookable ? 'Bookable' : 'Needs inventory'}</span>
              <div className="storefront-badge-row">
                {pkg.active ? <span className="listing-badge">Live</span> : <span className="listing-badge">Hidden</span>}
                {pkg.featured && <span className="listing-badge featured">Featured</span>}
              </div>
            </div>
            <div className="card-actions">
              {pkg.active ? (
                <button type="button" className="danger" onClick={() => toggle(pkg, 'active', false)}>Unpublish</button>
              ) : (
                <button type="button" onClick={() => toggle(pkg, 'active', true)}>Publish</button>
              )}
              {pkg.featured ? (
                <button type="button" onClick={() => toggle(pkg, 'featured', false)}>Remove featured</button>
              ) : (
                <button type="button" onClick={() => toggle(pkg, 'featured', true)}>Mark featured</button>
              )}
              <Link to={`/packages/${pkg.slug}`} className="btn-secondary-link">View public page</Link>
            </div>
          </div>
        ))}
        {!visible.length && <p className="meta">No packages match this filter.</p>}
      </div>
    </div>
  )
}
