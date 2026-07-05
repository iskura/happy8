import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getCellMarkClass } from '../../utils/chartMarks.js'
import { getOmissionLayer } from '../../utils/charts/index.js'
import { buildCurrentOmissionStreak } from '../../utils/omissionLayer.js'
import { isZoneBoundaryCol } from '../../utils/chartZone.js'
import { formatBall } from '../../utils/format.js'
import { getClassNonOverlapNums } from '../../utils/classCompare.js'
import {
  C_CLASS_ROW_UPDATE_EVENT,
  loadCClassRowIndex,
  loadPredictionRows,
  PREDICTION_CHART_ID,
  PREDICTION_UPDATE_EVENT,
} from '../../utils/predictionStorage.js'

const DYNAMIC_STAT_KEYS = new Set(['classANonOverlap'])

export function useTrendStats(chart, ui) {
  const statMode = ref('page')
  const pickerResult = inject('pickerResult', null)
  const selectedPredIndex = ref(loadCClassRowIndex())
  const predictionRevision = ref(0)

  function bumpPredictionRevision() {
    predictionRevision.value += 1
  }

  function onPredictionUpdate() {
    bumpPredictionRevision()
  }

  function onCClassRowUpdate(event) {
    const index = Number(event.detail?.index)
    if (Number.isFinite(index) && index > 0) {
      selectedPredIndex.value = index
    } else {
      selectedPredIndex.value = loadCClassRowIndex()
    }
    bumpPredictionRevision()
  }

  onMounted(() => {
    window.addEventListener(PREDICTION_UPDATE_EVENT, onPredictionUpdate)
    window.addEventListener(C_CLASS_ROW_UPDATE_EVENT, onCClassRowUpdate)
  })

  onBeforeUnmount(() => {
    window.removeEventListener(PREDICTION_UPDATE_EVENT, onPredictionUpdate)
    window.removeEventListener(C_CLASS_ROW_UPDATE_EVENT, onCClassRowUpdate)
  })

  watch(
    () => chart.value.id,
    () => {
      statMode.value = 'page'
    },
  )

  const classANonOverlapSet = computed(() => {
    predictionRevision.value
    const result = pickerResult?.value
    if (!result?.classA) return new Set()

    const rows = loadPredictionRows(PREDICTION_CHART_ID)
    const row = rows?.[selectedPredIndex.value - 1]
    const numbers = getClassNonOverlapNums(result.classA, row?.numbers || [])
    return new Set(numbers)
  })

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

    if (statKey === 'classANonOverlap') {
      return classANonOverlapSet.value.has(colNum) ? formatBall(colNum) : ''
    }

    if (DYNAMIC_STAT_KEYS.has(statKey)) return ''

    return activeStats.value?.[statKey]?.[colNum] ?? ''
  }

  function statCellExtraClass(statKey, colNum) {
    if (statKey !== 'classANonOverlap') return ''
    return classANonOverlapSet.value.has(colNum) ? 'stat-class-a-compare' : ''
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
    statCellExtraClass,
  }
}

export function useTrendCellClasses(chart, marks, ui) {
  const omissionStreak = computed(() => buildCurrentOmissionStreak(chart.value.rows))
  const omissionLayerKeys = computed(() => omissionStreak.value.layerKeys)
  const currentOmissionByNum = computed(() => omissionStreak.value.omissionByNum)

  function shouldApplyOmissionLayer(cell, row) {
    if (cell.type !== 'miss') return false
    return omissionLayerKeys.value.has(`${row.issue}__${cell.num}`)
  }

  function cellClasses(cell, row) {
    const classes = [cell.cellClass].filter(Boolean)

    if (cell.type === 'hit') {
      classes.push('cell-hit')
      const heatmap = ui.value?.heatmap || chart.value.isHeatmap
      if (heatmap) classes.push(`heat-${Math.min(cell.num % 5, 4)}`)
    } else if (marks.value.omission !== false) {
      classes.push('cell-miss')
      if (marks.value.omissionLayer && shouldApplyOmissionLayer(cell, row)) {
        classes.push(`layer-${getOmissionLayer(cell.omission)}`)
      }
    } else {
      classes.push('cell-hide-miss')
      if (marks.value.omissionLayer && shouldApplyOmissionLayer(cell, row)) {
        classes.push(`layer-${getOmissionLayer(cell.omission)}`)
      }
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
    currentOmissionByNum,
  }
}
