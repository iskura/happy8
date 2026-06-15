<script setup>
import { computed, ref } from 'vue'
import { formatBall } from '../utils/format.js'

const props = defineProps({
  sourceDetails: {
    type: Array,
    default: () => [],
  },
  lookback: {
    type: Number,
    default: 0,
  },
  baseIssue: {
    type: String,
    default: '',
  },
})

const expandedMap = ref({})

const hitCount = computed(() =>
  props.sourceDetails.reduce(
    (total, item) => total + item.rows.filter((row) => row.status === 'hit').length,
    0,
  ),
)

function rowKey(sourceNumber, row) {
  return `${sourceNumber}-${row.lookbackStep}`
}

function isExpanded(sourceNumber) {
  return expandedMap.value[sourceNumber] !== false
}

function toggleSource(sourceNumber) {
  expandedMap.value = {
    ...expandedMap.value,
    [sourceNumber]: !isExpanded(sourceNumber),
  }
}

function adjacentSet(row) {
  return new Set(row.adjacentList.map((pick) => pick.adjacent))
}

function ballClass(num, row, sourceNumber) {
  if (adjacentSet(row).has(num)) return 'is-adjacent'
  if (num === sourceNumber) return 'is-source-ref'
  return ''
}

function ballTitle(num, row, sourceNumber) {
  if (adjacentSet(row).has(num)) {
    const pick = row.adjacentList.find((item) => item.adjacent === num)
    return `最近邻号 · 与源号 ${formatBall(sourceNumber)} 跨度 ${pick?.span ?? row.span}`
  }
  if (num === sourceNumber) return `下一期也开出源号 ${formatBall(sourceNumber)}`
  return `与源号 ${formatBall(sourceNumber)} 跨度 ${Math.abs(num - sourceNumber)}`
}

function statusClass(status) {
  if (status === 'hit') return 'status-hit'
  if (status === 'miss') return 'status-miss'
  return 'status-skip'
}
</script>

<template>
  <section class="panel detail-panel">
    <header class="panel-header">
      <div>
        <h2>分析明细</h2>
        <p class="panel-desc">
          基准期 {{ baseIssue }} · 每个源号码固定展示 {{ lookback }} 期追溯过程，便于逐步核对
        </p>
      </div>
      <span class="panel-count">
        {{ sourceDetails.length }} 个源号 · 共 {{ sourceDetails.length * lookback }} 行 · 有效计算 {{ hitCount }} 行
      </span>
    </header>

    <div class="source-list">
      <article
        v-for="item in sourceDetails"
        :key="item.sourceNumber"
        class="source-card"
      >
        <button type="button" class="source-card-header" @click="toggleSource(item.sourceNumber)">
          <div class="source-title">
            <span class="ball ball-source">{{ formatBall(item.sourceNumber) }}</span>
            <strong>源号码 {{ formatBall(item.sourceNumber) }}</strong>
            <span class="source-meta">
              {{ item.rows.filter((row) => row.status === 'hit').length }} / {{ lookback }} 期产生选号
            </span>
          </div>
          <span class="source-toggle">{{ isExpanded(item.sourceNumber) ? '收起' : '展开' }}</span>
        </button>

        <div v-show="isExpanded(item.sourceNumber)" class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>追溯</th>
                <th>命中期号</th>
                <th>状态</th>
                <th>下一期</th>
                <th class="next-draw-col-head">
                  <div class="col-head-main">
                    <span class="col-head-title">下一期开奖号</span>
                    <span class="col-head-hint">
                      <span class="legend-item"><i class="legend-dot is-source-ref" />源号（比对基准）</span>
                      <span class="legend-item"><i class="legend-dot is-adjacent" />最近邻号</span>
                      <span class="legend-item"><i class="legend-dot" />下一期开奖号码</span>
                    </span>
                  </div>
                </th>
                <th>最近邻号</th>
                <th>跨度</th>
                <th>反向号码</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in item.rows"
                :key="rowKey(item.sourceNumber, row)"
                :class="statusClass(row.status)"
              >
                <td class="step-cell">第 {{ row.lookbackStep }} 期</td>
                <td>
                  <div>{{ row.hitPeriod }}</div>
                  <div class="sub-text">{{ row.hitDate }}</div>
                </td>
                <td>
                  <span class="status-tag" :class="statusClass(row.status)">{{ row.statusText }}</span>
                </td>
                <td>
                  <template v-if="row.nextPeriod">
                    <div>{{ row.nextPeriod }}</div>
                    <div class="sub-text">{{ row.nextDate }}</div>
                  </template>
                  <span v-else class="empty-cell">—</span>
                </td>
                <td class="numbers-cell">
                  <div v-if="row.nextNumbers.length" class="next-draw">
                    <div class="next-draw-head">
                      <span class="source-ref" title="比对基准 · 在命中期开出的源号">
                        <span class="draw-ball is-source-ref">{{ formatBall(item.sourceNumber) }}</span>
                        <span class="source-ref-label">源号</span>
                      </span>
                      <span class="next-draw-arrow">→ 下一期 20 码</span>
                    </div>
                    <div class="draw-ball-row">
                      <span
                        v-for="num in row.nextNumbers"
                        :key="num"
                        class="draw-ball"
                        :class="ballClass(num, row, item.sourceNumber)"
                        :title="ballTitle(num, row, item.sourceNumber)"
                      >
                        {{ formatBall(num) }}
                      </span>
                    </div>
                  </div>
                  <span v-else class="empty-cell">—</span>
                </td>
                <td>
                  <div v-if="row.adjacentList.length" class="pick-group">
                    <div
                      v-for="(pick, pickIndex) in row.adjacentList"
                      :key="`${pick.adjacent}-${pickIndex}`"
                      class="pick-line"
                    >
                      <span class="ball ball-adjacent">{{ formatBall(pick.adjacent) }}</span>
                    </div>
                  </div>
                  <span v-else class="empty-cell">—</span>
                </td>
                <td class="span-cell">
                  <template v-if="row.span != null">{{ row.span }}</template>
                  <span v-else class="empty-cell">—</span>
                </td>
                <td>
                  <div v-if="row.adjacentList.length" class="pick-group">
                    <div
                      v-for="(pick, pickIndex) in row.adjacentList"
                      :key="`reverse-${pick.reverse}-${pickIndex}`"
                      class="pick-line"
                    >
                      <span class="ball ball-reverse">{{ formatBall(pick.reverse) }}</span>
                    </div>
                  </div>
                  <span v-else class="empty-cell">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.detail-panel {
  margin-top: 18px;
}

