<script setup>
import { computed } from 'vue'
import { formatBall } from '../utils/format.js'
import { getCellMarkClass } from '../utils/chartMarks.js'
import { getOmissionLevel, getOmissionLayer } from '../utils/charts/index.js'

const props = defineProps({
  chart: {
    type: Object,
    required: true,
  },
  marks: {
    type: Object,
    default: () => ({}),
  },
})

const columnHeaders = computed(() => {
  if (props.chart.headers?.length) return props.chart.headers
  return Array.from({ length: props.chart.columnCount || 80 }, (_, i) => formatBall(i + 1))
})

const statRows = computed(() => [
  { key: 'appearCount', label: '出现次数' },
  { key: 'currentOmission', label: '当前遗漏' },
  { key: 'avgOmission', label: '平均遗漏' },
  { key: 'maxOmission', label: '最大遗漏' },
  { key: 'maxConsecutive', label: '最大连出' },
  { key: 'desireRatio', label: '欲出几率' },
])

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
  <div class="distribution-wrap" :class="{ 'cols-narrow': chart.columnCount <= 10 }" :style="{ '--col-count': chart.columnCount || 80 }">
    <div class="distribution-legend">
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

    <div v-if="!chart.rows?.length" class="empty-chart">没有符合筛选条件的开奖数据</div>

    <div v-else class="distribution-scroll">
      <table class="distribution-table">
        <colgroup>
          <col class="col-issue-def" />
          <col class="col-prize-def" />
          <col
            v-for="(header, index) in columnHeaders"
            :key="`col-${index}`"
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
</template>

<style scoped>
.distribution-wrap {
  --issue-w: 72px;
  --prize-w: 96px;
}

.distribution-wrap.cols-narrow {
  --issue-w: 68px;
  --prize-w: 88px;
}

.distribution-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--text-dim);
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
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  max-height: 75vh;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: #fff;
}

.distribution-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 10px;
}

.col-issue-def { width: var(--issue-w); }
.col-prize-def { width: var(--prize-w); }
.col-num-def { width: auto; }

.distribution-table :is(th, td) {
  padding: 0;
  text-align: center;
  border-right: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
  overflow: hidden;
}

.distribution-table thead th {
  position: sticky;
  top: 0;
  z-index: 3;
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

.distribution-table tbody tr:hover td { background-color: #f8fafc; }
.distribution-table tbody tr:hover .cell-hit { background-color: #ffe4e6; }
.distribution-table tbody tr:hover .sticky-col { background: #f8fafc; }

.dist-stats-row :is(td, th) {
  background: #f8fafc !important;
  font-weight: 600;
  font-size: 11px;
  color: var(--text-soft);
  padding: 4px 0 !important;
  border-top: 2px solid var(--border-strong);
}

.dist-stats-label {
  text-align: left !important;
  padding: 4px !important;
  color: var(--text) !important;
  font-weight: 700 !important;
  font-size: 10px !important;
  background: #f1f5f9 !important;
  white-space: nowrap;
}

.stat-cell { font-variant-numeric: tabular-nums; }
.stat-omit-hot { color: #dc2626 !important; font-weight: 800; }
</style>
