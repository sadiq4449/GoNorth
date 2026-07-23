import AppIcon from './AppIcon'

export default function AiStatusBanner({ status, onRetry, retrying = false }) {
  if (!status) return null

  return (
    <div className={`ai-status-banner ai-status-banner--${status.tone}`} role="status">
      <div className="ai-status-banner-body">
        <strong>{status.title}</strong>
        <p>{status.message}</p>
      </div>
      {status.canRetry && onRetry && (
        <button type="button" className="ai-status-retry" onClick={onRetry} disabled={retrying}>
          {retrying ? 'Retrying…' : 'Try again'}
        </button>
      )}
    </div>
  )
}

export function PackageSourceBadge({ source, aiAvailable }) {
  const isAi = source === 'ai' && aiAvailable !== false
  return (
    <span className={`package-source-badge ${isAi ? 'package-source-badge--ai' : 'package-source-badge--smart'}`}>
      <AppIcon name={isAi ? 'sparkles' : 'check'} size={12} />
      {isAi ? 'Matched for you' : 'Best available match'}
    </span>
  )
}
