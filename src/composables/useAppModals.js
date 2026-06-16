import { ref } from 'vue'
import { launchFireworks } from '../utils/fireworks.js'

const REST_REMIND_MS = 60 * 60 * 1000
const SESSION_START_KEY = 'happy8-session-start'
const REST_SHOWN_KEY = 'happy8-rest-shown'

const showRestReminder = ref(false)
let restReminderTimer = null

const showLoveModal = ref(false)
const loveModalShake = ref(false)
let loveShakeTimer = null

/** 休息提醒弹窗 — 全局单例，挂载于 AppLayout */
export function useRestReminder() {
  function getSessionStart() {
    const stored = sessionStorage.getItem(SESSION_START_KEY)
    if (stored) return Number(stored)
    const now = Date.now()
    sessionStorage.setItem(SESSION_START_KEY, String(now))
    return now
  }

  function openRestReminder() {
    if (sessionStorage.getItem(REST_SHOWN_KEY)) return
    showRestReminder.value = true
    sessionStorage.setItem(REST_SHOWN_KEY, '1')
  }

  function setupRestReminder() {
    if (restReminderTimer) return
    if (sessionStorage.getItem(REST_SHOWN_KEY)) return

    const remaining = REST_REMIND_MS - (Date.now() - getSessionStart())
    if (remaining <= 0) {
      openRestReminder()
      return
    }

    restReminderTimer = window.setTimeout(openRestReminder, remaining)
  }

  function dismissRestReminder() {
    showRestReminder.value = false
  }

  return {
    showRestReminder,
    setupRestReminder,
    dismissRestReminder,
  }
}

/** 爱心弹窗 — 全局单例，挂载于 AppLayout */
export function useLoveModal() {
  function setupLoveModal() {
    showLoveModal.value = true
  }

  function answerLove(choice) {
    if (choice === 'yes') {
      showLoveModal.value = false
      launchFireworks()
      return
    }

    showLoveModal.value = true
    loveModalShake.value = false
    window.requestAnimationFrame(() => {
      loveModalShake.value = true
      if (loveShakeTimer) window.clearTimeout(loveShakeTimer)
      loveShakeTimer = window.setTimeout(() => {
        loveModalShake.value = false
      }, 520)
    })
  }

  return {
    showLoveModal,
    loveModalShake,
    setupLoveModal,
    answerLove,
  }
}
