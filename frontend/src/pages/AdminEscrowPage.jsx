import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchAdminEscrow,
  processDueEscrow,
  disputeEscrow,
  resolveEscrow,
  forceEscrowPayout,
  fetchAdminKyc,
  reviewAdminKyc,
  fetchAdminAdvisories,
  upsertAdminAdvisory,
  fetchAdvisories,
} from '../api/client'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function AdminEscrowPage() {
  const [escrows, setEscrows] = useState([])
  const [kycQueue, setKycQueue] = useState([])
  const [filter, setFilter] = useState('')
  const [msg, setMsg] = useState('')
  const [advisories, setAdvisories] = useState([])
  const [liveFeed, setLiveFeed] = useState([])
  const [advForm, setAdvForm] = useState({ region: 'Skardu', message: '', severity: 'info' })

  function load() {
    fetchAdminEscrow(filter || undefined).then(setEscrows).catch(() => {})
    fetchAdminKyc('submitted').then(setKycQueue).catch(() => {})
    fetchAdminAdvisories().then(setAdvisories).catch(() => {})
    fetchAdvisories().then(setLiveFeed).catch(() => {})
  }

  useEffect(() => {
    load()
  }, [filter])

  async function processDue() {
    const res = await processDueEscrow()
    setMsg(`Processed ${res.processed} escrow releases`)
    load()
  }

  async function review(kycId, approved) {
    await reviewAdminKyc(kycId, { approved, notes: approved ? 'Approved' : 'Rejected' })
    setMsg(approved ? 'KYC approved' : 'KYC rejected')
    load()
  }

  async function saveAdvisory(e) {
    e.preventDefault()
    await upsertAdminAdvisory({ ...advForm, active: true, admin_override: true })
    setMsg('Advisory updated')
    load()
  }

  return (
    <div className="container admin-page">
      <Link to="/admin" className="back-link">← Overview</Link>
      <h1>Escrow, KYC & advisories</h1>
      {msg && <p className="toast-info">{msg}</p>}

      <section className="vendor-panel">
        <h2>Road advisories (admin override)</h2>
        <form className="vendor-form inline-grid" onSubmit={saveAdvisory}>
          <label>Region<input value={advForm.region} onChange={(e) => setAdvForm({ ...advForm, region: e.target.value })} required /></label>
          <label>Severity
            <select value={advForm.severity} onChange={(e) => setAdvForm({ ...advForm, severity: e.target.value })}>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <label className="span-2">Message<input value={advForm.message} onChange={(e) => setAdvForm({ ...advForm, message: e.target.value })} required /></label>
          <button type="submit" className="btn-primary btn-enabled">Publish advisory</button>
        </form>
        <ul className="advisory-admin-list">
          {advisories.map((a) => (
            <li key={a.id} className={`severity-${a.severity}`}>
              <strong>{a.region}</strong> — {a.message}
              {a.admin_override && <span className="pool-pill">Verified override</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="vendor-panel">
        <h2>Live advisory feed</h2>
        <p className="plan-lead">Automated weather, NDMA alerts, and seasonal pass rules. Publish an override above to replace a region.</p>
        <ul className="advisory-admin-list live-feed">
          {liveFeed.length === 0 && <li>No live advisories loaded.</li>}
          {liveFeed.map((a) => (
            <li key={a.id} className={`severity-${a.severity}`}>
              <span className="advisory-category">{a.category || 'road'}</span>
              <strong>{a.region}</strong> — {a.message}
              {a.live && <span className="pool-pill">Live</span>}
              {a.verified && <span className="pool-pill">Verified</span>}
              <span className="meta"> · {a.source}</span>
              {a.external_url && (
                <a href={a.external_url} target="_blank" rel="noreferrer" className="advisory-source-link">Source</a>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="vendor-panel">
        <div className="panel-head-row">
          <h2>KYC submissions</h2>
        </div>
        {kycQueue.length === 0 && <p className="plan-lead">No pending KYC submissions.</p>}
        {kycQueue.map((k) => (
          <div key={k.id} className="kyc-review-card">
            <div>
              <strong>{k.cnic_name}</strong> · {k.payout_method} · {k.account_number}
              <p className="meta">
                Title match: {k.title_match_ok ? '✓' : '✗'} · Penny: {k.penny_verified ? '✓' : '✗'}
              </p>
              <div className="kyc-docs">
                {k.cnic_front_url && <a href={`${API_BASE}${k.cnic_front_url}`} target="_blank" rel="noreferrer">CNIC front</a>}
                {k.cnic_back_url && <a href={`${API_BASE}${k.cnic_back_url}`} target="_blank" rel="noreferrer">CNIC back</a>}
                {k.insurance_url && <a href={`${API_BASE}${k.insurance_url}`} target="_blank" rel="noreferrer">Insurance</a>}
              </div>
            </div>
            <div className="card-actions">
              <button type="button" onClick={() => review(k.id, true)}>Approve</button>
              <button type="button" className="danger" onClick={() => review(k.id, false)}>Reject</button>
            </div>
          </div>
        ))}
      </section>

      <section className="vendor-panel">
        <div className="panel-head-row">
          <h2>Escrow ledger</h2>
          <button type="button" className="btn-secondary" onClick={processDue}>Process due releases</button>
        </div>
        <div className="filter-row">
          {['', 'held', 'release_scheduled', 'paid', 'disputed'].map((s) => (
            <button key={s || 'all'} type="button" className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>
              {s || 'All'}
            </button>
          ))}
        </div>
        <table className="tariff-table">
          <thead>
            <tr>
              <th>Booking</th>
              <th>Traveler</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Release</th>
              <th>Flags</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {escrows.map((e) => (
              <tr key={e.id}>
                <td>{e.booking_reference}<br /><small>{e.destination}</small></td>
                <td>{e.traveler_name}</td>
                <td>Rs. {e.amount.toLocaleString()}<br /><small>Vendor: {e.vendor_share.toLocaleString()}</small></td>
                <td><span className={`status-pill status-${e.status === 'paid' ? 'approved' : 'pending'}`}>{e.status}</span></td>
                <td>{e.release_at ? new Date(e.release_at).toLocaleString() : '—'}</td>
                <td>{e.geofence_flag ? '⚠ Geofence' : '—'}</td>
                <td className="card-actions">
                  {e.status !== 'disputed' && e.status !== 'paid' && (
                    <button type="button" className="danger" onClick={() => disputeEscrow(e.id).then(load)}>Dispute</button>
                  )}
                  {e.status === 'disputed' && (
                    <>
                      <button type="button" onClick={() => resolveEscrow(e.id, 'release').then(load)}>Release</button>
                      <button type="button" onClick={() => resolveEscrow(e.id, 'refund_hold').then(load)}>Hold</button>
                    </>
                  )}
                  {e.status === 'release_scheduled' && (
                    <button type="button" onClick={() => forceEscrowPayout(e.id).then(load)}>Pay now</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
