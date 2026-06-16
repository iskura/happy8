<script setup>
import { computed, ref, watch } from 'vue'
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

const allExpanded = computed(() => {
  if (!props.sourceDetails.length) return false
  return props.sourceDetails.every(
    (item) => expandedMap.value[item.sourceNumber] === true,
  )
})

watch(
  () => props.sourceDetails.map((item) => item.sourceNumber).join(','),
  () => {
    expandedMap.value = {}
  },
)

function rowKey(sourceNumber, row) {
  return `${sourceNumber}-${row.lookbackStep}`
}

function isExpanded(sourceNumber) {
  return expandedMap.value[sourceNumber] === true
}

function toggleSource(sourceNumber) {
  expandedMap.value = {
    ...expandedMap.value,
    [sourceNumber]: !isExpanded(sourceNumber),
  }
}

function toggleAll() {
  const next = !allExpanded.value
  const map = {}
  for (const item of props.sourceDetails) {
    map[item.sourceNumber] = next
  }
  expandedMap.value = map
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
      <div class="panel-header-actions">
        <button type="button" class="detail-toggle-all-btn" @click="toggleAll">
          {{ allExpanded ? '全部收起' : '全部展开' }}
        </button>
        <span class="panel-count">
          {{ sourceDetails.length }} 个源号 · 共 {{ sourceDetails.length * lookback }} 行 · 有效计算 {{ hitCount }} 行
        </span>
      </div>
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

.detail-panel .panel-header h2 {
  color: var(--text);
}

.detail-panel :deep(table th) {
  color: var(--text-dim);
}

.detail-panel :deep(table td) {
  color: var(--text-soft);
}

.panel-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.detail-toggle-all-btn {
  border: 1px solid var(--border-input);
  background: var(--color-surface);
  color: var(--text-soft);
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-small);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.detail-toggle-all-btn:hover {
  border-color: var(--link);
  color: var(--link);
  background: var(--link-bg);
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
  background: var(--color-surface);
}

.source-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 14px;
  border: none;
  background: var(--color-nav-bg);
  color: var(--text);
  cursor: pointer;
  text-align: left;
}

.source-card-header strong {
  color: var(--text);
}

.source-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.source-meta {
  font-size: var(--font-size-small);
  color: var(--text-dim);
}

.source-toggle {
  flex-shrink: 0;
  font-size: var(--font-size-small);
  color: var(--link);
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
  font-size: var(--font-size-hint);
  color: var(--text-dim);
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-hint);
  font-weight: 600;
}

.status-hit .status-tag,
.status-tag.status-hit {
  background: var(--color-status-hit-bg);
  color: var(--color-status-hit);
}

.status-miss .status-tag,
.status-tag.status-miss {
  background: var(--color-surface-alt);
  color: var(--icon-muted);
}

.status-skip .status-tag,
.status-tag.status-skip {
  background: var(--color-status-skip-bg);
  color: var(--a-to);
}

tbody tr.status-hit {
  background: var(--success-bg);
}

tbody tr.status-miss {
  background: var(--color-surface);
}

tbody tr.status-skip {
  background: var(--color-surface-skip);
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
  color: var(--text);
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
  font-size: var(--font-size-hint);
  font-weight: 600;
  color: var(--accent);
}

.next-draw-arrow {
  font-size: var(--font-size-hint);
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
  border-radius: var(--radius-circle);
  background: var(--border);
  color: var(--text-soft);
  font-size: var(--font-size-hint);
  font-weight: 700;
  line-height: 1;
}

.draw-ball.is-adjacent {
  background: var(--a-to);
  color: var(--text-on-primary);
  box-shadow: 0 0 0 2px var(--ball-adjacent-ring);
}

.draw-ball.is-source-ref {
  background: var(--info);
  color: var(--text-on-primary);
  box-shadow: 0 0 0 2px var(--ball-source-ring);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-tiny);
  color: var(--text-dim);
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: var(--radius-circle);
  background: var(--border);
}

.legend-dot.is-adjacent {
  background: var(--a-to);
}

.legend-dot.is-source-ref {
  background: var(--info);
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
