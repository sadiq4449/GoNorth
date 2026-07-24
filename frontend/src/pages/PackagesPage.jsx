import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchPackages } from '../api/client'
import TourPackageCard from '../components/TourPackageCard'
import PageHeader from '../components/PageHeader'
import AppIcon from '../components/AppIcon'

const VIBES = ['all', 'backpacker', 'adventure', 'luxury']
const DESTINATIONS = ['all', 'Skardu', 'Hunza', 'Gilgit', 'Deosai', 'Khaplu', 'Shigar', 'Astore', 'Basho']

const EXPECTATIONS = [
  {
    icon: 'check',
    title: 'Verified stays',
    body: 'Guesthouses, hostels, and hotels reviewed before they go live.',
    verified: true,
  },
  {
    icon: 'car',
    title: 'Private transport',
    body: '4x4, jeeps, vans, or sedans with experienced local drivers.',
  },
  {
    icon: 'users',
    title: 'Local guides',
    body: 'Trek, culture, and camping experts who know the valleys.',
  },
  {
    icon: 'shield',
    title: 'Escrow protection',
    body: 'Book with confidence — payment held until your trip is complete.',
  },
]

export default function PackagesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const destination = searchParams.get('destination') || 'all'
  const vibe = searchParams.get('vibe') || 'all'

  useEffect(() => {
    setLoading(true)
    setError('')
    fetchPackages({
      destination: destination === 'all' ? undefined : destination,
      vibe: vibe === 'all' ? undefined : vibe,
    })
      .then(setPackages)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [destination, vibe])

  function setFilter(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value === 'all') next.delete(key)
    else next.set(key, value)
    setSearchParams(next)
  }

  return (
    <div className="container tourist-page packages-page">
      <PageHeader
        title="Curated Journeys Across Gilgit-Baltistan"
        lead="Hand-picked routes from Hunza to Deosai — live prices, verified operators, and room to customize every detail."
      />

      <div className="packages-filters">
        <div className="filter-group">
          <span className="filter-label">Destination</span>
          <div className="chip-row">
            {DESTINATIONS.map((d) => (
              <button
                key={d}
                type="button"
                className={`chip ${destination === d ? 'active' : ''}`}
                onClick={() => setFilter('destination', d)}
              >
                {d === 'all' ? 'All valleys' : d}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">Travel style</span>
          <div className="chip-row">
            {VIBES.map((v) => (
              <button
                key={v}
                type="button"
                className={`chip ${vibe === v ? 'active' : ''}`}
                onClick={() => setFilter('vibe', v)}
              >
                {v === 'all' ? 'All styles' : v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading && <p className="packages-status">Loading packages…</p>}

      {!loading && !packages.length && (
        <p className="meta packages-empty">
          Nothing matches these filters yet.{' '}
          <Link to="/plan">Build Your Perfect Trip</Link> instead.
        </p>
      )}

      <div className="tour-packages-grid">
        {packages.map((pkg, index) => (
          <TourPackageCard key={pkg.id} pkg={pkg} imagePriority={index < 4} />
        ))}
      </div>

      <section className="packages-includes">
        <h2>What you can expect</h2>
        <div className="includes-grid">
          {EXPECTATIONS.map((item) => (
            <article key={item.title} className="includes-item">
              <div className="includes-item-head">
                <span className="includes-icon" aria-hidden>
                  <AppIcon name={item.icon} size={18} />
                </span>
                <div className="includes-item-title-row">
                  <strong>{item.title}</strong>
                  {item.verified && (
                    <span className="verified-badge">
                      <AppIcon name="check" size={12} strokeWidth={2.5} />
                      Verified
                    </span>
                  )}
                </div>
              </div>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        <div className="packages-includes-cta">
          <Link to="/plan" className="btn-ai btn-with-icon home-cta-btn">
            <AppIcon name="sparkles" size={18} />
            Build Your Perfect Trip
          </Link>
        </div>
      </section>
    </div>
  )
}
