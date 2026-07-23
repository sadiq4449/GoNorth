import { Link } from 'react-router-dom'
import { DESTINATIONS } from '../lib/destinations'

export default function DestinationsPage() {
  return (
    <div className="container destinations-page">
      <Link to="/" className="back-link">← Home</Link>
      <header className="destinations-header">
        <h1>Valleys of Gilgit-Baltistan</h1>
        <p className="plan-lead">
          From Hunza’s forts to Deosai’s plateau — compare seasons, terrain, and routes, then book a package or build your own.
        </p>
      </header>

      <div className="destinations-grid">
        {DESTINATIONS.map((d) => (
          <article key={d.id} className="destination-card">
            <div
              className="destination-card-hero"
              style={{ background: `linear-gradient(135deg, ${d.colors[0]}, ${d.colors[1] || d.colors[0]})` }}
            />
            <div className="destination-card-body">
              <h2>{d.name}</h2>
              <p className="destination-tagline">{d.tagline}</p>
              <p>{d.description}</p>
              <ul className="destination-highlights">
                {d.highlights.map((h) => <li key={h}>{h}</li>)}
              </ul>
              <div className="destination-meta">
                <span><strong>Best season:</strong> {d.bestSeason}</span>
                <span><strong>Terrain:</strong> {d.terrain}</span>
              </div>
              <div className="destination-actions">
                <Link to={`/packages?destination=${encodeURIComponent(d.name)}`} className="btn-secondary-link">
                  See packages →
                </Link>
                <Link to={`/plan`} state={{ draft: { destination: d.name, nights: 5, budget: 60000, vibe: 'backpacker', guests: 2 } }} className="btn-secondary-link">
                  Start Your Adventure →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
