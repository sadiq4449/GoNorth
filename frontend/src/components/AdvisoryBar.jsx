import { useEffect, useState } from 'react'
import { fetchAdvisories } from '../api/client'

export default function AdvisoryBar() {
  const [items, setItems] = useState([])

  useEffect(() => {
    fetchAdvisories()
      .then(setItems)
      .catch(() => {})
    const timer = setInterval(() => {
      if (navigator.onLine) fetchAdvisories().then(setItems).catch(() => {})
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  if (!items.length) return null

  return (
    <div className="advisory-bar">
      <div className="container advisory-content">
        <span className="advisory-badge">Advisory</span>
        <div className="advisory-ticker">
          {items.map((a) => (
            <span key={a.id} className={`advisory-item severity-${a.severity}`}>
              {a.category && a.category !== 'road' && (
                <span className="advisory-category">{a.category}</span>
              )}
              <strong>{a.region}:</strong>{' '}
              {a.external_url ? (
                <a href={a.external_url} target="_blank" rel="noopener noreferrer" className="advisory-link">
                  {a.message}
                </a>
              ) : (
                a.message
              )}
              {a.live && <span className="advisory-live-dot" title={`Live · ${a.source || 'automated'}`} />}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
