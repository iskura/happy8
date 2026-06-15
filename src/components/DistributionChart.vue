<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { formatBall, copyText } from '../utils/format.js'
import { getCellMarkClass } from '../utils/chartMarks.js'
import { getOmissionLevel, getOmissionLayer } from '../utils/charts/index.js'
import { isZoneBoundaryCol } from '../utils/chartZone.js'
import {
  createPredictionRow,
  loadPredictionRows,
  loadActivePredictionRowId,
  savePredictionRows,
} from '../utils/predictionStorage.js'
import CopyButton from './CopyButton.vue'
import TrendChartHead from './trend/TrendChartHead.vue'
import TrendChartPrediction from './trend/TrendChartPrediction.vue'
import TrendChartStats from './trend/TrendChartStats.vue'
import './trend/trend-table.css'

const ISSUE_COL_WIDTH = 120

const props = defineProps({
  chart: {
    type: Object,
    required: true,
  },
  marks: {
    type: Object,
    default: () => ({}),
  },
  rowOrder: {
    type: String,
    default: 'asc',
  },
})

const emit = defineEmits(['update:rowOrder'])

const columnHeaders = computed(() => {
  if (props.chart.headers?.length) return props.chart.headers
  return Array.from({ length: props.chart.columnCount || 80 }, (_, i) => formatBall(i + 1))
})

const columnNumbers = computed(() =>
  Array.from({ length: columnHeaders.value.length }, (_, i) => i + 1),
)

const headerGroups = computed(() => props.chart.headerGroups || [])

const wrapStyle = computed(() => {
  const count = columnHeaders.value.length
  const numWidth = props.chart.columnCount <= 10 ? 36 : 22
  return {
    '--col-count': count,
    '--issue-w': `${ISSUE_COL_WIDTH}px`,
    '--num-col-w': `${numWidth}px`,
    '--table-min-width': `calc(var(--issue-w) + ${count} * var(--num-col-w))`,
  }
})

const bodyScrollRef = ref(null)
const tableWrapRef = ref(null)
const scrollGutter = ref(0)
let bodyResizeObserver = null

function setRowOrder(order) {
  emit('update:rowOrder', order)
}

const FREEZE_STORAGE_KEY = 'happy8-chart-freeze'

