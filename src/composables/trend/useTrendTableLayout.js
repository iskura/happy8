import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export function useTrendTableLayout({
  tableWrapRef,
  bodyScrollRef,
  columnHeaders,
  chart,
  freeze,
  issueColWidth,
  ui,
}) {
  const scrollGutter = ref(0)
  let bodyResizeObserver = null

  function updateScrollGutter() {
    const el = bodyScrollRef.value
    if (!el) {
      scrollGutter.value = 0
      return
    }
    scrollGutter.value = Math.max(0, el.offsetWidth - el.clientWidth)
  }

  function syncTableLayout() {
    updateScrollGutter()

    const wrap = tableWrapRef.value
    const bodyEl = bodyScrollRef.value
    if (!wrap || !bodyEl) return

    const count = columnHeaders.value.length
    if (!count) return

    const threshold = ui.value?.narrowColumnsThreshold ?? 10
    const minNumW =
      chart.value.columnCount <= threshold
        ? (ui.value?.narrowColWidth ?? 36)
        : (ui.value?.defaultColWidth ?? 22)
    const tableWidth = bodyEl.clientWidth
    const numColW = Math.max(minNumW, (tableWidth - issueColWidth) / count)

    wrap.style.setProperty('--num-col-w', `${numColW}px`)
  }

  watch(
    () => [
      chart.value.rows?.length,
      freeze.value.head,
      freeze.value.pred,
      freeze.value.stats,
      chart.value.columnCount,
    ],
    () => nextTick(syncTableLayout),
  )

  onMounted(() => {
    nextTick(() => {
      syncTableLayout()
      if (typeof ResizeObserver !== 'undefined' && bodyScrollRef.value) {
        bodyResizeObserver = new ResizeObserver(() => syncTableLayout())
        bodyResizeObserver.observe(bodyScrollRef.value)
      }
    })
    window.addEventListener('resize', syncTableLayout)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', syncTableLayout)
    bodyResizeObserver?.disconnect()
  })

  return { scrollGutter, syncTableLayout }
}
