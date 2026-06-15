import { computed } from 'vue'
import { formatBall } from '../../utils/format.js'
import { ISSUE_COL_WIDTH } from '../../config/trendTableDefaults.js'

export function useTrendTableColumns(chart, ui) {
  const columnHeaders = computed(() => {
    if (chart.value.headers?.length) return chart.value.headers
    return Array.from({ length: chart.value.columnCount || 80 }, (_, i) =>
      formatBall(i + 1),
    )
  })

  const columnNumbers = computed(() =>
    Array.from({ length: columnHeaders.value.length }, (_, i) => i + 1),
  )

  const headerGroups = computed(() => chart.value.headerGroups || [])

  const wrapStyle = computed(() => {
    const count = columnHeaders.value.length
    const threshold = ui.value?.narrowColumnsThreshold ?? 10
    const numWidth =
      chart.value.columnCount <= threshold
        ? (ui.value?.narrowColWidth ?? 36)
        : (ui.value?.defaultColWidth ?? 22)
    return {
      '--col-count': count,
      '--issue-w': `${ISSUE_COL_WIDTH}px`,
      '--num-col-w': `${numWidth}px`,
      '--table-min-width': `calc(var(--issue-w) + ${count} * var(--num-col-w))`,
    }
  })

  return {
    columnHeaders,
    columnNumbers,
    headerGroups,
    wrapStyle,
    issueColWidth: ISSUE_COL_WIDTH,
  }
}
