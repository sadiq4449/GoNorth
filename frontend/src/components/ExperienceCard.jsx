import { Link } from 'react-router-dom'

export function ExperienceCard({ experience, selected, onToggle }) {
  const unitLabel = experience.pricing_unit === 'flat' ? 'flat rate' : 'per person'
  return (
    <article className={`listing-card experience-card ${selected ? 'selected' : ''}`}>
      <div className="listing-card-head">
        <span className="listing-badge">{experience.category}</span>
        {experience.featured && <span className="listing-badge featured">Featured</span>}
      </div>
      <h3>{experience.name}</h3>
      <p className="listing-vendor">
        {experience.vendor_slug ? (
          <Link to={`/vendors/${experience.vendor_slug}`}>{experience.vendor_name}</Link>
        ) : (
          experience.vendor_name
        )}
      </p>
      <p className="listing-desc">{experience.description}</p>
      {experience.features?.length > 0 && (
        <ul className="listing-tags">
          {experience.features.slice(0, 4).map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
      <div className="listing-footer">
        <strong>PKR {experience.price.toLocaleString()}</strong>
        <span className="listing-meta">{unitLabel} · {experience.valley}</span>
      </div>
      {onToggle && (
        <button type="button" className={selected ? 'btn-secondary' : 'btn-primary btn-enabled'} onClick={() => onToggle(experience)}>
          {selected ? 'Remove' : 'Add to trip'}
        </button>
      )}
    </article>
  )
}
