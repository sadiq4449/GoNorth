import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchListings } from '../api/client'
import { StayCard } from '../components/StayCard'
import { RideCard } from '../components/RideCard'
import { GuideCard } from '../components/GuideCard'
import { ExperienceCard } from '../components/ExperienceCard'
import PageHeader from '../components/PageHeader'

const TABS = [
  { id: 'stays', label: 'Stays' },
  { id: 'transport', label: 'Transport' },
  { id: 'guides', label: 'Guides' },
  { id: 'restaurants', label: 'Restaurants' },
  { id: 'activities', label: 'Activities' },
]

export default function ExplorePage() {
  const navigate = useNavigate()
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

  function goPlan(draft) {
    navigate('/plan', { state: { draft } })
  }

  const restaurants = listings?.experiences?.filter((e) => e.category === 'restaurant') || []
  const activities = listings?.experiences?.filter((e) => e.category === 'activity') || []

  return (
    <div className="container tourist-page explore-page">
      <PageHeader
        title="Find Your Ideal Stay — and More"
        lead="Browse verified stays, transport, guides, restaurants, and experiences across Gilgit-Baltistan. Book à la carte or combine everything in one trip."
      />

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
            {['Skardu', 'Hunza', 'Gilgit', 'Khaplu', 'Shigar', 'Deosai', 'Astore', 'Basho'].map((v) => (
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
            <StayCard
              key={r.id}
              room={r}
              selected={false}
              onSelect={() => goPlan({ roomId: r.id, destination: r.valley })}
            />
          ))}
          {tab === 'transport' && listings.vehicles.map((v) => (
            <RideCard
              key={v.id}
              vehicle={v}
              selected={false}
              onSelect={() => goPlan({ vehicleId: v.id, destination: v.valley })}
            />
          ))}
          {tab === 'guides' && listings.guides.map((g) => (
            <GuideCard
              key={g.id}
              guide={g}
              selected={false}
              onToggle={() => goPlan({ guideIds: [g.id], destination: g.valley })}
            />
          ))}
          {tab === 'restaurants' && restaurants.map((exp) => (
            <ExperienceCard
              key={exp.id}
              experience={exp}
              selected={false}
              onToggle={() => goPlan({ experienceIds: [exp.id], destination: exp.valley })}
            />
          ))}
          {tab === 'activities' && activities.map((exp) => (
            <ExperienceCard
              key={exp.id}
              experience={exp}
              selected={false}
              onToggle={() => goPlan({ experienceIds: [exp.id], destination: exp.valley })}
            />
          ))}
        </div>
      )}

      {listings && !loading && tab === 'stays' && listings.rooms.length === 0 && (
        <p>No stays found for this filter.</p>
      )}

      <p className="explore-footer-note">
        Every listing comes from a verified local partner.{' '}
        <Link to="/packages">Browse curated packages</Link> or{' '}
        <Link to="/plan">Build Your Perfect Trip</Link>.
      </p>
    </div>
  )
}
