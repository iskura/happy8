<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { formatBall, copyText } from '../utils/format.js'
import { getCellMarkClass } from '../utils/chartMarks.js'
import { getOmissionLevel, getOmissionLayer } from '../utils/charts/index.js'
import {
  createPredictionRow,
  loadPredictionRows,
  loadActivePredictionRowId,
  savePredictionRows,
} from '../utils/predictionStorage.js'
import CopyButton from './CopyButton.vue'

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

const wrapStyle = computed(() => {
  const count = columnHeaders.value.length
  const numWidth = props.chart.columnCount <= 10 ? 36 : 22
  return {
    '--col-count': count,
    '--num-col-w': `${numWidth}px`,
    '--table-min-width': `calc(var(--issue-w) + var(--prize-w) + ${count} * ${numWidth}px)`,
  }
})

const bodyScrollRef = ref(null)
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

watch(
  () => [props.chart.rows?.length, freeze.value.head, freeze.value.pred, freeze.value.stats],
  () => nextTick(updateScrollGutter),
)

onMounted(() => {
  nextTick(() => {
    updateScrollGutter()
    if (typeof ResizeObserver !== 'undefined' && bodyScrollRef.value) {
      bodyResizeObserver = new ResizeObserver(() => updateScrollGutter())
      bodyResizeObserver.observe(bodyScrollRef.value)
    }
  })
  window.addEventListener('resize', updateScrollGutter)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScrollGutter)
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

const useSplitLayout = computed(() => freeze.value.head || freeze.value.pred || freeze.value.stats)

const statRows = computed(() => [
  { key: 'appearCount', label: '出现次数' },
  { key: 'currentOmission', label: '当前遗漏' },
  { key: 'avgOmission', label: '平均遗漏' },
  { key: 'maxOmission', label: '最大遗漏' },
  { key: 'maxConsecutive', label: '最大连出' },
  { key: 'desireRatio', label: '欲出几率' },
])

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
  if (props.marks.zoneLine && zoneEvery > 0 && cell.num % zoneEvery === 0) {
    classes.push('zone-line')
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
    class="distribution-wrap"
    :class="{ 'cols-narrow': chart.columnCount <= 10 }"
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

    <div v-else class="distribution-scroll" :class="{ 'is-unified': !useSplitLayout }">
      <div class="distribution-h-scroll">
        <div class="table-suite">
          <div v-if="freeze.head" class="table-head" :style="{ paddingRight: `${scrollGutter}px` }">
            <table class="distribution-table">
              <colgroup>
                <col class="col-issue-def" />
                <col class="col-prize-def" />
                <col
                  v-for="(header, index) in columnHeaders"
                  :key="`col-head-${index}`"
                  class="col-num-def"
                />
              </colgroup>
              <thead>
                <tr>
                  <th class="sticky-col col-issue">期号<br>日期</th>
                  <th class="sticky-col col-prize">开奖号码</th>
                  <th
                    v-for="(header, index) in columnHeaders"
                    :key="`h-${index}`"
                    class="col-num"
                    :class="{ 'zone-head': chart.zoneEvery && (index + 1) % chart.zoneEvery === 0 }"
                  >
                    {{ header }}
                  </th>
                </tr>
              </thead>
            </table>
          </div>

          <div ref="bodyScrollRef" class="distribution-body-scroll">
            <table class="distribution-table table-body">
              <colgroup>
                <col class="col-issue-def" />
                <col class="col-prize-def" />
                <col
                  v-for="(header, index) in columnHeaders"
                  :key="`col-body-${index}`"
                  class="col-num-def"
                />
              </colgroup>
              <thead v-if="!freeze.head">
                <tr>
                  <th class="sticky-col col-issue">期号<br>日期</th>
                  <th class="sticky-col col-prize">开奖号码</th>
                  <th
                    v-for="(header, index) in columnHeaders"
                    :key="`h-scroll-${index}`"
                    class="col-num"
                    :class="{ 'zone-head': chart.zoneEvery && (index + 1) % chart.zoneEvery === 0 }"
                  >
                    {{ header }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in chart.rows"
                  :key="row.issue"
                  :class="{ 'segment-line': isSegmentLine(index) }"
                >
                  <td class="sticky-col col-issue">
                    <div class="issue-cell">
                      <span class="issue-no">{{ formatIssueDate(row).issue }}</span>
                      <span class="issue-date">{{ formatIssueDate(row).date }} {{ formatIssueDate(row).weekday }}</span>
                    </div>
                  </td>
                  <td class="sticky-col col-prize" :title="row.numbersText">
                    <span class="prize-text">{{ row.numbersText }}</span>
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
              <tbody v-if="!freeze.pred" class="prediction-zone">
                <tr
                  v-for="(predRow, rowIndex) in predictionRows"
                  :key="`scroll-${predRow.id}`"
                  class="prediction-row"
                  :class="{ active: activeRowId === predRow.id }"
                >
                  <td class="sticky-col col-issue">
                    <div class="pred-controls">
                      <span class="pred-seq">{{ rowIndex + 1 }}</span>
                      <button type="button" class="pred-action-btn add" title="在此行下方新增" @click="addPredictionRowBelow(rowIndex)">+</button>
                      <button type="button" class="pred-action-btn del" title="删除此行" @click="removePredictionRow(rowIndex)">−</button>
                    </div>
                  </td>
                  <td class="sticky-col col-prize pred-copy-cell">
                    <CopyButton size="sm" :copied="copiedKey === predRow.id" :disabled="!predRow.numbers.length" title="复制所选号码" @click="copyPredictionRow(predRow.id)" />
                  </td>
                  <td
                    v-for="num in columnNumbers"
                    :key="`scroll-${predRow.id}-${num}`"
                    class="col-num pred-cell"
                    :class="{ selected: isPredictionSelected(predRow.id, num), 'zone-line': chart.zoneEvery && num % chart.zoneEvery === 0, inactive: activeRowId !== predRow.id }"
                    @click="togglePredictionCell(predRow.id, num)"
                  >
                    <span v-if="isPredictionSelected(predRow.id, num)" class="pred-ball">{{ columnHeaders[num - 1] }}</span>
                  </td>
                </tr>
              </tbody>
              <tfoot v-if="!freeze.stats">
                <tr v-for="stat in statRows" :key="`scroll-${stat.key}`" class="dist-stats-row">
                  <td class="sticky-col col-issue dist-stats-label">{{ stat.label }}</td>
                  <td class="sticky-col col-prize dist-stats-label" />
                  <td
                    v-for="(_, index) in columnHeaders"
                    :key="`scroll-${stat.key}-${index}`"
                    class="col-num stat-cell"
                    :class="{ 'stat-omit-hot': stat.key === 'currentOmission' && chart.stats[stat.key][index + 1] >= 10 }"
                  >
                    {{ chart.stats[stat.key][index + 1] }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div v-if="freeze.pred || freeze.stats" class="distribution-bottom-fixed" :style="{ paddingRight: `${scrollGutter}px` }">
            <table v-if="freeze.pred" class="distribution-table table-pred">
              <colgroup>
                <col class="col-issue-def" />
                <col class="col-prize-def" />
                <col
                  v-for="(header, index) in columnHeaders"
                  :key="`col-pred-${index}`"
                  class="col-num-def"
                />
              </colgroup>
              <tbody class="prediction-zone">
                <tr
                  v-for="(predRow, rowIndex) in predictionRows"
                  :key="predRow.id"
                  class="prediction-row"
                  :class="{ active: activeRowId === predRow.id }"
                >
                  <td class="sticky-col col-issue">
                    <div class="pred-controls">
                      <span class="pred-seq">{{ rowIndex + 1 }}</span>
                      <button
                        type="button"
                        class="pred-action-btn add"
                        title="在此行下方新增"
                        @click="addPredictionRowBelow(rowIndex)"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        class="pred-action-btn del"
                        title="删除此行"
                        @click="removePredictionRow(rowIndex)"
                      >
                        −
                      </button>
                    </div>
                  </td>
                  <td class="sticky-col col-prize pred-copy-cell">
                    <CopyButton
                      size="sm"
                      :copied="copiedKey === predRow.id"
                      :disabled="!predRow.numbers.length"
                      title="复制所选号码"
                      @click="copyPredictionRow(predRow.id)"
                    />
                  </td>
                  <td
                    v-for="num in columnNumbers"
                    :key="`${predRow.id}-${num}`"
                    class="col-num pred-cell"
                    :class="{
                      selected: isPredictionSelected(predRow.id, num),
                      'zone-line': chart.zoneEvery && num % chart.zoneEvery === 0,
                      inactive: activeRowId !== predRow.id,
                    }"
                    @click="togglePredictionCell(predRow.id, num)"
                  >
                    <span v-if="isPredictionSelected(predRow.id, num)" class="pred-ball">
                      {{ columnHeaders[num - 1] }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <table v-if="freeze.stats" class="distribution-table table-foot">
              <colgroup>
                <col class="col-issue-def" />
                <col class="col-prize-def" />
                <col
                  v-for="(header, index) in columnHeaders"
                  :key="`col-foot-${index}`"
                  class="col-num-def"
                />
              </colgroup>
              <tfoot>
                <tr v-for="stat in statRows" :key="stat.key" class="dist-stats-row">
                  <td class="sticky-col col-issue dist-stats-label">{{ stat.label }}</td>
                  <td class="sticky-col col-prize dist-stats-label" />
                  <td
                    v-for="(_, index) in columnHeaders"
                    :key="`${stat.key}-${index}`"
                    class="col-num stat-cell"
                    :class="{
                      'stat-omit-hot': stat.key === 'currentOmission' && chart.stats[stat.key][index + 1] >= 10,
                    }"
                  >
                    {{ chart.stats[stat.key][index + 1] }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.distribution-wrap {
  --issue-w: 88px;
  --prize-w: 96px;
}

.distribution-wrap.cols-narrow {
  --issue-w: 80px;
  --prize-w: 88px;
}

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

.empty-chart {
  padding: 40px;
  text-align: center;
  color: var(--text-dim);
  border: 1px dashed var(--border);
  border-radius: var(--radius-md);
}

.distribution-scroll {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 75vh;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: #fff;
  overflow: hidden;
}

.distribution-h-scroll {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
}

.table-suite {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
  min-width: var(--table-min-width);
}

.table-head {
  flex-shrink: 0;
  z-index: 12;
  background: #fff;
  box-shadow: 0 1px 0 var(--border-strong);
}

.distribution-scroll.is-unified .distribution-body-scroll {
  flex: 1;
}

.distribution-bottom-fixed {
  flex-shrink: 0;
  z-index: 11;
  background: #fff;
  box-shadow: 0 -4px 12px rgba(15, 23, 42, 0.08);
}

.table-foot {
  border-top: 2px solid var(--border-strong);
}

.distribution-body-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
}

.distribution-table {
  width: 100%;
  min-width: var(--table-min-width);
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 10px;
}

.col-issue-def { width: var(--issue-w); }
.col-prize-def { width: var(--prize-w); }
.col-num-def { min-width: var(--num-col-w); }

.distribution-table :is(th, td) {
  padding: 0;
  text-align: center;
  border-right: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
  overflow: hidden;
}

.distribution-table thead th {
  background: #f8fafc;
  color: var(--text-dim);
  font-weight: 700;
  font-size: 11px;
  line-height: 1.2;
  padding: 4px 1px;
  border-bottom: 1px solid var(--border-strong);
}

.zone-head { border-left: 1px solid #cbd5e1 !important; }

.sticky-col {
  position: sticky;
  z-index: 2;
  background: #fff;
}

thead .sticky-col { z-index: 5; background: #f8fafc; }

.col-issue {
  left: 0;
  text-align: left;
  padding: 3px 4px !important;
  vertical-align: middle;
}

.issue-cell {
  display: flex;
  flex-direction: column;
  gap: 1px;
  line-height: 1.15;
}

.issue-no {
  font-weight: 700;
  color: var(--text);
  font-size: 10px;
}

.issue-date {
  color: var(--text-dim);
  font-size: 9px;
  white-space: nowrap;
}

.col-prize {
  left: var(--issue-w);
  text-align: left;
  padding: 3px 4px !important;
  vertical-align: middle;
}

.prize-text {
  display: block;
  font-size: 9px;
  line-height: 1.25;
  color: var(--text-soft);
  white-space: normal;
  word-break: break-all;
}

.hit-ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e11d48;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  box-shadow: none;
}

.miss-value {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.col-num {
  height: 26px;
  vertical-align: middle;
  padding: 0 !important;
}

.zone-line { border-left: 1px solid #e2e8f0 !important; }
.segment-line td { border-top: 2px solid #cbd5e1 !important; }

.cell-hit { background: #fff5f5; }
.cell-miss { background: #fff; color: #94a3b8; }
.cell-hide-miss { background: #fff; }
.cell-miss.miss-mid { background: #fffbeb; color: #d97706; }
.cell-miss.miss-high { background: #fef2f2; color: #dc2626; font-weight: 700; }

.layer-1 { background: #f8fafc !important; }
.layer-2 { background: #f1f5f9 !important; color: #64748b !important; }
.layer-3 { background: #e2e8f0 !important; color: #475569 !important; }
.layer-4 { background: #fef3c7 !important; color: #b45309 !important; }
.layer-5 { background: #fee2e2 !important; color: #dc2626 !important; font-weight: 700; }

.bose-red.cell-hit { background: #fef2f2 !important; }
.bose-blue.cell-hit { background: #eff6ff !important; }
.bose-green.cell-hit { background: #f0fdf4 !important; }

.heat-0.cell-hit { background: #fff7ed; }
.heat-1.cell-hit { background: #ffedd5; }
.heat-2.cell-hit { background: #fed7aa; }
.heat-3.cell-hit { background: #fdba74; }
.heat-4.cell-hit { background: #fb923c; }

.mark-repeat.cell-hit .hit-ball {
  outline: 1px solid #2563eb;
  outline-offset: 0;
}

.mark-consecutive.cell-hit { background: #ecfdf5 !important; }
.mark-edge { background: #fefce8 !important; }

.distribution-table tbody:not(.prediction-zone) tr:hover td { background-color: #f8fafc; }
.distribution-table tbody:not(.prediction-zone) tr:hover .cell-hit { background-color: #ffe4e6; }
.distribution-table tbody:not(.prediction-zone) tr:hover .sticky-col { background: #f8fafc; }

.prediction-zone {
  border-top: 2px solid #93c5fd;
}

.prediction-row td {
  background: #f0f9ff;
}

.prediction-row.active td {
  background: #e0f2fe;
}

.prediction-row .sticky-col {
  background: #e0f2fe;
}

.prediction-row.active .sticky-col {
  background: #bae6fd;
}

.pred-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 3px 2px;
}

.pred-seq {
  flex-shrink: 0;
  min-width: 16px;
  font-size: 11px;
  font-weight: 800;
  color: #1d4ed8;
  text-align: center;
}

.pred-action-btn {
  height: 22px;
  padding: 0 5px;
  border: 1px solid #93c5fd;
  border-radius: 4px;
  background: #fff;
  color: #2563eb;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
}

.pred-action-btn.add,
.pred-action-btn.del {
  min-width: 22px;
  padding: 0;
  font-size: 14px;
  font-weight: 700;
}

.pred-action-btn:hover {
  background: #dbeafe;
}

.pred-copy-cell {
  text-align: center;
  vertical-align: middle;
}

.pred-cell {
  cursor: pointer;
  background: #f0f9ff;
}

.pred-cell.inactive {
  opacity: 0.72;
}

.pred-cell.inactive.selected {
  opacity: 1;
}

.pred-cell:hover {
  background: #dbeafe;
}

.pred-cell.selected {
  background: #bfdbfe;
}

.pred-ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

.dist-stats-row :is(td, th) {
  background: #f8fafc !important;
  font-weight: 600;
  font-size: 11px;
  color: var(--text-soft);
  padding: 4px 0 !important;
  border-top: 2px solid var(--border-strong);
  text-align: center !important;
  vertical-align: middle;
}

.dist-stats-label {
  text-align: center !important;
  padding: 4px 2px !important;
  color: var(--text) !important;
  font-weight: 700 !important;
  font-size: 10px !important;
  background: #f1f5f9 !important;
  white-space: nowrap;
}

.stat-cell {
  font-variant-numeric: tabular-nums;
  text-align: center !important;
}

.stat-omit-hot { color: #dc2626 !important; font-weight: 800; }
</style>
