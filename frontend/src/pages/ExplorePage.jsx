import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchListings } from '../api/client'
import { StayCard } from '../components/StayCard'
import { RideCard } from '../components/RideCard'
import { GuideCard } from '../components/GuideCard'

const TABS = [
  { id: 'stays', label: 'Stays' },
  { id: 'transport', label: 'Transport' },
  { id: 'guides', label: 'Guides' },
]

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'stays'
  const [listings, setListings] = useState(null)
  const [valley, setValley] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    fetchListings(valley || undefined)
      .then(setListings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [valley])

  return (
    <div className="container explore-page">
      <Link to="/" className="back-link">← Home</Link>
      <header>
        <h1>Explore the marketplace</h1>
        <p className="plan-lead">
          Browse verified stays, transport fleets, and local guides — then add them to your custom trip.
        </p>
      </header>

      <div className="explore-toolbar">
        <div className="chip-row">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip ${tab === t.id ? 'active' : ''}`}
              onClick={() => setSearchParams({ tab: t.id })}
            >
              {t.label}
            </button>
          ))}
        </div>
        <label className="explore-valley-filter">
          Valley
          <select value={valley} onChange={(e) => setValley(e.target.value)}>
            <option value="">All valleys</option>
            {['Skardu', 'Hunza', 'Khaplu', 'Shigar', 'Deosai', 'Basho'].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading && <p>Loading listings…</p>}

      {listings && !loading && (
        <div className="listing-grid">
          {tab === 'stays' && listings.rooms.map((r) => (
            <StayCard key={r.id} room={r} selected={false} onSelect={() => {}} />
          ))}
          {tab === 'transport' && listings.vehicles.map((v) => (
            <RideCard key={v.id} vehicle={v} selected={false} onSelect={() => {}} />
          ))}
          {tab === 'guides' && listings.guides.map((g) => (
            <GuideCard key={g.id} guide={g} selected={false} onToggle={() => {}} />
          ))}
        </div>
      )}

      <div className="explore-cta vendor-panel">
        <p>Ready to combine listings into one trip?</p>
        <Link to="/plan" className="btn-primary btn-enabled">Open trip builder</Link>
      </div>
    </div>
  )
}
