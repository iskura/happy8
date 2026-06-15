import { onBeforeUnmount, onMounted } from 'vue'
import { shouldAutoRefresh } from '../utils/lotteryCache.js'

const CHECK_INTERVAL_MS = 60 * 1000

export function useLotteryAutoRefresh(onAutoRefresh) {
  let timer = null

  function check() {
    if (shouldAutoRefresh()) {
      onAutoRefresh()
    }
  }

  onMounted(() => {
    timer = window.setInterval(check, CHECK_INTERVAL_MS)
  })

  onBeforeUnmount(() => {
    if (timer) window.clearInterval(timer)
  })

  return { checkSchedule: check }
}
