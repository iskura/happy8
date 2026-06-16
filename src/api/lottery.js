import { sortRecordsByIssue } from '../utils/sortRecords.js'
import {
  formatCacheTime,
  readLotteryCache,
  writeLotteryCache,
} from '../utils/lotteryCache.js'

export const UPSTREAM_URL = 'https://data.17500.cn/kl8_desc.txt'
export const LIVE_DATA_API_PATH = '/api/kl8'

function getApiBasePath() {
  const base = import.meta.env.BASE_URL || '/'
  if (base === './' || base === '.' || base === '/') return ''
  return base.replace(/\/$/, '')
}

function getLiveDataUrl(force = false) {
  const query = force ? '?force=1' : ''
  const apiPath = `${getApiBasePath()}${LIVE_DATA_API_PATH}${query}`
  if (typeof window === 'undefined') {
    return apiPath
  }
  return `${window.location.origin}${apiPath}`
}

function isFileProtocol() {
  return typeof window !== 'undefined' && window.location.protocol === 'file:'
}

/**
 * 解析乐彩网 kl8_desc.txt 单行数据
 * 格式: 期号 日期 20个开奖号 ...
 */
export function parseKl8Text(text) {
  const records = []

  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const parts = trimmed.split(/\s+/)
    if (parts.length < 22) continue

    const issue = parts[0]
    const date = parts[1]
    if (!/^\d{7}$/.test(issue) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue

    const numbers = parts
      .slice(2, 22)
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => value >= 1 && value <= 80)

    if (numbers.length !== 20) continue

    records.push({
      issue,
      date,
      numbers: numbers.sort((a, b) => a - b),
    })
  }

  return sortRecordsByIssue(records, 'desc')
}

function isValidKl8Text(text) {
  if (!text) return false
  const trimmed = text.trim()
  if (trimmed.startsWith('<!') || trimmed.startsWith('<html') || trimmed.includes('<html')) {
    return false
  }
  return parseKl8Text(text).length >= 11
}

function buildFetchError(status) {
  if (status === 404) {
    return new Error('刷新失败：接口不可用')
  }
  return new Error(`刷新失败（${status}）`)
}

async function fetchText(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw buildFetchError(response.status)
  }
  const text = await response.text()
  if (!isValidKl8Text(text)) {
    if (text.trim().startsWith('<')) {
      throw new Error('刷新失败：接口返回异常')
    }
    throw new Error('刷新失败：数据格式无效')
  }
  return text
}

function buildResult(text, source, updatedAt) {
  return {
    records: parseKl8Text(text),
    source,
    updatedAt,
    updatedAtText: formatCacheTime(updatedAt),
  }
}

async function fetchAndCacheLiveData(force = false) {
  if (isFileProtocol()) {
    throw new Error('请使用 npm run dev 启动')
  }

  const text = await fetchText(getLiveDataUrl(force))
  const saved = writeLotteryCache(text, 'upstream')
  return buildResult(text, 'upstream', saved.updatedAt)
}

/**
 * 优先读 localStorage；无缓存时再请求接口并写入本地
 */
export async function loadLotteryDataLocalFirst() {
  const cached = readLotteryCache()
  if (cached?.text && isValidKl8Text(cached.text)) {
    return buildResult(cached.text, 'cache', cached.updatedAt)
  }

  return fetchAndCacheLiveData(true)
}

/** 手动刷新：强制拉取最新数据并写入 localStorage */
export async function refreshLotteryDataFromUpstream() {
  return fetchAndCacheLiveData(true)
}

/** @deprecated 请使用 loadLotteryDataLocalFirst */
export async function fetchLotteryData() {
  return loadLotteryDataLocalFirst()
}
