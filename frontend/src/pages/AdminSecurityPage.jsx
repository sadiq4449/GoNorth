import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminAuditLog, fetchAdminSosLog } from '../api/client'

export default function AdminSecurityPage() {
  const [sos, setSos] = useState([])
  const [audit, setAudit] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([fetchAdminSosLog(), fetchAdminAuditLog()])
      .then(([sosRows, auditRows]) => {
        setSos(sosRows)
        setAudit(auditRows)
      })
      .catch((e) => setError(e.message))
  }, [])

  return (
    <div className="container admin-page">
      <Link to="/admin" className="back-link">← Overview</Link>
      <h1>Security & activity monitoring</h1>
      <p className="admin-lead">SOS dispatch log and immutable admin audit trail.</p>
      {error && <p className="form-error">{error}</p>}

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
