import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchPackages } from '../api/client'
import TourPackageCard from '../components/TourPackageCard'

const VIBES = ['all', 'backpacker', 'adventure', 'luxury']
const DESTINATIONS = ['all', 'Skardu', 'Hunza', 'Deosai', 'Khaplu', 'Shigar', 'Basho']

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
    <div className="container packages-page">
      <Link to="/" className="back-link">← Home</Link>
      <header className="packages-page-header">
        <h1>Explore Gilgit-Baltistan Tour Packages</h1>
        <p className="plan-lead">
          Curated and operator packages with live pricing — or customize any package in the trip builder.
        </p>
      </header>

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
        <p className="meta">No packages match these filters. <Link to="/plan">Build a custom trip</Link> instead.</p>
      )}

      <div className="tour-packages-grid">
        {packages.map((pkg) => (
          <TourPackageCard key={pkg.id} pkg={pkg} />
        ))}
      </div>

      <section className="packages-includes vendor-panel">
        <h2>What our packages typically include</h2>
        <div className="includes-grid">
          <div><strong>Verified accommodation</strong><p>Hostels, guest houses, and hotels vetted by GoNorth.</p></div>
          <div><strong>Private transport</strong><p>4x4, vans, or sedans with experienced local drivers.</p></div>
          <div><strong>Local guides</strong><p>Optional certified guides for treks, culture, and camping.</p></div>
          <div><strong>Escrow protection</strong><p>Secure checkout with funds held until trip completion.</p></div>
        </div>
        <Link to="/plan" className="btn-ai btn-with-icon home-cta-btn">Build a fully custom trip →</Link>
      </section>
    </div>
  )
}
