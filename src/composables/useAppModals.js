import { onBeforeUnmount, ref } from 'vue'

const REST_REMIND_MS = 60 * 60 * 1000
const SESSION_START_KEY = 'happy8-session-start'
const REST_SHOWN_KEY = 'happy8-rest-shown'

/** 休息提醒弹窗逻辑 — 抽离自 App.vue */
export function useRestReminder() {
  const showRestReminder = ref(false)
  let restReminderTimer = null

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

  onBeforeUnmount(() => {
    if (restReminderTimer) window.clearTimeout(restReminderTimer)
  })

  return {
    showRestReminder,
    setupRestReminder,
    dismissRestReminder,
  }
}

/** 爱心弹窗逻辑 — 抽离自 App.vue */
export function useLoveModal() {
  const showLoveModal = ref(false)
  const loveModalShake = ref(false)
  let loveShakeTimer = null

  function setupLoveModal() {
    showLoveModal.value = true
  }

  function answerLove(choice) {
    if (choice === 'yes') {
      showLoveModal.value = false
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

  onBeforeUnmount(() => {
    if (loveShakeTimer) window.clearTimeout(loveShakeTimer)
  })

  return {
    showLoveModal,
    loveModalShake,
    setupLoveModal,
    answerLove,
  }
}
