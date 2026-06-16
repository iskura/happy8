import { onBeforeUnmount, onMounted, ref } from 'vue'

/** 全屏切换 — 抽离自 ChartSection */
export function useFullscreen(elementRef) {
  const isFullscreen = ref(false)

  function onFullscreenChange() {
    isFullscreen.value = document.fullscreenElement === elementRef.value
  }

  async function toggleFullscreen() {
    const el = elementRef.value
    if (!el) return

    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen()
      } else {
        await el.requestFullscreen()
      }
    } catch {
      // 浏览器可能拒绝全屏
    }
  }

  onMounted(() => {
    document.addEventListener('fullscreenchange', onFullscreenChange)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('fullscreenchange', onFullscreenChange)
  })

  return { isFullscreen, toggleFullscreen }
}
