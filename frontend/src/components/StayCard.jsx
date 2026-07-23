import { useState } from 'react'
import AppIcon from './AppIcon'

const AMENITY_ICONS = {
  WiFi: 'wifi',
  'Hot Shower': 'shower',
  Breakfast: 'coffee',
  'Mountain View': 'mountain',
  'K2 View': 'mountain',
  Garden: 'trees',
  Pool: 'ship',
  'Fine Dine': 'utensils',
  Boating: 'ship',
  Heritage: 'landmark',
  'Valley View': 'eye',
}

export function StayCard({ room, selected, onSelect, recommendSource }) {
  const [expanded, setExpanded] = useState(false)

  function toggleExpand(e) {
    e.stopPropagation()
    setExpanded((v) => !v)
  }

  return (
    <article
      className={`listing-card selectable stay-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(room)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(room)}
      role="button"
      tabIndex={0}
    >
      {room.featured && (
        <span className="featured-badge">
          <AppIcon name="star" size={12} /> Featured
        </span>
      )}
      {room.ai_recommended && (
        <span className={recommendSource === 'ai' ? 'ai-badge' : 'smart-badge'}>
          <AppIcon name={recommendSource === 'ai' ? 'sparkles' : 'check'} size={12} />
          {recommendSource === 'ai' ? 'AI Pick' : 'Smart Match'}
        </span>
      )}
      {room.within_budget && !room.ai_recommended && <span className="budget-badge">Within budget</span>}
      <h3>{room.property_name}</h3>
      <p className="meta">{room.name} · {room.valley} · up to {room.capacity} guests</p>
      <p>{room.vendor_name}</p>
      <div className="tag-row">
        {room.solo_safe && <span className="tag tag-safe">Solo safe</span>}
        {room.women_friendly && <span className="tag tag-women">Women-friendly</span>}
      </div>
      <strong>Rs. {room.price_per_night.toLocaleString()}/night</strong>
      <button type="button" className="expand-btn" onClick={toggleExpand}>
        {expanded ? 'Hide details ▲' : 'Amenities & details ▼'}
      </button>
      {expanded && (
        <div className="stay-expand-panel" onClick={(e) => e.stopPropagation()}>
          <ul className="amenity-icon-list">
            {room.amenities.map((a) => (
              <li key={a}>
                <AppIcon name={AMENITY_ICONS[a] || 'check'} size={14} className="amenity-icon-svg" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
