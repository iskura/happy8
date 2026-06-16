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

/** 两个日期之间相差的自然日数（按日历日，非 48 小时、非仅 dd 相减） */
export function getCalendarDayGap(latestDateKey, todayDateKey) {
  const latest = toLocalDateKey(latestDateKey)
  const today = toLocalDateKey(todayDateKey)
  if (!latest || !today) return 0

  const latestMs = new Date(`${latest}T12:00:00`).getTime()
  const todayMs = new Date(`${today}T12:00:00`).getTime()
  if (Number.isNaN(latestMs) || Number.isNaN(todayMs)) return 0

  return Math.round((todayMs - latestMs) / 86_400_000)
}

/**
 * 进入页面时是否应自动拉取最新开奖数据（手动刷新不受此限制）：
 *
 * 1. 已过今天 21:10：本地最新一期日期不是今天
 * 2. 未到今天 21:10：本地最新一期与今天相差的自然日 >= 2
 */
export function shouldAutoRefresh(options = {}) {
  const {
    latestIssueDate = getLatestIssueDateFromCache(),
    hour = DEFAULT_REFRESH_HOUR,
    minute = DEFAULT_REFRESH_MINUTE,
    now = Date.now(),
  } = options

  const todayKey = toLocalDateKey(now)
  const latestIssueKey = toLocalDateKey(latestIssueDate)
  if (!latestIssueKey) return false

  const scheduleTime = getTodayScheduleTime(hour, minute, now)
  const afterSchedule = now >= scheduleTime

  if (afterSchedule) {
    return latestIssueKey !== todayKey
  }

  return getCalendarDayGap(latestIssueKey, todayKey) >= 2
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
