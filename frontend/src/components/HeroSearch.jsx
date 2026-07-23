import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchRecommendation } from '../api/client'
import { packageStatus } from '../lib/aiStatus'
import AppIcon from './AppIcon'

const DESTINATIONS = ['Skardu', 'Shigar', 'Khaplu', 'Deosai', 'Basho', 'Hunza']
const VIBES = [
  { id: 'backpacker', label: 'Backpacker' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'luxury', label: 'Luxury' },
]

export default function HeroSearch() {
  const navigate = useNavigate()
  const [destination, setDestination] = useState('Skardu')
  const [nights, setNights] = useState(5)
  const [budget, setBudget] = useState(60000)
  const [vibe, setVibe] = useState('backpacker')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function handleAiBuild() {
    if (!budget || budget < 5000) {
      setError('Enter a budget of at least PKR 5,000')
      return
    }
    setError('')
    setNotice('')
    setLoading(true)
    try {
      const pkg = await fetchRecommendation({ destination, nights, budget, vibe })
      const status = packageStatus(pkg)
      if (status.kind === 'fallback') {
        setNotice(status.message)
      }
      navigate('/plan', {
        state: {
          draft: {
            destination,
            nights,
            budget,
            vibe,
            guests: 2,
            roomId: pkg.room_id,
            vehicleId: pkg.vehicle_id,
            guideIds: pkg.guide_ids || [],
            quote: pkg.quote,
            aiReason: status.kind === 'ai' ? pkg.reason : status.message,
            packageSource: pkg.source,
            aiAvailable: pkg.ai_available,
          },
        },
      })
    } catch (e) {
      setError(
        e.message.includes('No approved listings')
          ? 'No verified listings for this destination yet. Try Skardu or Hunza, or browse manually.'
          : 'Could not build a package right now. Continue to Plan Trip and pick your stay and vehicle manually.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="hero">
      <div className="hero-content">
        <span className="hero-tag">AI Dynamic Trip Builder</span>
        <h1>Build your Gilgit-Baltistan adventure</h1>
        <p>Mix hostels, transport, and local guides — priced instantly for your budget.</p>
      </div>

      <div className="quick-search">
        <div className="quick-field">
          <label>Destination</label>
          <select value={destination} onChange={(e) => setDestination(e.target.value)}>
            {DESTINATIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="quick-field">
          <label>Nights</label>
          <input type="number" min={1} max={30} value={nights} onChange={(e) => setNights(Number(e.target.value))} />
        </div>
        <div className="quick-field">
          <label>Max Budget (PKR)</label>
          <input type="number" min={5000} step={1000} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
        </div>
        <div className="quick-field">
          <label>Vibe</label>
          <div className="vibe-selector">
            {VIBES.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`vibe-btn ${vibe === v.id ? 'active' : ''}`}
                onClick={() => setVibe(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="btn-ai btn-with-icon" onClick={handleAiBuild} disabled={loading}>
          {loading ? 'Building your package…' : (
            <>
              <AppIcon name="sparkles" size={18} />
              AI Magic Build
            </>
          )}
        </button>
      </div>
      {notice && <p className="hero-notice">{notice}</p>}
      {error && (
        <div className="hero-error-block">
          <p className="hero-error">{error}</p>
          <Link to="/plan" state={{ draft: { destination, nights, budget, vibe, guests: 2 } }} className="hero-error-link">
            Plan manually →
          </Link>
        </div>
      )}
    </section>
  )
}
