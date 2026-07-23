import { Link, useNavigate } from 'react-router-dom'
import AppIcon from './AppIcon'
import { packageImageStatus } from '../lib/packageImages'

function formatPrice(amount) {
  return amount.toLocaleString('en-PK')
}

function PackageImage({ pkg, priority = false }) {
  const status = packageImageStatus(pkg)

  if (status.missing) {
    return (
      <div className="tour-package-images tour-package-images--missing" role="img" aria-label={`${status.label} photo not yet available`}>
        <AppIcon name="image" size={28} className="tour-package-missing-icon" />
        <span className="tour-package-missing-title">Photo needed</span>
        <span className="tour-package-missing-dest">{status.label}</span>
        {status.slug && <span className="tour-package-missing-slug">{status.slug}</span>}
      </div>
    )
  }

  return (
    <div className="tour-package-images tour-package-images--photo">
      <img
        src={status.url}
        alt={`${pkg.title} — ${pkg.destination}, Gilgit-Baltistan`}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    </div>
  )
}

export default function TourPackageCard({ pkg, booking = false, onBook, imagePriority = false }) {
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
        <PackageImage pkg={pkg} priority={imagePriority} />
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

export { PackageImage }
