import { Link } from 'react-router-dom'
import AppIcon from './AppIcon'

export default function TrustSection({ stats }) {
  return (
    <section className="trust-section container" aria-label="Trust and support">
      <div className="trust-grid">
        <div className="trust-card">
          <AppIcon name="shield" size={28} />
          <strong>Book with confidence</strong>
          <p>Your payment stays in escrow until the trip is done — fair for you and fair for local businesses.</p>
        </div>
        <div className="trust-card">
          <AppIcon name="check" size={28} />
          <strong>Vetted local partners</strong>
          <p>Hotels, drivers, and guides are reviewed before they go live. No anonymous listings.</p>
        </div>
        <div className="trust-card">
          <AppIcon name="message" size={28} />
          <strong>Support on the road</strong>
          <p>In-trip chat, SOS alerts, road advisories, and a community of travelers who’ve been there.</p>
        </div>
        {stats && (
          <div className="trust-stats">
            <div><strong>{stats.stays}+</strong><span>Verified stays</span></div>
            <div><strong>{stats.rides}+</strong><span>Private vehicles</span></div>
            <div><strong>{stats.guides}+</strong><span>Local guides</span></div>
          </div>
        )}
      </div>
      <div className="trust-cta">
        <p>Still deciding where to go?</p>
        <Link to="/forum" className="btn-secondary-link">Ask a traveler →</Link>
        <Link to="/packages" className="btn-secondary-link">Browse packages →</Link>
      </div>
    </section>
  )
}
