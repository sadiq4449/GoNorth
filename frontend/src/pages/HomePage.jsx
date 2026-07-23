import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import HeroSearch from '../components/HeroSearch'
import FeaturesSection from '../components/FeaturesSection'
import PromoBanner from '../components/PromoBanner'
import { fetchHealth, fetchListings } from '../api/client'

export default function HomePage() {
  const [health, setHealth] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: 'offline', ai_configured: false }))

    fetchListings()
      .then((data) => {
        setStats({
          stays: data.rooms?.length || 0,
          rides: data.vehicles?.length || 0,
          guides: data.guides?.length || 0,
        })
      })
      .catch(() => setStats(null))
  }, [])

  const aiLabel = health?.ai_configured ? 'OpenRouter AI ready' : 'Smart Match active'

  return (
    <>
      <HeroSearch />

      <div className="status-bar container">
        <span className={`status-dot ${health?.status === 'ok' ? 'online' : 'offline'}`} />
        API: {health?.status === 'ok' ? 'Connected' : 'Offline — check backend'}
        {health?.status === 'ok' && (
          <span className="ai-status">· Trip matching: {aiLabel}</span>
        )}
      </div>

      {stats && (
        <section className="container home-kpi-grid">
          <div className="home-kpi-card">
            <span className="home-kpi-label">Verified stays</span>
            <strong>{stats.stays}</strong>
            <span className="home-kpi-badge">Live inventory</span>
          </div>
          <div className="home-kpi-card">
            <span className="home-kpi-label">4x4 & transport</span>
            <strong>{stats.rides}</strong>
            <span className="home-kpi-badge">Vetted drivers</span>
          </div>
          <div className="home-kpi-card">
            <span className="home-kpi-label">Local guides</span>
            <strong>{stats.guides}</strong>
            <span className="home-kpi-badge">Mountain experts</span>
          </div>
          <div className="home-kpi-card">
            <span className="home-kpi-label">Platform fee</span>
            <strong>10%</strong>
            <span className="home-kpi-badge">Transparent pricing</span>
          </div>
        </section>
      )}

      <PromoBanner />

      <FeaturesSection />

      <div className="container home-cta">
        <h2>Ready to build your trip?</h2>
        <p>Use AI Magic Build on the hero above, or pick your own stay, 4x4, and guides manually.</p>
        <Link to="/plan" className="btn-secondary-link">Open Trip Builder →</Link>
      </div>
    </>
  )
}

export function PlaceholderPage({ title, subtitle }) {
  return (
    <div className="container placeholder-page">
      <Link to="/" className="back-link">← Back to Home</Link>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  )
}
