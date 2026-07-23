import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import HeroSearch from '../components/HeroSearch'
import FeaturesSection from '../components/FeaturesSection'
import PromoBanner from '../components/PromoBanner'
import AppIcon from '../components/AppIcon'
import { fetchListings } from '../api/client'

export default function HomePage() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
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

  return (
    <>
      <HeroSearch />

      {stats && (
        <section className="container home-trust-strip" aria-label="Live marketplace inventory">
          <div className="home-trust-item">
            <strong>{stats.stays}+</strong>
            <span>Verified stays</span>
          </div>
          <div className="home-trust-item">
            <strong>{stats.rides}+</strong>
            <span>Transport options</span>
          </div>
          <div className="home-trust-item">
            <strong>{stats.guides}+</strong>
            <span>Local guides</span>
          </div>
        </section>
      )}

      <PromoBanner />

      <FeaturesSection />

      <section className="container home-cta home-cta-final">
        <h2>Your Gilgit-Baltistan trip starts here</h2>
        <p>Use AI Magic Build above, or hand-pick every stay, vehicle, and guide yourself.</p>
        <Link to="/plan" className="btn-ai home-cta-btn btn-with-icon">
          <AppIcon name="sparkles" size={18} />
          Build my trip
        </Link>
      </section>
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
