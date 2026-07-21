export function RideCard({ vehicle, selected, disabled, onSelect }) {
  return (
    <article
      className={`listing-card selectable ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={() => !disabled && onSelect(vehicle)}
      onKeyDown={(e) => e.key === 'Enter' && !disabled && onSelect(vehicle)}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      {vehicle.featured && <span className="featured-badge">⭐ Featured</span>}
      {vehicle.ai_recommended && <span className="ai-badge">✨ AI Pick</span>}
      {!vehicle.terrain_compatible && <span className="warn-badge">Not for off-road</span>}
      <h3>{vehicle.model}</h3>
      <p className="meta">{vehicle.driver_name} · {vehicle.valley}</p>
      <p>{vehicle.vendor_name}</p>
      <div className="tag-row">
        {vehicle.is_4x4 && <span className="tag">4x4</span>}
        {vehicle.has_ac && <span className="tag">AC</span>}
        {vehicle.within_budget && <span className="tag">Budget OK</span>}
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
