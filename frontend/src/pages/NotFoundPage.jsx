import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  const [path, setPath] = useState('')

  useEffect(() => {
    setPath(window.location.pathname)
  }, [])

  return (
    <div className="container not-found-page">
      <span className="not-found-code">404</span>
      <h1>Page not found</h1>
      <p>
        We could not find <strong>{path || 'this page'}</strong> on GoNorth.
        Check the URL or head back to plan your Gilgit-Baltistan trip.
      </p>
      <div className="not-found-actions">
        <Link to="/" className="btn-primary btn-enabled">Back to home</Link>
        <Link to="/plan" className="btn-secondary-link">Plan a trip</Link>
      </div>
    </div>
  )
}
