import AppIcon from './AppIcon'

export function GuideCard({ guide, selected, onToggle }) {
  return (
    <article
      className={`listing-card selectable ${selected ? 'selected' : ''}`}
      onClick={() => onToggle(guide)}
      onKeyDown={(e) => e.key === 'Enter' && onToggle(guide)}
      role="button"
      tabIndex={0}
    >
      {guide.ai_recommended && (
        <span className="ai-badge">
          <AppIcon name="sparkles" size={12} /> AI Pick
        </span>
      )}
      <h3>{guide.name}</h3>
      <p className="meta">{guide.specialty} · {guide.valley}</p>
      <p>{guide.vendor_name}</p>
      <strong>Rs. {guide.daily_rate.toLocaleString()}/day</strong>
    </article>
  )
}
