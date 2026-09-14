// Offline support helpers.
//
// Important honesty check: the AI chat itself CANNOT work offline - it needs
// to call the Gemini API over the internet. So "offline mode" here means:
// 1. Cache the scheme list locally so it can still be browsed with no internet.
// 2. Detect when the connection drops/returns and show the user clearly.
// 3. Gracefully disable chat input while offline instead of showing confusing
//    errors, and let them resume seamlessly once back online.

const CACHE_KEY = 'yojana_mitra_schemes_cache'
const CACHE_TIMESTAMP_KEY = 'yojana_mitra_schemes_cache_time'

export function saveSchemesToCache(schemes) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(schemes))
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
  } catch (e) {
    // localStorage can fail (private browsing, storage full) - not critical,
    // just means offline fallback won't be available this session.
    console.warn('Could not cache schemes locally:', e)
  }
}

export function getSchemesFromCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

export function getCacheAge() {
  const ts = localStorage.getItem(CACHE_TIMESTAMP_KEY)
  if (!ts) return null
  const minutesAgo = Math.round((Date.now() - parseInt(ts, 10)) / 60000)
  return minutesAgo
}

// Subscribes to browser online/offline events. Returns an unsubscribe function.
export function subscribeToConnectionStatus(onChange) {
  function handleOnline() {
    onChange(true)
  }
  function handleOffline() {
    onChange(false)
  }
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

export function isCurrentlyOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}
