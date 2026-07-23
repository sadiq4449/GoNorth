import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchPackageDetail, submitPackageInquiry } from '../api/client'
import TourPackageCard from '../components/TourPackageCard'
import AppIcon from '../components/AppIcon'

function PackageHero({ pkg }) {
  const layout = pkg.image_layout
  const colors = pkg.image_colors || []
  if (layout === 'split' && colors.length >= 2) {
    return (
      <div className="package-detail-hero package-detail-hero--split">
        <div style={{ background: colors[0] }} />
        <div style={{ background: colors[1] }} />
      </div>
    )
  }
  const bg = colors.length >= 2 ? `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` : colors[0] || '#1e4976'
  return <div className="package-detail-hero" style={{ background: bg }} />
}

export default function PackageDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [pkg, setPkg] = useState(null)
  const [error, setError] = useState('')
  const [inquiryMsg, setInquiryMsg] = useState('')
  const [inquiryLoading, setInquiryLoading] = useState(false)
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    travel_date: '',
    guests: 2,
  })

  useEffect(() => {
    fetchPackageDetail(slug)
      .then(setPkg)
      .catch((e) => setError(e.message))
  }, [slug])

  function handleBook() {
    if (!pkg?.bookable) return
    navigate('/plan', {
      state: {
        draft: {
          destination: pkg.destination,
          nights: pkg.nights,
          budget: pkg.starting_price,
          vibe: pkg.vibe,
          guests: 2,
          roomId: pkg.room_id,
          vehicleId: pkg.vehicle_id,
          guideIds: pkg.guide_ids || [],
          quote: pkg.quote,
          aiReason: pkg.description,
          packageSource: 'package',
        },
      },
    })
  }

  async function handleInquiry(e) {
    e.preventDefault()
    setInquiryLoading(true)
    setInquiryMsg('')
    try {
      const res = await submitPackageInquiry(slug, inquiryForm)
      setInquiryMsg(res.message)
    } catch (err) {
      setInquiryMsg(err.message)
    } finally {
      setInquiryLoading(false)
    }
  }

  if (error) {
    return (
      <div className="container placeholder-page">
        <Link to="/packages" className="back-link">← All packages</Link>
        <h1>Package not found</h1>
        <p>{error}</p>
      </div>
    )
  }

  if (!pkg) {
    return <div className="container"><p>Loading package…</p></div>
  }

  return (
    <div className="container package-detail-page">
      <Link to="/packages" className="back-link">← All packages</Link>

      <div className="package-detail-layout">
        <div className="package-detail-main">
          <div className="package-detail-media">
            <PackageHero pkg={pkg} />
            {pkg.badge && (
              <span className={`tour-package-badge tour-package-badge--${pkg.badge_style}`}>{pkg.badge}</span>
            )}
          </div>

          <header className="package-detail-header">
            <span className="meta">{pkg.operator_name} · {pkg.valley}</span>
            <h1>{pkg.title}</h1>
            <div className="package-detail-meta">
              <span><AppIcon name="star" size={14} className="tour-package-star" /> {pkg.rating.toFixed(1)}</span>
              <span><AppIcon name="clock" size={14} /> {pkg.duration_label}</span>
              <span className="tag">{pkg.vibe}</span>
            </div>
          </header>

          <p className="package-detail-desc">{pkg.description}</p>

          {pkg.highlights?.length > 0 && (
            <section className="vendor-panel">
              <h2>Highlights</h2>
              <ul className="package-highlight-list">
                {pkg.highlights.map((h) => <li key={h}>{h}</li>)}
              </ul>
            </section>
          )}

          {pkg.itinerary?.length > 0 && (
            <section className="vendor-panel">
              <h2>Day-by-day itinerary</h2>
              <ol className="package-itinerary">
                {pkg.itinerary.map((day) => (
                  <li key={day.day}>
                    <strong>Day {day.day}: {day.title}</strong>
                    <p>{day.description}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div className="package-includes-grid">
            <section className="vendor-panel">
              <h3>Inclusions</h3>
              <ul>{pkg.inclusions?.map((i) => <li key={i}>{i}</li>)}</ul>
            </section>
            <section className="vendor-panel">
              <h3>Exclusions</h3>
              <ul>{pkg.exclusions?.map((i) => <li key={i}>{i}</li>)}</ul>
            </section>
          </div>
        </div>

        <aside className="package-detail-sidebar">
          <div className="invoice-card">
            <span className="invoice-type">Starting from</span>
            <strong className="package-detail-price">PKR {pkg.starting_price.toLocaleString()}</strong>
            <p className="invoice-meta">{pkg.nights} nights · per trip estimate</p>
            {pkg.bookable ? (
              <button type="button" className="btn-primary btn-enabled checkout-btn" onClick={handleBook}>
                Book Now
              </button>
            ) : (
              <p className="meta">Send an inquiry for custom pricing on this route.</p>
            )}
            <Link to="/plan" className="btn-secondary-link package-customize-link">
              Customize in trip builder
            </Link>
          </div>

          <form className="vendor-panel package-inquiry-form" onSubmit={handleInquiry}>
            <h3>Send inquiry</h3>
            <p className="meta">Prefer to talk first? Our operators respond within 24 hours.</p>
            <label>Name<input value={inquiryForm.name} onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })} required /></label>
            <label>Email<input type="email" value={inquiryForm.email} onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })} required /></label>
            <label>Phone<input value={inquiryForm.phone} onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })} /></label>
            <label>Travel date<input type="date" value={inquiryForm.travel_date} onChange={(e) => setInquiryForm({ ...inquiryForm, travel_date: e.target.value })} /></label>
            <label>Guests<input type="number" min={1} max={20} value={inquiryForm.guests} onChange={(e) => setInquiryForm({ ...inquiryForm, guests: Number(e.target.value) })} /></label>
            <label>Message<textarea value={inquiryForm.message} onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })} rows={3} placeholder="Any special requests?" /></label>
            {inquiryMsg && <p className="toast-info">{inquiryMsg}</p>}
            <button type="submit" className="btn-secondary" disabled={inquiryLoading}>
              {inquiryLoading ? 'Sending…' : 'Send inquiry'}
            </button>
          </form>
        </aside>
      </div>
    </div>
  )
}
