import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { cloudflare } from "@cloudflare/vite-plugin";

const liveProxy = {
  '/api/kl8': {
    target: 'https://data.17500.cn',
    changeOrigin: true,
    rewrite: () => '/kl8_desc.txt',
  },
}

export default defineConfig({
  plugins: [vue(), cloudflare()],
  base: './',
  server: {
    proxy: liveProxy,
  },
  preview: {
    proxy: liveProxy,
  },
})