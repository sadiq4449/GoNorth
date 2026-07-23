/** Structured AI / fallback status from recommend & search APIs. */

export function packageStatus(pkg) {
  if (!pkg) return { kind: 'none' }
  if (pkg.source === 'ai' && pkg.ai_available !== false) {
    return { kind: 'ai', message: pkg.reason, label: 'Matched for you' }
  }
  return {
    kind: 'fallback',
    cause: pkg.fallback_cause || 'outage',
    message: pkg.user_message || pkg.reason,
    label: 'Best available match',
  }
}

export function searchAiStatus(search) {
  if (!search?.ai_status) return null
  if (search.ai_status === 'ai') {
    return { tone: 'success', title: 'Your trip is ready', message: search.ai_package?.reason }
  }
  if (search.ai_status === 'fallback') {
    return {
      tone: 'info',
      title: 'We matched verified inventory',
      message: search.ai_message || 'Based on your budget and route, here are the best available options.',
      canRetry: true,
    }
  }
  if (search.ai_status === 'unavailable') {
    return {
      tone: 'warn',
      title: 'Auto-build isn’t available right now',
      message: search.ai_message || 'Choose your stay and vehicle below — pricing updates instantly.',
      canRetry: true,
    }
  }
  return null
}

export function recommendBadgeLabel(source, aiAvailable) {
  if (source === 'ai' && aiAvailable !== false) return 'Matched for you'
  return 'Best available match'
}