.source-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.source-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: #fff;
}

.source-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 14px;
  border: none;
  background: #fafbfc;
  cursor: pointer;
  text-align: left;
}

.source-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.source-meta {
  font-size: 12px;
  color: var(--text-dim);
}

.source-toggle {
  flex-shrink: 0;
  font-size: 12px;
  color: #1677ff;
}

.table-wrap {
  margin-top: 0;
}

.step-cell {
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
}

.sub-text {
  margin-top: 2px;
  font-size: 11px;
  color: var(--text-dim);
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.status-hit .status-tag,
.status-tag.status-hit {
  background: #ecfdf5;
  color: #059669;
}

.status-miss .status-tag,
.status-tag.status-miss {
  background: #f8fafc;
  color: #64748b;
}

.status-skip .status-tag,
.status-tag.status-skip {
  background: #fff7ed;
  color: #ea580c;
}

tbody tr.status-hit {
  background: #f0fdf4;
}

tbody tr.status-miss {
  background: #fff;
}

tbody tr.status-skip {
  background: #fffbeb;
}

.numbers-cell {
  min-width: 320px;
}

.next-draw-col-head {
  line-height: 1.3;
}

.col-head-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.col-head-title {
  flex-shrink: 0;
  font-weight: 700;
}

.col-head-hint {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.next-draw {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.next-draw-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.source-ref {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.source-ref-label {
  font-size: 11px;
  font-weight: 600;
  color: #4f46e5;
}

.next-draw-arrow {
  font-size: 11px;
  color: var(--text-dim);
}

.draw-ball-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.draw-ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.draw-ball.is-adjacent {
  background: #ea580c;
  color: #fff;
  box-shadow: 0 0 0 2px #ffedd5;
}

.draw-ball.is-source-ref {
  background: #2563eb;
  color: #fff;
  box-shadow: 0 0 0 2px #dbeafe;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--text-dim);
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e2e8f0;
}

.legend-dot.is-adjacent {
  background: #ea580c;
}

.legend-dot.is-source-ref {
  background: #2563eb;
}

.pick-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pick-line {
  display: flex;
  align-items: center;
}

.empty-cell {
  color: var(--text-dim);
}
</style>