function loadFreezeState() {
  try {
    const raw = localStorage.getItem(FREEZE_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const freeze = ref({
  head: true,
  pred: true,
  stats: true,
  ...loadFreezeState(),
})

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

  const issueW = ISSUE_COL_WIDTH
  const minNumW = props.chart.columnCount <= 10 ? 36 : 22
  const tableWidth = bodyEl.clientWidth
  const numColW = Math.max(minNumW, (tableWidth - issueW) / count)

  wrap.style.setProperty('--num-col-w', `${numColW}px`)
}

watch(
  () => [props.chart.rows?.length, freeze.value.head, freeze.value.pred, freeze.value.stats, props.chart.columnCount],
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
  window.addEventListener('resize', hideStatTip)
  window.addEventListener('scroll', hideStatTip, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncTableLayout)
  window.removeEventListener('resize', hideStatTip)
  window.removeEventListener('scroll', hideStatTip, true)
  bodyResizeObserver?.disconnect()
})

watch(
  freeze,
  (value) => {
    try {
      localStorage.setItem(FREEZE_STORAGE_KEY, JSON.stringify(value))
    } catch {
      // ignore
    }
  },
  { deep: true },
)

function toggleFreeze(key) {
  freeze.value[key] = !freeze.value[key]
}

const issueColMode = ref('issue')
const statTip = ref(null)
const statTipRef = ref(null)

function showStatTip(event, stat) {
  const rect = event.currentTarget.getBoundingClientRect()
  const anchorX = rect.left + rect.width / 2
  const text = Array.isArray(stat.help) ? stat.help.join('\n') : stat.help
  statTip.value = {
    key: stat.key,
    text,
    anchorX,
    x: anchorX,
    y: rect.top,
    anchorBottom: rect.bottom,
    placement: 'top',
    arrowOffset: 0,
  }
  nextTick(adjustStatTipPosition)
}

function adjustStatTipPosition() {
  const el = statTipRef.value
  if (!el || !statTip.value) return

  const margin = 10
  const gap = 8
  const vw = window.innerWidth
  const vh = window.innerHeight
  const tipRect = el.getBoundingClientRect()

  const anchorX = statTip.value.anchorX
  let { x, y, anchorBottom } = statTip.value
  let placement = 'top'

  const halfW = tipRect.width / 2
  if (x - halfW < margin) x = margin + halfW
  if (x + halfW > vw - margin) x = vw - margin - halfW

  const spaceAbove = y - margin
  const spaceBelow = vh - anchorBottom - margin
  const needH = tipRect.height + gap

  if (spaceAbove < needH && spaceBelow >= needH) {
    placement = 'bottom'
    y = anchorBottom
  } else if (spaceAbove < needH && spaceBelow < needH) {
    placement = 'top'
    y = Math.max(margin + needH, y)
  }

  const maxArrowOffset = Math.max(0, halfW - 10)
  const arrowOffset = Math.max(
    -maxArrowOffset,
    Math.min(maxArrowOffset, anchorX - x),
  )

  statTip.value = { ...statTip.value, x, y, placement, arrowOffset }
}

function hideStatTip() {
  statTip.value = null
}

const statMode = ref('page')

const activeStats = computed(() => {
  if (statMode.value === 'history' && props.chart.historyStats) {
    return props.chart.historyStats
  }
  return props.chart.stats
})

const statsRange = computed(() => {
  const offset = props.chart.statsColumnOffset ?? 0
  const count = props.chart.statsColumnCount ?? props.chart.columnCount - offset
  return { start: offset + 1, end: offset + count }
})

function statCellValue(statKey, colNum) {
  const { start, end } = statsRange.value
  if (colNum < start || colNum > end) return ''
  return activeStats.value?.[statKey]?.[colNum] ?? ''
}

const indicatorHelpItem = computed(() => {
  const help = props.chart.indicatorHelp
  if (!help || (Array.isArray(help) && !help.length)) return null
  return { key: 'indicator', help }
})

const statRows = computed(() => [
  {
    key: 'appearCount',
    label: '出现次数',
    help: '统计期数内实际出现的次数。',
  },
  {
    key: 'avgOmission',
    label: '平均遗漏',
    help: '统计期数内遗漏的平均值（除不尽四舍五入取整）。计算公式：平均遗漏 = 每次遗漏期数之和 / 出现次数。',
  },
  {
    key: 'maxOmission',
    label: '最大遗漏',
    help: '统计期数内遗漏的最大值。',
  },
  {
    key: 'maxConsecutive',
    label: '最大连出',
    help: '统计期数内连续开出的最大值。',
  },
  {
    key: 'desireRatio',
    label: '欲出几率',
    help: '当前遗漏 / 平均遗漏（除不尽四舍五入取整）。',
  },
])

watch(
  () => props.chart.id,
  () => {
    statMode.value = 'page'
  },
)

const predictionRows = ref([createPredictionRow()])
const activeRowId = ref('')
const copiedKey = ref('')

function initPredictionRows(chartId) {
  const saved = loadPredictionRows(chartId)
  predictionRows.value = saved?.length ? saved : [createPredictionRow()]
  const savedActive = loadActivePredictionRowId(chartId)
  const hasActive = predictionRows.value.some((row) => row.id === savedActive)
  activeRowId.value = hasActive ? savedActive : predictionRows.value[0]?.id || ''
}

watch(
  () => props.chart.id,
  (chartId) => {
    if (chartId) initPredictionRows(chartId)
  },
  { immediate: true },
)

watch(
  [predictionRows, activeRowId],
  () => {
    if (props.chart.id) {
      savePredictionRows(props.chart.id, predictionRows.value, activeRowId.value)
    }
  },
  { deep: true },
)

function selectPredictionRow(rowId) {
  activeRowId.value = rowId
}

function addPredictionRowBelow(rowIndex) {
  const newRow = createPredictionRow()
  const next = [...predictionRows.value]
  next.splice(rowIndex + 1, 0, newRow)
  predictionRows.value = next
  activeRowId.value = newRow.id
}

function removePredictionRow(rowIndex) {
  const removed = predictionRows.value[rowIndex]
  if (predictionRows.value.length <= 1) {
    const emptyRow = createPredictionRow()
    predictionRows.value = [emptyRow]
    activeRowId.value = emptyRow.id
    return
  }
  predictionRows.value = predictionRows.value.filter((_, index) => index !== rowIndex)
  if (activeRowId.value === removed.id) {
    const nextIndex = Math.min(rowIndex, predictionRows.value.length - 1)
    activeRowId.value = predictionRows.value[nextIndex]?.id || ''
  }
}

function isPredictionSelected(rowId, num) {
  const row = predictionRows.value.find((item) => item.id === rowId)
  return row?.numbers.includes(num)
}

function togglePredictionCell(rowId, num) {
  selectPredictionRow(rowId)
  const rowIndex = predictionRows.value.findIndex((item) => item.id === rowId)
  if (rowIndex < 0) return
  const numbers = [...predictionRows.value[rowIndex].numbers]
  const index = numbers.indexOf(num)
  if (index >= 0) numbers.splice(index, 1)
  else numbers.push(num)
  const next = [...predictionRows.value]
  next[rowIndex] = { ...next[rowIndex], numbers }
  predictionRows.value = next
}

async function copyPredictionRow(rowId) {
  const row = predictionRows.value.find((item) => item.id === rowId)
  const nums = [...(row?.numbers || [])].sort((a, b) => a - b)
  const text = nums.map((num) => formatBall(num)).join(' ')
  const ok = await copyText(text)
  if (ok) flashCopied(rowId)
}

function flashCopied(key) {
  copiedKey.value = key
  window.setTimeout(() => {
    if (copiedKey.value === key) copiedKey.value = ''
  }, 1500)
}

function formatIssueDate(row) {
  return {
    issue: row.issue,
    date: row.date.slice(5).replace('-', '/'),
    weekday: row.weekday,
  }
}

function isPredictionCol(num) {
  const limit = props.chart.predictionColumns
  if (!limit) return true
  return num <= limit
}

function cellClasses(cell, row) {
  const classes = [cell.cellClass].filter(Boolean)

  if (cell.type === 'hit') {
    classes.push('cell-hit')
    if (props.chart.isHeatmap) classes.push(`heat-${Math.min(cell.num % 5, 4)}`)
  } else if (props.marks.omission !== false) {
    classes.push('cell-miss', `miss-${getOmissionLevel(cell.omission)}`)
    if (props.marks.omissionLayer) classes.push(`layer-${getOmissionLayer(cell.omission)}`)
  } else {
    classes.push('cell-hide-miss')
  }

  classes.push(...getCellMarkClass(cell, row.marks, props.marks))

  const zoneEvery = props.chart.zoneEvery || 0
  if (props.marks.zoneLine && zoneEvery > 0 && isZoneBoundaryCol(cell.num, props.chart)) {
    classes.push('zone-line')
  }

  if (props.chart.groupSeparators?.includes(cell.num)) {
    classes.push('group-separator')
  }

  return classes
}

function displayHit(cell) {
  return cell.label ?? formatBall(cell.num)
}

function isSegmentLine(index) {
  return props.marks.segmentLine && index > 0 && index % 5 === 0
}
</script>

<template>
  <div
    ref="tableWrapRef"
    class="distribution-wrap"
    :style="wrapStyle"
  >
    <div class="distribution-toolbar">
      <div class="legend-items">
        <span class="legend-item"><i class="legend-dot hit" />开出号码</span>
        <span class="legend-item"><i class="legend-dot miss" />遗漏期数</span>
        <span class="legend-item"><i class="legend-dot mark-repeat" />重号</span>
        <span class="legend-item"><i class="legend-dot mark-edge" />边号</span>
        <template v-if="chart.id === 'bose'">
          <span class="legend-item"><i class="legend-dot bose-red" />红波</span>
          <span class="legend-item"><i class="legend-dot bose-blue" />蓝波</span>
          <span class="legend-item"><i class="legend-dot bose-green" />绿波</span>
        </template>
      </div>
      <div class="toolbar-right">
        <div class="legend-freeze">
          <span class="toolbar-label">冻结</span>
          <button
            type="button"
            class="toolbar-btn"
            :class="{ active: freeze.head }"
            title="滚动时固定顶部列头"
            @click="toggleFreeze('head')"
          >
            列头
          </button>
          <button
            type="button"
            class="toolbar-btn"
            :class="{ active: freeze.pred }"
            title="滚动时固定预测区"
            @click="toggleFreeze('pred')"
          >
            预测区
          </button>
          <button
            type="button"
            class="toolbar-btn"
            :class="{ active: freeze.stats }"
            title="滚动时固定底部统计"
            @click="toggleFreeze('stats')"
          >
            统计
          </button>
        </div>
        <div class="legend-order">
          <span class="legend-order-label">排序</span>
          <button
            type="button"
            class="legend-order-btn"
            :class="{ active: rowOrder === 'asc' }"
            @click="setRowOrder('asc')"
          >
            正序
          </button>
          <button
            type="button"
            class="legend-order-btn"
            :class="{ active: rowOrder === 'desc' }"
            @click="setRowOrder('desc')"
          >
            反序
          </button>
        </div>
      </div>
    </div>

    <div v-if="!chart.rows?.length" class="empty-chart">没有符合筛选条件的开奖数据</div>

    <div v-else ref="bodyScrollRef" class="distribution-scroll">
      <div class="distribution-h-scroll">
        <div class="table-suite">
          <table class="distribution-table table-body">
              <colgroup>
                <col class="col-issue-def" />
                <col
                  v-for="(header, index) in columnHeaders"
                  :key="`col-body-${index}`"
                  class="col-num-def"
                />
              </colgroup>
              <TrendChartHead
                :chart="chart"
                :column-headers="columnHeaders"
                :issue-col-mode="issueColMode"
                :frozen="freeze.head"
                :header-groups="headerGroups"
                @update:issue-col-mode="issueColMode = $event"
              />
              <tbody>
                <tr
                  v-for="(row, index) in chart.rows"
                  :key="row.issue"
                  :class="{ 'segment-line': isSegmentLine(index) }"
                >
                  <td class="sticky-col col-issue">
                    <div class="issue-cell">
                      <span v-if="issueColMode === 'issue'" class="issue-no">{{ formatIssueDate(row).issue }}</span>
                      <span v-else class="issue-date">{{ formatIssueDate(row).date }} {{ formatIssueDate(row).weekday }}</span>
                    </div>
                  </td>
                  <td
                    v-for="cell in row.cells"
                    :key="cell.num"
                    class="col-num"
                    :class="cellClasses(cell, row)"
                  >
                    <span v-if="cell.type === 'hit'" class="hit-ball">{{ displayHit(cell) }}</span>
                    <span v-else-if="marks.omission !== false" class="miss-value">{{ cell.omission }}</span>
                  </td>
                </tr>
              </tbody>
              <TrendChartPrediction
                v-if="!freeze.pred"
                :chart="chart"
                :column-headers="columnHeaders"
                :column-numbers="columnNumbers"
                :prediction-rows="predictionRows"
                :active-row-id="activeRowId"
                :copied-key="copiedKey"
                :is-prediction-col="isPredictionCol"
                :is-prediction-selected="isPredictionSelected"
                @add-row-below="addPredictionRowBelow"
                @remove-row="removePredictionRow"
                @toggle-cell="togglePredictionCell"
                @copy-row="copyPredictionRow"
              />
              <TrendChartStats
                v-if="!freeze.stats"
                :chart="chart"
                :column-headers="columnHeaders"
                :stat-rows="statRows"
                :indicator-help-item="indicatorHelpItem"
                :stat-cell-value="statCellValue"
                :stat-mode="statMode"
                @show-tip="showStatTip"
                @hide-tip="hideStatTip"
                @update:stat-mode="statMode = $event"
              />
            </table>

          <div
            v-if="freeze.pred || freeze.stats"
            class="distribution-bottom-fixed"
            :class="{ 'is-sticky': freeze.pred || freeze.stats }"
          >
            <table v-if="freeze.pred" class="distribution-table table-pred">
              <colgroup>
                <col class="col-issue-def" />
                <col
                  v-for="(header, index) in columnHeaders"
                  :key="`col-pred-${index}`"
                  class="col-num-def"
                />
              </colgroup>
              <TrendChartPrediction
                :chart="chart"
                :column-headers="columnHeaders"
                :column-numbers="columnNumbers"
                :prediction-rows="predictionRows"
                :active-row-id="activeRowId"
                :copied-key="copiedKey"
                :is-prediction-col="isPredictionCol"
                :is-prediction-selected="isPredictionSelected"
                @add-row-below="addPredictionRowBelow"
                @remove-row="removePredictionRow"
                @toggle-cell="togglePredictionCell"
                @copy-row="copyPredictionRow"
              />
            </table>

            <table v-if="freeze.stats" class="distribution-table table-foot">
              <colgroup>
                <col class="col-issue-def" />
                <col
                  v-for="(header, index) in columnHeaders"
                  :key="`col-foot-${index}`"
                  class="col-num-def"
                />
              </colgroup>
              <TrendChartStats
                :chart="chart"
                :column-headers="columnHeaders"
                :stat-rows="statRows"
                :indicator-help-item="indicatorHelpItem"
                :stat-cell-value="statCellValue"
                :stat-mode="statMode"
                @show-tip="showStatTip"
                @hide-tip="hideStatTip"
                @update:stat-mode="statMode = $event"
              />
            </table>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="statTip"
        ref="statTipRef"
        class="stat-help-popover"
        :class="{ 'is-bottom': statTip.placement === 'bottom' }"
        role="tooltip"
        :style="{
          left: `${statTip.x}px`,
          top: `${statTip.y}px`,
          '--arrow-offset': `${statTip.arrowOffset}px`,
        }"
      >
        {{ statTip.text }}
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.distribution-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--text-dim);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
}

