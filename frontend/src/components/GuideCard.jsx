import AppIcon from './AppIcon'

export function GuideCard({ guide, selected, onToggle, recommendSource }) {
  return (
    <article
      className={`listing-card selectable ${selected ? 'selected' : ''}`}
      onClick={() => onToggle(guide)}
      onKeyDown={(e) => e.key === 'Enter' && onToggle(guide)}
      role="button"
      tabIndex={0}
    >
      {guide.ai_recommended && (
        <span className={recommendSource === 'ai' ? 'ai-badge' : 'smart-badge'}>
          <AppIcon name={recommendSource === 'ai' ? 'sparkles' : 'check'} size={12} />
          {recommendSource === 'ai' ? 'Matched for you' : 'Best available match'}
        </span>
      )}
      <h3>{guide.name}</h3>
      <p className="meta">{guide.specialty} · {guide.valley}</p>
      <p>{guide.vendor_name}</p>
      <strong>Rs. {guide.daily_rate.toLocaleString()}/day</strong>
    </article>
  )
}
