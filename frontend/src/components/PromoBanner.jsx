import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchActiveCampaigns } from '../api/client'

export default function PromoBanner({ valley }) {
  const [campaigns, setCampaigns] = useState([])

  useEffect(() => {
    fetchActiveCampaigns(valley)
      .then(setCampaigns)
      .catch(() => setCampaigns([]))
  }, [valley])

  if (!campaigns.length) return null

  return (
    <section className="promo-banner-section container" aria-label="Seasonal promotions">
      <div className="promo-banner-header">
        <span className="section-eyebrow">Off-season offers</span>
        <h2>Save on your next Baltistan trip</h2>
      </div>
      <div className="promo-banner-grid">
        {campaigns.map((c) => (
          <article key={c.id} className="promo-banner-card">
            {c.discount_label && <span className="promo-discount-pill">{c.discount_label}</span>}
            <h3>{c.title}</h3>
            {c.valley && <span className="promo-valley-tag">{c.valley}</span>}
            <p>{c.message}</p>
            <Link to={c.cta_url || '/plan'} className="promo-cta">
              {c.cta_label || 'Book now'} →
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
