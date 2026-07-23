import { Link } from 'react-router-dom'
import AppIcon from './AppIcon'
import { MARKETPLACE_SERVICES } from '../lib/destinations'

export default function MarketplaceServices() {
  return (
    <section className="marketplace-services container" aria-label="Marketplace services">
      <div className="marketplace-services-grid">
        {MARKETPLACE_SERVICES.map((s) => (
          <Link key={s.id} to={s.to} className="marketplace-service-card">
            <AppIcon name={s.icon} size={22} />
            <strong>{s.label}</strong>
            <span>{s.desc}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