.legend-freeze {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 4px 8px;
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.toolbar-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-dim);
}

.toolbar-btn {
  border: 1px solid #d8dee9;
  background: #fff;
  color: var(--text-soft);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.toolbar-btn:hover {
  border-color: #1677ff;
  color: #1677ff;
}

.toolbar-btn.active {
  background: #e6f4ff;
  border-color: #1677ff;
  color: #1677ff;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.legend-order {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 4px 8px;
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.legend-order-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-dim);
}

.legend-order-btn {
  border: 1px solid #d8dee9;
  background: #fff;
  color: var(--text-soft);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.legend-order-btn:hover {
  border-color: #1677ff;
  color: #1677ff;
}

.legend-order-btn.active {
  background: #e6f4ff;
  border-color: #1677ff;
  color: #1677ff;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 4px;
}

.legend-dot.hit { background: linear-gradient(135deg, #fb7185, #e11d48); }
.legend-dot.miss { background: #f1f5f9; border: 1px solid var(--border); }
.legend-dot.mark-repeat { background: #dbeafe; border: 2px solid #2563eb; }
.legend-dot.mark-edge { background: #fef9c3; border: 2px solid #ca8a04; }
.legend-dot.bose-red { background: #fecaca; }
.legend-dot.bose-blue { background: #bfdbfe; }
.legend-dot.bose-green { background: #bbf7d0; }
</style>

<style scoped>
.stat-help-popover {
  position: fixed;
  z-index: 10001;
  width: max-content;
  max-width: min(280px, calc(100vw - 20px));
  padding: 8px 10px;
  border-radius: 8px;
  background: #1e293b;
  color: #f8fafc;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.45;
  text-align: left;
  white-space: pre-line;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.22);
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 8px));
}

.stat-help-popover.is-bottom {
  transform: translate(-50%, 8px);
}

.stat-help-popover::after {
  content: '';
  position: absolute;
  left: calc(50% + var(--arrow-offset, 0px));
  top: 100%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #1e293b;
}

.stat-help-popover.is-bottom::after {
  top: auto;
  bottom: 100%;
  border-top-color: transparent;
  border-bottom-color: #1e293b;
}
</style>
