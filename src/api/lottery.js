import bundledData from '../../public/data/kl8.txt?raw'
import { sortRecordsByIssue } from '../utils/sortRecords.js'

const REMOTE_URL = 'https://data.17500.cn/kl8_desc.txt'

function getLocalUrl() {
  const base = import.meta.env.BASE_URL || './'
  return `${base}data/kl8.txt`
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

function loadBundledData() {
  if (!isValidKl8Text(bundledData)) {
    throw new Error('内置开奖数据无效，请运行 npm run fetch-data')
  }
  return {
    records: parseKl8Text(bundledData),
    source: 'bundled',
    warning: '已使用内置开奖数据',
  }
}

/**
 * 优先远程拉取，其次本地文件，最后回退到打包内置数据
 */
export async function fetchLotteryData() {
  const errors = []

  try {
    const text = await fetchText(REMOTE_URL)
    return {
      records: parseKl8Text(text),
      source: 'remote',
    }
  } catch (remoteError) {
    errors.push(`远程: ${remoteError.message}`)
  }

  try {
    const text = await fetchText(getLocalUrl())
    return {
      records: parseKl8Text(text),
      source: 'local',
      warning: `远程数据不可用，已使用本地缓存（${errors.join('；')}）`,
    }
  } catch (localError) {
    errors.push(`本地: ${localError.message}`)
  }

  try {
    const bundled = loadBundledData()
    bundled.warning = `远程与本地均不可用，${bundled.warning}（${errors.join('；')}）`
    return bundled
  } catch (bundledError) {
    throw new Error(`无法获取开奖数据：${errors.join('；')}；内置数据：${bundledError.message}`)
  }
}
