/** Shared helpers for Super Admin pages — consistent load/error handling. */

export function loadAdminData(fetcher, setData, setError) {
  if (setError) setError('')
  return fetcher()
    .then(setData)
    .catch((e) => {
      if (setError) setError(e.message || 'Failed to load data')
      return null
    })
}

export async function runAdminMutation({ action, setError, setMsg, successMsg, onSuccess }) {
  if (setError) setError('')
  try {
    const result = await action()
    if (successMsg && setMsg) setMsg(successMsg)
    if (onSuccess) await onSuccess(result)
    return result
  } catch (e) {
    if (setError) setError(e.message || 'Action failed')
    return null
  }
}

export function resolveDocUrl(apiBase, url) {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  return `${apiBase}${url}`
}
