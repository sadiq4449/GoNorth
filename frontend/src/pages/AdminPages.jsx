import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  adminPhysicalVet,
  fetchAdminReports,
  fetchAdminSmsLeads,
  fetchAllVendors,
  updateVendorStatus,
} from '../api/client'
import { loadAdminData, runAdminMutation } from '../lib/adminPage'

export function AdminOverviewPage() {
  const [reports, setReports] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAdminData(fetchAdminReports, setReports, setError)
  }, [])

  return (
    <div className="container admin-page">
      <div className="page-toolbar">
        <h1>Super Admin — Platform Overview</h1>
      </div>
      <p className="admin-lead">Control Tower at <code>/admin</code>.</p>
      {error && <p className="form-error">{error}</p>}

      {reports && (
        <div className="admin-kpi-row">
          <div className="admin-kpi"><span className="kpi-label">Vendors</span><span className="kpi-value">{reports.vendors_total}</span></div>
          <div className="admin-kpi"><span className="kpi-label">Pending approval</span><span className="kpi-value">{reports.vendors_pending}</span></div>
          <div className="admin-kpi"><span className="kpi-label">Bookings</span><span className="kpi-value">{reports.bookings_total}</span></div>
          <div className="admin-kpi"><span className="kpi-label">Escrow held</span><span className="kpi-value">{reports.escrow_held}</span></div>
          <div className="admin-kpi"><span className="kpi-label">Open disputes</span><span className="kpi-value">{reports.disputes_open}</span></div>
          <div className="admin-kpi"><span className="kpi-label">Platform revenue</span><span className="kpi-value">PKR {reports.revenue_platform.toLocaleString()}</span></div>
        </div>
      )}

      <div className="admin-links-grid">
        <Link to="/admin/vendors" className="admin-action-link">User & vendor management →</Link>
        <Link to="/admin/approvals" className="admin-action-link">Package approvals →</Link>
        <Link to="/admin/registry" className="admin-action-link">Asset registry →</Link>
        <Link to="/admin/escrow" className="admin-action-link">Escrow, KYC & travel advisories →</Link>
        <Link to="/admin/pricing" className="admin-action-link">Global pricing override →</Link>
        <Link to="/admin/trips" className="admin-action-link">Booking oversight & trip editor →</Link>
        <Link to="/admin/payouts" className="admin-action-link">Payment & payout batches →</Link>
        <Link to="/admin/disputes" className="admin-action-link">Dispute center →</Link>
        <Link to="/admin/fleet" className="admin-action-link">Fleet operations map →</Link>
        <Link to="/admin/campaigns" className="admin-action-link">Content & promo campaigns →</Link>
        <Link to="/admin/settings" className="admin-action-link">Platform & AI settings →</Link>
        <Link to="/admin/security" className="admin-action-link">Security & audit logs →</Link>
      </div>
    </div>
  )
}

export function AdminVendorsPage() {
  const [vendors, setVendors] = useState([])
  const [smsLeads, setSmsLeads] = useState([])
  const [tab, setTab] = useState('vendors')
  const [filter, setFilter] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  function load() {
    setError('')
    Promise.all([
      fetchAllVendors(filter || undefined),
      fetchAdminSmsLeads(),
    ])
      .then(([vendorRows, leadRows]) => {
        setVendors(vendorRows)
        setSmsLeads(leadRows)
      })
      .catch((e) => setError(e.message || 'Failed to load vendors'))
  }

  useEffect(() => { load() }, [filter])

  async function setStatus(id, status) {
    await runAdminMutation({
      action: () => updateVendorStatus(id, status),
      setError,
      setMsg,
      successMsg: `Vendor ${status}`,
      onSuccess: load,
    })
  }

  async function toggleVet(v, vetted) {
    await runAdminMutation({
      action: () => adminPhysicalVet(v.id, vetted),
      setError,
      setMsg,
      successMsg: vetted ? 'Physical vet + gold badge granted' : 'Physical vet removed',
      onSuccess: load,
    })
  }

  return (
    <div className="container admin-page">
      <Link to="/admin" className="back-link">← Overview</Link>
      <h1>Vendors & KYC</h1>
      <div className="filter-row">
        <button type="button" className={tab === 'vendors' ? 'active' : ''} onClick={() => setTab('vendors')}>Vendors</button>
        <button type="button" className={tab === 'sms' ? 'active' : ''} onClick={() => setTab('sms')}>SMS leads</button>
      </div>

      {tab === 'vendors' && (
        <>
          <div className="filter-row">
            <button type="button" className={!filter ? 'active' : ''} onClick={() => setFilter('')}>All</button>
            <button type="button" className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>Pending</button>
            <button type="button" className={filter === 'approved' ? 'active' : ''} onClick={() => setFilter('approved')}>Approved</button>
          </div>
          {msg && <p className="toast-info">{msg}</p>}
          {error && <p className="form-error">{error}</p>}
          <div className="vendor-admin-list">
            {vendors.map((v) => (
              <div key={v.id} className="vendor-admin-card">
                <div>
                  <strong>{v.business_name}</strong>
                  {v.gold_badge && <span className="gold-badge">Gold</span>}
                  {v.featured && <span className="featured-badge">Featured</span>}
                  <span className="meta">{v.vendor_type} · {v.valley}</span>
                  {v.physically_vetted && <span className="meta">Physically vetted</span>}
                </div>
                <span className={`status-pill status-${v.status}`}>{v.status}</span>
                <div className="card-actions">
                  {v.status !== 'approved' && (
                    <button type="button" onClick={() => setStatus(v.id, 'approved')}>Approve</button>
                  )}
                  {!v.physically_vetted ? (
                    <button type="button" onClick={() => toggleVet(v, true)}>Physical vet</button>
                  ) : (
                    <button type="button" onClick={() => toggleVet(v, false)}>Revoke vet</button>
                  )}
                  {v.status !== 'suspended' && (
                    <button type="button" className="danger" onClick={() => setStatus(v.id, 'suspended')}>Suspend</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'sms' && (
        <div className="vendor-admin-list">
          {smsLeads.map((l) => (
            <div key={l.id} className="vendor-admin-card">
              <div>
                <strong>{l.business_name}</strong>
                <span className="meta">{l.phone} · {l.parsed_type}</span>
                <p className="meta">{l.raw_message}</p>
              </div>
              <span className="status-pill">{l.status}</span>
            </div>
          ))}
          {!smsLeads.length && <p>No SMS registration leads yet. Vendors can text REG HOTEL Name to register.</p>}
        </div>
      )}
    </div>
  )
}

export function AdminPlaceholderPage({ title, subtitle }) {
  return (
    <div className="container admin-page">
      <Link to="/admin" className="back-link">← Overview</Link>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  )
}
