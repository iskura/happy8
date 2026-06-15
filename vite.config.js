import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const liveProxy = {
  '/api/kl8.txt': {
    target: 'https://data.17500.cn',
    changeOrigin: true,
    rewrite: () => '/kl8_desc.txt',
  },
}

export default defineConfig({
  plugins: [vue()],
  base: './',
  assetsInclude: ['**/*.txt'],
  server: {
    proxy: liveProxy,
  },
  preview: {
    proxy: liveProxy,
  },
})
