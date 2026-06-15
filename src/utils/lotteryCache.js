export const CACHE_STORAGE_KEY = 'happy8-kl8-cache'
export const DEFAULT_REFRESH_HOUR = 21
export const DEFAULT_REFRESH_MINUTE = 10

export function getScheduleLabel(
  hour = DEFAULT_REFRESH_HOUR,
  minute = DEFAULT_REFRESH_MINUTE,
) {
  return `每日 ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function getTodayScheduleTime(
  hour = DEFAULT_REFRESH_HOUR,
  minute = DEFAULT_REFRESH_MINUTE,
) {
  const schedule = new Date()
  schedule.setHours(hour, minute, 0, 0)
  return schedule.getTime()
}

export function readLotteryCache() {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.text) return null
    return parsed
  } catch {
    return null
  }
}

export function writeLotteryCache(text, source = 'upstream') {
  const payload = {
    text,
    source,
    updatedAt: Date.now(),
  }
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(payload))
    return payload
  } catch {
    return payload
  }
}

export function getLastRefreshTime() {
  return readLotteryCache()?.updatedAt ?? 0
}

export function shouldAutoRefresh(
  lastRefreshMs = getLastRefreshTime(),
  hour = DEFAULT_REFRESH_HOUR,
  minute = DEFAULT_REFRESH_MINUTE,
) {
  const now = Date.now()
  const scheduleTime = getTodayScheduleTime(hour, minute)
  if (now < scheduleTime) return false
  return !lastRefreshMs || lastRefreshMs < scheduleTime
}

export function formatCacheTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}
