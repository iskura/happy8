export const UPSTREAM_URL = 'https://data.17500.cn/kl8_desc.txt'
export const KV_TEXT_KEY = 'kl8:text'
export const KV_META_KEY = 'kl8:meta'
export const DEFAULT_REFRESH_HOUR = 21
export const DEFAULT_REFRESH_MINUTE = 10

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

export function getTodayScheduleTime(
  hour = DEFAULT_REFRESH_HOUR,
  minute = DEFAULT_REFRESH_MINUTE,
  referenceMs = Date.now(),
) {
  const schedule = new Date(referenceMs)
  schedule.setHours(hour, minute, 0, 0)
  return schedule.getTime()
}

export function getLatestIssueDateFromText(text) {
  if (!text) return null
  const line = text.trim().split('\n').find((row) => row.trim())
  if (!line) return null
  const parts = line.trim().split(/\s+/)
  if (parts.length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(parts[1])) {
    return parts[1]
  }
  return null
}

export function isValidKl8Text(text) {
  if (!text) return false
  const trimmed = text.trim()
  if (trimmed.startsWith('<!') || trimmed.startsWith('<html') || trimmed.includes('<html')) {
    return false
  }
  const line = trimmed.split('\n').find((row) => row.trim())
  if (!line) return false
  const parts = line.trim().split(/\s+/)
  return parts.length >= 22 && /^\d{7}$/.test(parts[0]) && /^\d{4}-\d{2}-\d{2}$/.test(parts[1])
}

/**
 * 1. 今天已过 21:10
 * 2. 今天 21:10 之后尚未刷新过
 * 3. 最新一期开奖日期不是今天
 */
export function shouldAutoRefresh(options = {}) {
  const {
    lastRefreshMs = 0,
    latestIssueDate = null,
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

export async function fetchUpstreamText() {
  const upstream = await fetch(UPSTREAM_URL, {
    headers: { 'User-Agent': 'happy8-lottery-sync' },
  })
  if (!upstream.ok) {
    throw new Error(`上游数据拉取失败: ${upstream.status}`)
  }
  const text = await upstream.text()
  if (!isValidKl8Text(text)) {
    throw new Error('上游返回内容不是有效的开奖数据')
  }
  return text
}

export async function readKvMeta(kv) {
  if (!kv) return { text: null, updatedAt: 0 }
  const text = await kv.get(KV_TEXT_KEY)
  const rawMeta = await kv.get(KV_META_KEY)
  let updatedAt = 0
  if (rawMeta) {
    try {
      updatedAt = JSON.parse(rawMeta).updatedAt || 0
    } catch {
      updatedAt = 0
    }
  }
  return { text, updatedAt }
}

export async function writeKvMeta(kv, text) {
  const updatedAt = Date.now()
  await kv.put(KV_TEXT_KEY, text)
  await kv.put(KV_META_KEY, JSON.stringify({ updatedAt }))
  return updatedAt
}

export async function readBundledText(env, request) {
  if (!env?.ASSETS) return null
  const assetUrl = new URL('/data/kl8.txt', request.url)
  const asset = await env.ASSETS.fetch(assetUrl)
  if (!asset.ok) return null
  const text = await asset.text()
  return isValidKl8Text(text) ? text : null
}

export async function readStoredLottery(env, request) {
  const kv = env?.LOTTERY_KV
  const { text: kvText, updatedAt } = await readKvMeta(kv)
  if (kvText && isValidKl8Text(kvText)) {
    return { text: kvText, updatedAt, source: 'kv' }
  }

  const bundled = await readBundledText(env, request)
  if (bundled) {
    return { text: bundled, updatedAt: 0, source: 'bundled' }
  }

  return { text: null, updatedAt: 0, source: 'none' }
}

export async function syncLotteryData(env, request, { force = false } = {}) {
  const stored = await readStoredLottery(env, request)
  if (!stored.text && !force) {
    throw new Error('没有可用的开奖数据')
  }

  const latestIssueDate = getLatestIssueDateFromText(stored.text)
  const needRefresh = force || shouldAutoRefresh({
    lastRefreshMs: stored.updatedAt,
    latestIssueDate,
  })

  if (!needRefresh) {
    return { ...stored, refreshed: false }
  }

  const text = await fetchUpstreamText()
  let updatedAt = Date.now()

  if (env?.LOTTERY_KV) {
    updatedAt = await writeKvMeta(env.LOTTERY_KV, text)
  }

  return { text, updatedAt, source: env?.LOTTERY_KV ? 'kv' : 'upstream', refreshed: true }
}
