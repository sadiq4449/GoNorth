import AppIcon from './AppIcon'

export default function AiResultCard({ recommendation, onClear }) {
  if (!recommendation) return null

  const sourceLabel = recommendation.source === 'ai' ? 'Matched for you' : 'Best available match'

  return (
    <div className="ai-result-card">
      <div className="ai-result-header">
        <h3 className="btn-with-icon">
          <AppIcon name="sparkles" size={18} />
          Your matched trip
        </h3>
        <span className={`source-badge ${recommendation.source}`}>{sourceLabel}</span>
      </div>
      <div className="ai-result-grid">
        <div>
          <span className="label">Stay</span>
          <strong>{recommendation.stayName}</strong>
        </div>
        <div>
          <span className="label">Transport</span>
          <strong>{recommendation.rideName}</strong>
        </div>
        <div>
          <span className="label">Destination</span>
          <strong>{recommendation.destination}</strong>
        </div>
        <div>
          <span className="label">Duration</span>
          <strong>{recommendation.nights} nights</strong>
        </div>
      </div>
      <p className="ai-reason">{recommendation.reason}</p>
      <button type="button" className="btn-secondary" onClick={onClear}>Clear</button>
    </div>
  )
}
