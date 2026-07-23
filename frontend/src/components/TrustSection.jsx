import { Link } from 'react-router-dom'
import AppIcon from './AppIcon'

export default function TrustSection({ stats }) {
  return (
    <section className="trust-section container" aria-label="Trust and support">
      <div className="trust-grid">
        <div className="trust-card">
          <AppIcon name="shield" size={28} />
          <strong>Escrow-protected bookings</strong>
          <p>Payments held until your trip is verified complete — fair for travelers and vendors.</p>
        </div>
        <div className="trust-card">
          <AppIcon name="check" size={28} />
          <strong>Verified vendors</strong>
          <p>KYC-reviewed hotels, drivers, and guides with admin approval before going live.</p>
        </div>
        <div className="trust-card">
          <AppIcon name="message" size={28} />
          <strong>24/7 trip support</strong>
          <p>In-trip chat, SOS alerts, road advisories, and the traveler forum community.</p>
        </div>
        {stats && (
          <div className="trust-stats">
            <div><strong>{stats.stays}+</strong><span>Verified stays</span></div>
            <div><strong>{stats.rides}+</strong><span>Transport options</span></div>
            <div><strong>{stats.guides}+</strong><span>Local guides</span></div>
          </div>
        )}
      </div>
      <div className="trust-cta">
        <p>Questions before you book?</p>
        <Link to="/forum" className="btn-secondary-link">Ask the community →</Link>
        <Link to="/packages" className="btn-secondary-link">Browse packages →</Link>
      </div>
    </section>
  )
}
