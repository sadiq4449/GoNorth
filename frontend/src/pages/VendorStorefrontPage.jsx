import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchVendorStorefront } from '../api/client'
import { StayCard } from '../components/StayCard'
import { RideCard } from '../components/RideCard'
import { GuideCard } from '../components/GuideCard'
import { ExperienceCard } from '../components/ExperienceCard'
import AppIcon from '../components/AppIcon'

export default function VendorStorefrontPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [store, setStore] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    fetchVendorStorefront(slug)
      .then(setStore)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [slug])

  function planWith(selection) {
    navigate('/plan', { state: { draft: selection } })
  }

  if (loading) return <div className="container"><p>Loading storefront…</p></div>
  if (error) return <div className="container"><p className="form-error">{error}</p><Link to="/explore">← Explore</Link></div>
  if (!store) return null

  return (
    <div className="container storefront-page">
      <Link to="/explore" className="back-link">← Explore marketplace</Link>

      <header className="storefront-hero">
        <div className="storefront-hero-main">
          <div className="storefront-badge-row">
            <span className="listing-badge">{store.vendor_type.replace('_', ' ')}</span>
            {store.featured && <span className="listing-badge featured">Featured</span>}
            {store.gold_badge && <span className="listing-badge gold">Gold</span>}
          </div>
          <h1 className="storefront-title">
            <span>{store.business_name}</span>
            <span
              className="verified-badge verified-badge--inline"
              title={store.physically_vetted ? 'Physically vetted partner' : 'Approved marketplace partner'}
            >
              <AppIcon name="check" size={12} strokeWidth={2.5} />
              Verified
            </span>
          </h1>
          <p className="plan-lead">{store.description || `Verified ${store.vendor_type.replace('_', ' ')} in ${store.valley}.`}</p>
          <p className="listing-meta">
            {store.valley}
            {store.avg_rating && ` · ★ ${store.avg_rating} (${store.review_count} reviews)`}
            {store.women_friendly && ' · Women-friendly'}
            {store.solo_safe && ' · Solo-safe'}
          </p>
        </div>
        <div className="storefront-actions">
          <Link to="/plan" className="btn-primary btn-enabled">Build Your Perfect Trip</Link>
          {store.whatsapp && (
            <a href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`} className="btn-secondary" target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          )}
        </div>
      </header>

      {store.packages.length > 0 && (
        <section>
          <h2>Tour packages</h2>
          <div className="package-grid compact">
            {store.packages.map((pkg) => (
              <Link key={pkg.id} to={`/packages/${pkg.slug}`} className="package-card compact">
                <h3>{pkg.title}</h3>
                <p>{pkg.nights} nights · from PKR {pkg.starting_price?.toLocaleString()}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {store.rooms.length > 0 && (
        <section>
          <h2>Stays</h2>
          <div className="listing-grid">
            {store.rooms.map((r) => (
              <StayCard key={r.id} room={r} selected={false} onSelect={() => planWith({ roomId: r.id, destination: r.valley })} />
            ))}
          </div>
        </section>
      )}

      {store.vehicles.length > 0 && (
        <section>
          <h2>Transport</h2>
          <div className="listing-grid">
            {store.vehicles.map((v) => (
              <RideCard key={v.id} vehicle={v} selected={false} onSelect={() => planWith({ vehicleId: v.id, destination: v.valley })} />
            ))}
          </div>
        </section>
      )}

      {store.guides.length > 0 && (
        <section>
          <h2>Guides</h2>
          <div className="listing-grid">
            {store.guides.map((g) => (
              <GuideCard key={g.id} guide={g} selected={false} onToggle={() => planWith({ guideIds: [g.id], destination: g.valley })} />
            ))}
          </div>
        </section>
      )}

      {store.experiences.length > 0 && (
        <section>
          <h2>Restaurants & activities</h2>
          <div className="listing-grid">
            {store.experiences.map((exp) => (
              <ExperienceCard
                key={exp.id}
                experience={exp}
                selected={false}
                onToggle={() => planWith({ experienceIds: [exp.id], destination: exp.valley })}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
