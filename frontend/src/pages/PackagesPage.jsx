import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchPackages } from '../api/client'
import TourPackageCard from '../components/TourPackageCard'
import PageHeader from '../components/PageHeader'

const VIBES = ['all', 'backpacker', 'adventure', 'luxury']
const DESTINATIONS = ['all', 'Skardu', 'Hunza', 'Gilgit', 'Deosai', 'Khaplu', 'Shigar', 'Astore', 'Basho']

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
      {loading && <p>Loading packages…</p>}

      {!loading && !packages.length && (
        <p className="meta">Nothing matches these filters yet. <Link to="/plan">Build Your Perfect Trip</Link> instead.</p>
      )}

      <div className="tour-packages-grid">
        {packages.map((pkg) => (
          <TourPackageCard key={pkg.id} pkg={pkg} />
        ))}
      </div>

      <section className="packages-includes vendor-panel">
        <h2>What you can expect</h2>
        <div className="includes-grid">
          <div><strong>Verified stays</strong><p>Guesthouses, hostels, and hotels reviewed before they go live.</p></div>
          <div><strong>Private transport</strong><p>4x4, jeeps, vans, or sedans with experienced local drivers.</p></div>
          <div><strong>Local guides</strong><p>Trek, culture, and camping experts who know the valleys.</p></div>
          <div><strong>Escrow protection</strong><p>Book with confidence — payment held until your trip is complete.</p></div>
        </div>
        <Link to="/plan" className="btn-ai btn-with-icon home-cta-btn">Build Your Perfect Trip →</Link>
      </section>
    </div>
  )
}
