import { Link, useNavigate } from 'react-router-dom'
import AppIcon from './AppIcon'

function formatPrice(amount) {
  return amount.toLocaleString('en-PK')
}

function PackageImage({ layout, colors, title }) {
  if (layout === 'split' && colors.length >= 2) {
    return (
      <div className="tour-package-images tour-package-images--split">
        <div className="tour-package-img-cell" style={{ background: colors[0] }} aria-hidden />
        <div className="tour-package-img-cell" style={{ background: colors[1] }} aria-hidden />
      </div>
    )
  }
  if (layout === 'collage' && colors.length >= 3) {
    return (
      <div className="tour-package-images tour-package-images--collage">
        <div className="tour-package-img-cell" style={{ background: colors[0] }} aria-hidden />
        <div className="tour-package-img-cell" style={{ background: colors[1] }} aria-hidden />
        <div className="tour-package-img-cell tour-package-img-cell--wide" style={{ background: colors[2] }} aria-hidden />
      </div>
    )
  }
  const bg = colors.length >= 2
    ? `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`
    : colors[0] || '#1e4976'
  return (
    <div className="tour-package-images tour-package-images--single" style={{ background: bg }} aria-hidden>
      <span className="tour-package-img-label">{title}</span>
    </div>
  )
}

export default function TourPackageCard({ pkg, booking = false, onBook }) {
  const navigate = useNavigate()

  function handleBook() {
    if (onBook) {
      onBook(pkg)
      return
    }
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
          aiReason: pkg.reason,
        },
      },
    })
  }

  return (
    <article className="tour-package-card">
      <div className="tour-package-media">
        <PackageImage layout={pkg.image_layout} colors={pkg.image_colors} title={pkg.destination} />
        {pkg.badge && (
          <span className={`tour-package-badge tour-package-badge--${pkg.badge_style}`}>
            {pkg.badge}
          </span>
        )}
      </div>

      <div className="tour-package-body">
        {pkg.operator_name && <span className="tour-package-operator">{pkg.operator_name}</span>}
        <h3 className="tour-package-title">
          {pkg.slug ? (
            <Link to={`/packages/${pkg.slug}`}>{pkg.title}</Link>
          ) : (
            pkg.title
          )}
        </h3>

        <div className="tour-package-meta">
          <span className="tour-package-rating">
            <AppIcon name="star" size={14} className="tour-package-star" />
            {pkg.rating.toFixed(1)}
          </span>
          <span className="tour-package-duration">
            <AppIcon name="clock" size={14} />
            {pkg.duration_label}
          </span>
        </div>

        <div className="tour-package-price">
          <span className="tour-package-price-label">Starting from</span>
          <strong className="tour-package-price-value">PKR {formatPrice(pkg.starting_price)}</strong>
        </div>

        <div className="tour-package-actions">
          {pkg.slug && (
            <Link to={`/packages/${pkg.slug}`} className="tour-package-details-link">
              View details
            </Link>
          )}
          <button
            type="button"
            className="tour-package-book-btn"
            onClick={handleBook}
            disabled={booking || !pkg.bookable}
          >
            {booking ? 'Loading…' : 'Book Now'}
          </button>
        </div>
      </div>
    </article>
  )
}
