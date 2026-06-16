import { sortRecordsByIssue } from '../utils/sortRecords.js'
import {
  formatCacheTime,
  readLotteryCache,
  writeLotteryCache,
} from '../utils/lotteryCache.js'

export const UPSTREAM_URL = 'https://data.17500.cn/kl8_desc.txt'
export const LIVE_DATA_PROXY_PATH = 'api/kl8.txt'

function resolveUrl(path) {
  if (typeof window === 'undefined') {
    const base = import.meta.env.BASE_URL || './'
    return `${base}${path}`
  }
  return new URL(path, window.location.href).href
}

function getLocalUrl() {
  return resolveUrl('data/kl8.txt')
}

function getLiveDataUrl() {
  return resolveUrl(LIVE_DATA_PROXY_PATH)
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

async function fetchText(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`)
  }
  const text = await response.text()
  if (!isValidKl8Text(text)) {
    if (text.trim().startsWith('<')) {
      throw new Error('刷新失败：数据源返回了网页而非开奖文件，请通过 npm run dev 或 npm run serve 访问')
    }
    throw new Error('返回内容不是有效的开奖数据')
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

/**
 * 平时只读：浏览器缓存 > 站点 data/kl8.txt（不访问乐彩网）
 */
export async function loadLotteryDataLocalFirst() {
  const errors = []

  const cached = readLotteryCache()
  if (cached?.text && isValidKl8Text(cached.text)) {
    return buildResult(cached.text, 'cache', cached.updatedAt)
  }

  try {
    const text = await fetchText(getLocalUrl())
    return buildResult(text, 'bundled', 0)
  } catch (localError) {
    errors.push(`内置数据: ${localError.message}`)
  }

  throw new Error(
    `无法读取开奖数据：${errors.join('；')}。请检查网络后手动刷新，或运行 npm run serve / npm run dev 访问`,
  )
}

/** 手动刷新：强制拉取并更新服务器内置 txt */
export async function refreshLotteryDataFromUpstream() {
  if (isFileProtocol()) {
    throw new Error('直接打开本地 HTML 文件无法联网，请运行 npm run serve')
  }

  const text = await fetchText(`${getLiveDataUrl()}?force=1`)
  const saved = writeLotteryCache(text, 'upstream')
  return buildResult(text, 'upstream', saved.updatedAt)
}

/** 自动同步：服务端按 21:10 规则决定是否访问乐彩网 */
export async function syncLotteryDataFromServer() {
  if (isFileProtocol()) {
    throw new Error('直接打开本地 HTML 文件无法联网，请运行 npm run serve')
  }

  const text = await fetchText(getLiveDataUrl())
  const saved = writeLotteryCache(text, 'upstream')
  return buildResult(text, 'upstream', saved.updatedAt)
}

/** @deprecated 请使用 loadLotteryDataLocalFirst */
export async function fetchLotteryData() {
  return loadLotteryDataLocalFirst()
}
