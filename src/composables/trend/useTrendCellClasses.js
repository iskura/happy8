import { computed, ref, watch } from 'vue'
import { getCellMarkClass } from '../../utils/chartMarks.js'
import { getOmissionLevel, getOmissionLayer } from '../../utils/charts/index.js'
import { isZoneBoundaryCol } from '../../utils/chartZone.js'
import { formatBall } from '../../utils/format.js'

export function useTrendStats(chart, ui) {
  const statMode = ref('page')

  watch(
    () => chart.value.id,
    () => {
      statMode.value = 'page'
    },
  )

  const activeStats = computed(() => {
    if (statMode.value === 'history' && chart.value.historyStats) {
      return chart.value.historyStats
    }
    return chart.value.stats
  })

  const statsRange = computed(() => {
    const offset = chart.value.statsColumnOffset ?? 0
    const count = chart.value.statsColumnCount ?? chart.value.columnCount - offset
    return { start: offset + 1, end: offset + count }
  })

  function statCellValue(statKey, colNum) {
    const { start, end } = statsRange.value
    if (colNum < start || colNum > end) return ''
    return activeStats.value?.[statKey]?.[colNum] ?? ''
  }

  const indicatorHelpItem = computed(() => {
    const help = chart.value.indicatorHelp
    if (!help || (Array.isArray(help) && !help.length)) return null
    return { key: 'indicator', help }
  })

  const statRows = computed(() => ui.value?.statRows || [])

  return {
    statMode,
    statRows,
    indicatorHelpItem,
    statCellValue,
  }
}

export function useTrendCellClasses(chart, marks, ui) {
  function cellClasses(cell, row) {
    const classes = [cell.cellClass].filter(Boolean)

    if (cell.type === 'hit') {
      classes.push('cell-hit')
      const heatmap = ui.value?.heatmap || chart.value.isHeatmap
      if (heatmap) classes.push(`heat-${Math.min(cell.num % 5, 4)}`)
    } else if (marks.value.omission !== false) {
      classes.push('cell-miss', `miss-${getOmissionLevel(cell.omission)}`)
      if (marks.value.omissionLayer) classes.push(`layer-${getOmissionLayer(cell.omission)}`)
    } else {
      classes.push('cell-hide-miss')
    }

    classes.push(...getCellMarkClass(cell, row.marks, marks.value))

    if (marks.value.zoneLine && isZoneBoundaryCol(cell.num, chart.value)) {
      classes.push('zone-line')
    }

    return classes
  }

  function displayHit(cell) {
    return cell.label ?? formatBall(cell.num)
  }

  function isSegmentLine(index) {
    return marks.value.segmentLine && index > 0 && index % 5 === 0
  }

  function formatIssueDate(row) {
    return {
      issue: row.issue,
      date: row.date.slice(5).replace('-', '/'),
      weekday: row.weekday,
    }
  }

  return {
    cellClasses,
    displayHit,
    isSegmentLine,
    formatIssueDate,
  }
}
