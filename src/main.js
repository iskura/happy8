import { createApp } from 'vue'
import AppShell from './AppShell.vue'
import router from './router/index.js'
import './styles/main.css'
import './styles/thyuu-header.css'

createApp(AppShell).use(router).mount('#app')
