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
              <strong>{a.region}:</strong> {a.message}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
