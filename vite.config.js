import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const liveProxy = {
  '/api/kl8': {
    target: 'https://data.17500.cn',
    changeOrigin: true,
    rewrite: () => '/kl8_desc.txt',
  },
}

function cloudflarePagesWorker() {
  const workerSource = readFileSync(
    join(import.meta.dirname, 'scripts/cf-worker.js'),
    'utf8',
  )
  return {
    name: 'cloudflare-pages-worker',
    closeBundle() {
      writeFileSync(join(import.meta.dirname, 'dist/_worker.js'), workerSource)
    },
  }
}

export default defineConfig({
  plugins: [vue(), cloudflarePagesWorker()],
  base: './',
  server: { proxy: liveProxy },
  preview: { proxy: liveProxy },
})
