import { sortRecordsByIssue } from '../utils/sortRecords.js'

const UPSTREAM_URL = 'https://data.17500.cn/kl8_desc.txt'

function resolveUrl(path) {
  if (typeof window === 'undefined') {
    const base = import.meta.env.BASE_URL || './'
    return `${base}${path}`
  }
  return new URL(path, window.location.href).href
}

function getLiveUrl() {
  return resolveUrl('api/kl8.txt')
}

function getLocalUrl() {
  return resolveUrl('data/kl8.txt')
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
  if (!text || text.trim().startsWith('<!')) return false
  return parseKl8Text(text).length >= 11
}

async function fetchText(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`)
  }
  const text = await response.text()
  if (!isValidKl8Text(text)) {
    throw new Error('返回内容不是有效的开奖数据')
  }
  return text
}

/**
 * 优先通过同源代理实时拉取，失败时回退到 data/kl8.txt 离线缓存
 */
export async function fetchLotteryData() {
  const errors = []

  if (!isFileProtocol()) {
    try {
      const text = await fetchText(getLiveUrl())
      return {
        records: parseKl8Text(text),
        source: 'remote',
      }
    } catch (liveError) {
      errors.push(`实时: ${liveError.message}`)
    }
  } else {
    errors.push('实时: 直接打开本地 HTML 文件无法联网拉取，请运行 npm run serve')
  }

  try {
    const text = await fetchText(getLocalUrl())
    return {
      records: parseKl8Text(text),
      source: 'local',
      warning: isFileProtocol()
        ? '当前为离线打开，已使用本地缓存数据。如需最新数据请运行 npm run serve'
        : `实时数据不可用，已使用本地缓存（${errors.join('；')}）`,
    }
  } catch (localError) {
    errors.push(`缓存: ${localError.message}`)
  }

  throw new Error(
    `无法获取开奖数据：${errors.join('；')}。请确认已启动带代理的服务（npm run dev 或 npm run serve），或运行 npm run fetch-data 更新缓存`,
  )
}

export { UPSTREAM_URL }
