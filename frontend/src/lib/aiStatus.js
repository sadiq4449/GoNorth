/** Structured AI / fallback status from recommend & search APIs. */

export function packageStatus(pkg) {
  if (!pkg) return { kind: 'none' }
  if (pkg.source === 'ai' && pkg.ai_available !== false) {
    return { kind: 'ai', message: pkg.reason, label: 'AI Pick' }
  }
  return {
    kind: 'fallback',
    cause: pkg.fallback_cause || 'outage',
    message: pkg.user_message || pkg.reason,
    label: 'Smart Match',
  }
}

export function searchAiStatus(search) {
  if (!search?.ai_status) return null
  if (search.ai_status === 'ai') {
    return { tone: 'success', title: 'AI package ready', message: search.ai_package?.reason }
  }
  if (search.ai_status === 'fallback') {
    return {
      tone: 'info',
      title: 'Smart match applied',
      message: search.ai_message || 'We matched verified inventory for your trip.',
      canRetry: true,
    }
  }
  if (search.ai_status === 'unavailable') {
    return {
      tone: 'warn',
      title: 'Auto-build unavailable',
      message: search.ai_message || 'Select a stay and vehicle manually below.',
      canRetry: true,
    }
  }
  return null
}

export function recommendBadgeLabel(source, aiAvailable) {
  if (source === 'ai' && aiAvailable !== false) return 'AI Pick'
  return 'Smart Match'
}
