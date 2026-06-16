import { createServer } from 'node:http'
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  fetchUpstreamText,
  getLatestIssueDateFromText,
  isValidKl8Text,
  shouldAutoRefresh,
} from '../functions/_lotterySync.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const DIST_DIR = join(__dirname, '../dist')
const DATA_DIR = join(DIST_DIR, 'data')
const DATA_FILE = join(DATA_DIR, 'kl8.txt')
const META_FILE = join(DATA_DIR, '.kl8-meta.json')
const PORT = Number(process.env.PORT) || 4173

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}

function sendFile(res, filePath, extraHeaders = {}) {
  const ext = extname(filePath)
  const type = MIME_TYPES[ext] || 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache', ...extraHeaders })
  res.end(readFileSync(filePath))
}

function readMeta() {
  if (!existsSync(META_FILE)) return { updatedAt: 0 }
  try {
    return JSON.parse(readFileSync(META_FILE, 'utf8'))
  } catch {
    return { updatedAt: 0 }
  }
}

function writeMeta(updatedAt) {
  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(META_FILE, JSON.stringify({ updatedAt }), 'utf8')
}

function readStoredText() {
  if (!existsSync(DATA_FILE)) return null
  const text = readFileSync(DATA_FILE, 'utf8')
  return isValidKl8Text(text) ? text : null
}

function writeStoredText(text) {
  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(DATA_FILE, text, 'utf8')
}

async function syncLiveData(force = false) {
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

function resolveStaticPath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split('?')[0])
  const relative = cleanPath === '/' ? '/index.html' : cleanPath
  const filePath = join(DIST_DIR, relative)

  if (!filePath.startsWith(DIST_DIR)) return null
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) return null
  return filePath
}

createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || '/', `http://localhost:${PORT}`)
    const urlPath = requestUrl.pathname
    const force = requestUrl.searchParams.get('force') === '1'

    if (urlPath === '/api/kl8.txt' || urlPath.endsWith('/api/kl8.txt')) {
      const { text, refreshed } = await syncLiveData(force)
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Happy8-Refreshed': refreshed ? '1' : '0',
      })
      res.end(text)
      return
    }

    const filePath = resolveStaticPath(urlPath)
    if (filePath) {
      sendFile(res, filePath)
      return
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not Found')
  } catch (error) {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(error.message || 'Server Error')
  }
}).listen(PORT, () => {
  console.log(`静态服务已启动: http://localhost:${PORT}`)
  console.log('数据同步: /api/kl8.txt（按 21:10 规则更新 dist/data/kl8.txt）')
})
