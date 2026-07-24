import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteAdminReview, fetchAdminAuditLog, fetchAdminReviews, fetchAdminSosLog } from '../api/client'
import { loadAdminData, runAdminMutation } from '../lib/adminPage'

export default function AdminSecurityPage() {
  const [sos, setSos] = useState([])
  const [audit, setAudit] = useState([])
  const [reviews, setReviews] = useState([])
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  function loadReviews() {
    loadAdminData(fetchAdminReviews, setReviews, setError)
  }

  useEffect(() => {
    setError('')
    Promise.all([fetchAdminSosLog(), fetchAdminAuditLog(), fetchAdminReviews()])
      .then(([sosRows, auditRows, reviewRows]) => {
        setSos(sosRows)
        setAudit(auditRows)
        setReviews(reviewRows)
      })
      .catch((e) => setError(e.message))
  }, [])

  async function removeReview(review) {
    if (!window.confirm(`Remove review by ${review.author_name}?`)) return
    await runAdminMutation({
      action: () => deleteAdminReview(review.id),
      setError,
      setMsg,
      successMsg: 'Review removed',
      onSuccess: loadReviews,
    })
  }

  return (
    <div className="container admin-page">
      <Link to="/admin" className="back-link">← Overview</Link>
      <h1>Security & activity monitoring</h1>
      <p className="admin-lead">SOS dispatch log, admin audit trail, and trip review moderation.</p>
      {error && <p className="form-error">{error}</p>}
      {msg && <p className="toast-info">{msg}</p>}

      <section className="vendor-panel">
        <h2>SOS alerts</h2>
        {!sos.length && <p className="meta">No SOS alerts recorded yet.</p>}
        <ul className="audit-log">
          {sos.map((row) => (
            <li key={row.id}>
              <strong>{row.status}</strong>
              {row.sms_sent ? ' · SMS dispatched' : ' · SMS pending/mock'}
              <p className="meta">{row.message}</p>
              <span>{new Date(row.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="vendor-panel">
        <h2>Trip review moderation</h2>
        {!reviews.length && <p className="meta">No public trip reviews yet.</p>}
        <div className="vendor-admin-list">
          {reviews.map((review) => (
            <div key={review.id} className="kyc-review-card">
              <div>
                <strong>{review.author_name}</strong> · {review.rating}/5 · {review.booking_reference}
                <p>{review.body}</p>
                <span className="meta">{new Date(review.created_at).toLocaleString()}</span>
              </div>
              <div className="card-actions">
                <button type="button" className="danger" onClick={() => removeReview(review)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="vendor-panel">
        <h2>Audit log (latest 100)</h2>
        <ul className="audit-log">
          {audit.map((row) => (
            <li key={row.id}>
              <strong>{row.action}</strong> · {row.entity_type}/{row.entity_id}
              {Object.keys(row.details || {}).length > 0 && (
                <p className="meta">{JSON.stringify(row.details)}</p>
              )}
              <span>{new Date(row.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
        {!audit.length && <p className="meta">No admin actions logged yet.</p>}
      </section>
    </div>
  )
}
