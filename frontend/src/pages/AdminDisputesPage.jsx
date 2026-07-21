import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminDisputes, resolveAdminDispute } from '../api/client'

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState([])
  const [filter, setFilter] = useState('open')
  const [msg, setMsg] = useState('')

  function load() {
    fetchAdminDisputes(filter || undefined).then(setDisputes).catch(() => {})
  }

  useEffect(() => {
    load()
  }, [filter])

  async function resolve(id, action) {
    await resolveAdminDispute(id, action)
    setMsg(`Dispute ${action}d`)
    load()
  }

  return (
    <div className="container admin-page">
      <Link to="/admin" className="back-link">← Overview</Link>
      <h1>Dispute center</h1>
      <p className="plan-lead">Open disputes hold escrow until resolved. Release to pay vendor or dismiss.</p>
      {msg && <p className="toast-info">{msg}</p>}

      <div className="filter-row">
        {['open', 'resolved', 'dismissed', ''].map((s) => (
          <button key={s || 'all'} type="button" className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="vendor-admin-list">
        {disputes.map((d) => (
          <div key={d.id} className="kyc-review-card">
            <div>
              <strong>{d.booking_reference}</strong> · filed by {d.filed_by}
              <p>{d.reason}</p>
              <span className={`status-pill status-${d.status === 'open' ? 'pending' : 'approved'}`}>{d.status}</span>
            </div>
            {d.status === 'open' && (
              <div className="card-actions">
                <button type="button" onClick={() => resolve(d.id, 'release')}>Release escrow</button>
                <button type="button" className="danger" onClick={() => resolve(d.id, 'dismiss')}>Dismiss</button>
              </div>
            )}
          </div>
        ))}
        {disputes.length === 0 && <p className="plan-lead">No disputes in this filter.</p>}
      </div>
    </div>
  )
}
