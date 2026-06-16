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
  referenceMs = Date.now(),
) {
  const schedule = new Date(referenceMs)
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

/** @returns {string} YYYY-MM-DD（本地时区） */
export function toLocalDateKey(input) {
  if (!input) return ''
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input
  }
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 从浏览器缓存的开奖文本读取最新一期日期 */
export function getLatestIssueDateFromCache() {
  const cached = readLotteryCache()
  if (!cached?.text) return null

  const line = cached.text.trim().split('\n').find((row) => row.trim())
  if (!line) return null

  const parts = line.trim().split(/\s+/)
  if (parts.length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(parts[1])) {
    return parts[1]
  }
  return null
}

/**
 * 是否应自动拉取最新开奖数据：
 * 1. 今天已过 21:10
 * 2. 今天 21:10 之后尚未刷新过（白天手动刷过也会再拉）
 * 3. 本地最新一期开奖日期不是今天（说明还没有当天开奖数据）
 */
export function shouldAutoRefresh(options = {}) {
  const {
    lastRefreshMs = getLastRefreshTime(),
    latestIssueDate = getLatestIssueDateFromCache(),
    hour = DEFAULT_REFRESH_HOUR,
    minute = DEFAULT_REFRESH_MINUTE,
    now = Date.now(),
  } = options

  const scheduleTime = getTodayScheduleTime(hour, minute, now)
  const todayKey = toLocalDateKey(now)

  if (now < scheduleTime) return false

  if (lastRefreshMs >= scheduleTime) return false

  const latestIssueKey = toLocalDateKey(latestIssueDate)
  if (latestIssueKey && latestIssueKey === todayKey) return false

  return true
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
