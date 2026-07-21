import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminPayouts, runAdminPayouts } from '../api/client'

export default function AdminPayoutsPage() {
  const [batches, setBatches] = useState([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  function load() {
    fetchAdminPayouts().then(setBatches).catch(() => {})
  }

  useEffect(() => {
    load()
  }, [])

  async function runBatch() {
    setLoading(true)
    try {
      const batch = await runAdminPayouts()
      setMsg(`Batch sent — Rs. ${batch.total_amount.toLocaleString()} to ${batch.vendor_count} vendors`)
      load()
    } catch (e) {
      setMsg(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container admin-page">
      <Link to="/admin" className="back-link">← Overview</Link>
      <h1>Vendor payout batch</h1>
      <p className="plan-lead">Disburse wallet balances via JazzCash/EasyPaisa or IBFT (sandbox refs in dev).</p>
      {msg && <p className="toast-info">{msg}</p>}
      <button type="button" className="btn-primary btn-enabled" onClick={runBatch} disabled={loading}>
        {loading ? 'Running…' : 'Run payout batch'}
      </button>
      <ul className="audit-log payout-list">
        {batches.map((b) => (
          <li key={b.id}>
            <strong>Rs. {b.total_amount.toLocaleString()}</strong> · {b.vendor_count} vendors · {b.method}
            <span>{new Date(b.created_at).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
