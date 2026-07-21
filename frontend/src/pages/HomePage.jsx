import { useEffect, useState } from 'react'
import HeroSearch from '../components/HeroSearch'
import { fetchHealth } from '../api/client'

export default function HomePage() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: 'offline', ai_configured: false }))
  }, [])

  return (
    <>
      <HeroSearch />

      <div className="status-bar container">
        <span className={`status-dot ${health?.status === 'ok' ? 'online' : 'offline'}`} />
        API: {health?.status === 'ok' ? 'Connected' : 'Offline'}
        {health?.status === 'ok' && (
          <span className="ai-status">
            · AI: {health.ai_configured ? 'Ready' : 'Set NVIDIA_API_KEY (fallback active)'}
          </span>
        )}
      </div>

      <div className="container home-cta">
        <h2>Or build manually</h2>
        <p>Pick your own stay, 4x4, and guides with live pricing on the Plan Trip page.</p>
        <a href="/plan" className="btn-secondary-link">Open Trip Builder →</a>
      </div>
    </>
  )
}

export function PlaceholderPage({ title, subtitle }) {
  return (
    <div className="container placeholder-page">
      <a href="/" className="back-link">← Back to Home</a>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  )
}
