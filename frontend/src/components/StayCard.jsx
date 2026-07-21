import { useState } from 'react'

const AMENITY_ICONS = {
  WiFi: '📶',
  'Hot Shower': '🚿',
  Breakfast: '🍳',
  'Mountain View': '🏔️',
  'K2 View': '⛰️',
  Garden: '🌿',
  Pool: '🏊',
  'Fine Dine': '🍽️',
  Boating: '🚣',
  Heritage: '🏛️',
  'Valley View': '🌄',
}

function amenityIcon(name) {
  return AMENITY_ICONS[name] || '✓'
}

export function StayCard({ room, selected, onSelect }) {
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
      {room.featured && <span className="featured-badge">⭐ Featured</span>}
      {room.ai_recommended && <span className="ai-badge">✨ AI Pick</span>}
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
                <span className="amenity-icon" aria-hidden>{amenityIcon(a)}</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
