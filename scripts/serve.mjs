import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const DIST_DIR = join(__dirname, '../dist')
const UPSTREAM_URL = 'https://data.17500.cn/kl8_desc.txt'
const PORT = Number(process.env.PORT || process.argv[2]) || 4173

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}

function sendFile(res, filePath) {
  const ext = extname(filePath)
  const type = MIME_TYPES[ext] || 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' })
  res.end(readFileSync(filePath))
}

async function proxyLiveData(res) {
  const upstream = await fetch(UPSTREAM_URL)
  if (!upstream.ok) {
    res.writeHead(upstream.status, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(`上游数据拉取失败: ${upstream.status}`)
    return
  }

  const text = await upstream.text()
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(text)
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
    const urlPath = new URL(req.url || '/', `http://localhost:${PORT}`).pathname

    if (urlPath === '/api/kl8' || urlPath === '/api/kl8.txt') {
      await proxyLiveData(res)
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
  console.log('数据代理: /api/kl8 -> 乐彩网')
})
