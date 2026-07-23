import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  const [path, setPath] = useState('')

  useEffect(() => {
    setPath(window.location.pathname)
  }, [])

  return (
    <div className="container tourist-page not-found-page">
      <header className="page-header">
        <span className="not-found-code">404</span>
        <h1>That page doesn&apos;t exist</h1>
        <p className="plan-lead">
          We couldn&apos;t find <strong>{path || 'this page'}</strong> on GoNorth.
          Head home to explore Gilgit-Baltistan, or jump straight into the trip builder.
        </p>
      </header>
      <div className="not-found-actions">
        <Link to="/" className="btn-primary btn-enabled">Explore Gilgit-Baltistan</Link>
        <Link to="/plan" className="btn-secondary-link">Build Your Perfect Trip</Link>
      </div>
    </div>
  )
}
