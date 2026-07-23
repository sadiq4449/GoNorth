import AppIcon from './AppIcon'
import { categoryLabel } from '../lib/vehicleCategories'

export function RideCard({ vehicle, selected, disabled, onSelect, recommendSource }) {
  const cat = vehicle.category_label || categoryLabel(vehicle.vehicle_category)

  return (
    <article
      className={`listing-card selectable ride-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={() => !disabled && onSelect(vehicle)}
      onKeyDown={(e) => e.key === 'Enter' && !disabled && onSelect(vehicle)}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      <div className="ride-card-top">
        <span className="vehicle-category-badge">{cat}</span>
        {vehicle.featured && (
          <span className="featured-badge">
            <AppIcon name="star" size={12} /> Featured
          </span>
        )}
        {vehicle.ai_recommended && (
          <span className={recommendSource === 'ai' ? 'ai-badge' : 'smart-badge'}>
            <AppIcon name={recommendSource === 'ai' ? 'sparkles' : 'check'} size={12} />
            {recommendSource === 'ai' ? 'Matched for you' : 'Best available match'}
          </span>
        )}
      </div>
      {!vehicle.terrain_compatible && (
        <span className="warn-badge">
          <AppIcon name="alert" size={12} /> Not for this route
        </span>
      )}
      <h3>{vehicle.model}</h3>
      <p className="meta">
        {vehicle.driver_name} · {vehicle.valley}
        {vehicle.seats ? ` · up to ${vehicle.seats} seats` : ''}
      </p>
      <p>{vehicle.vendor_name}</p>
      <div className="tag-row">
        {vehicle.is_4x4 && <span className="tag">4x4 capable</span>}
        {vehicle.has_ac && <span className="tag">AC / Heater</span>}
        {vehicle.within_budget && <span className="tag">Within budget</span>}
        {vehicle.solo_safe && <span className="tag tag-safe">Solo safe</span>}
        {vehicle.women_friendly && <span className="tag tag-women">Women-friendly</span>}
        {(vehicle.languages || []).map((lang) => (
          <span key={lang} className="tag tag-lang">{lang}</span>
        ))}
      </div>
      <strong>Rs. {vehicle.daily_rate.toLocaleString()}/day</strong>
    </article>
  )
}
