import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  fetchUpstreamText,
  getLatestIssueDateFromText,
  isValidKl8Text,
  shouldAutoRefresh,
} from '../functions/_lotterySync.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA_FILE = join(ROOT, 'public/data/kl8.txt')
const META_FILE = join(ROOT, 'public/data/.kl8-meta.json')

function readMeta() {
  if (!existsSync(META_FILE)) return { updatedAt: 0 }
  try {
    return JSON.parse(readFileSync(META_FILE, 'utf8'))
  } catch {
    return { updatedAt: 0 }
  }
}

function writeMeta(updatedAt) {
  mkdirSync(dirname(META_FILE), { recursive: true })
  writeFileSync(META_FILE, JSON.stringify({ updatedAt }), 'utf8')
}

function readStoredText() {
  if (!existsSync(DATA_FILE)) return null
  const text = readFileSync(DATA_FILE, 'utf8')
  return isValidKl8Text(text) ? text : null
}

function writeStoredText(text) {
  mkdirSync(dirname(DATA_FILE), { recursive: true })
  writeFileSync(DATA_FILE, text, 'utf8')
}

export async function syncLotteryDataLocal(force = false) {
  const text = readStoredText()
  const { updatedAt } = readMeta()
  const latestIssueDate = getLatestIssueDateFromText(text)
  const needRefresh = force || shouldAutoRefresh({ lastRefreshMs: updatedAt, latestIssueDate })

  if (!needRefresh) {
    if (!text) throw new Error('没有可用的开奖数据')
    return { text, refreshed: false }
  }

  const fresh = await fetchUpstreamText()
  const nextUpdatedAt = Date.now()
  writeStoredText(fresh)
  writeMeta(nextUpdatedAt)
  return { text: fresh, refreshed: true }
}

export function createLotterySyncMiddleware() {
  return async (req, res, next) => {
    const url = req.url?.split('?')[0] || ''
    if (!url.endsWith('/api/kl8.txt')) {
      next()
      return
    }

    const force = req.url.includes('force=1')

    try {
      const { text, refreshed } = await syncLotteryDataLocal(force)
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.setHeader('X-Happy8-Refreshed', refreshed ? '1' : '0')
      res.end(text)
    } catch (error) {
      res.statusCode = 502
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end(error.message || '数据同步失败')
    }
  }
}
