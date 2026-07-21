import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  adminPhysicalVet,
  fetchAdminSmsLeads,
  fetchAllVendors,
  updateVendorStatus,
} from '../api/client'
import { useAuth } from '../context/AuthContext'

export function AdminOverviewPage() {
  const { user, logout } = useAuth()
  const [vendors, setVendors] = useState([])

  useEffect(() => {
    fetchAllVendors().then(setVendors).catch(() => {})
  }, [])

  const pending = vendors.filter((v) => v.status === 'pending').length
  const approved = vendors.filter((v) => v.status === 'approved').length

  return (
    <div className="container admin-page">
      <div className="page-toolbar">
        <h1>Platform Overview</h1>
        <button type="button" className="btn-secondary admin-outline" onClick={logout}>Sign out</button>
      </div>
      <p className="admin-lead">Signed in as {user?.email}</p>
      <div className="admin-kpi-row">
        <div className="admin-kpi"><span className="kpi-label">Total vendors</span><span className="kpi-value">{vendors.length}</span></div>
        <div className="admin-kpi"><span className="kpi-label">Approved</span><span className="kpi-value">{approved}</span></div>
        <div className="admin-kpi"><span className="kpi-label">Pending KYC</span><span className="kpi-value">{pending}</span></div>
      </div>
      <Link to="/admin/vendors" className="admin-action-link">Review vendors →</Link>
      <Link to="/admin/registry" className="admin-action-link">Asset registry & create vendor →</Link>
      <Link to="/admin/fleet" className="admin-action-link">Live fleet map →</Link>
      <Link to="/admin/escrow" className="admin-action-link">Escrow & KYC queue →</Link>
      <Link to="/admin/pricing" className="admin-action-link">Global pricing override →</Link>
      <Link to="/admin/trips" className="admin-action-link">Trip editor & audit log →</Link>
      <Link to="/admin/disputes" className="admin-action-link">Dispute center →</Link>
      <Link to="/admin/payouts" className="admin-action-link">Vendor payout batch →</Link>
    </div>
  )
}

export function AdminVendorsPage() {
  const [vendors, setVendors] = useState([])
  const [smsLeads, setSmsLeads] = useState([])
  const [tab, setTab] = useState('vendors')
  const [filter, setFilter] = useState('')
  const [msg, setMsg] = useState('')

  function load() {
    fetchAllVendors(filter || undefined).then(setVendors)
    fetchAdminSmsLeads().then(setSmsLeads).catch(() => {})
  }

  useEffect(() => { load() }, [filter])

  async function setStatus(id, status) {
    try {
      await updateVendorStatus(id, status)
      setMsg(`Vendor ${status}`)
      load()
    } catch (e) {
      setMsg(e.message)
    }
  }

  async function toggleVet(v, vetted) {
    try {
      await adminPhysicalVet(v.id, vetted)
      setMsg(vetted ? 'Physical vet + gold badge granted' : 'Physical vet removed')
      load()
    } catch (e) {
      setMsg(e.message)
    }
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
          {msg && <p className="portal-note">{msg}</p>}
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
