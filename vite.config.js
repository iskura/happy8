import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createLotterySyncMiddleware } from './scripts/lotteryDevMiddleware.mjs'

function lotterySyncPlugin() {
  return {
    name: 'lottery-sync',
    configureServer(server) {
      server.middlewares.use(createLotterySyncMiddleware())
    },
    configurePreviewServer(server) {
      server.middlewares.use(createLotterySyncMiddleware())
    },
  }
}

export default defineConfig({
  plugins: [vue(), lotterySyncPlugin()],
  base: './',
  assetsInclude: ['**/*.txt'],
})
