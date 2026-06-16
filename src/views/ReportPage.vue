<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { loadLotteryDataLocalFirst } from '../api/lottery.js'
import CopyButton from '../components/CopyButton.vue'
import StatHelpPopover from '../components/common/StatHelpPopover.vue'
import ReportTrendChart from '../components/report/ReportTrendChart.vue'
import { getReportChartEntry } from '../config/reportChartRegistry.js'
import { useActionFeedback } from '../composables/useActionFeedback.js'
import { useStatTip } from '../composables/trend/useStatTip.js'
import { copyText, formatBall } from '../utils/format.js'
import { buildReportSnapshot } from '../utils/reportMetrics.js'
import { notifyError, notifySuccess } from '../utils/uiMessage.js'

const STORAGE_KEY = 'happy8-report-card-order'
const DRAG_THRESHOLD = 6
const DEFAULT_CARD_ORDER = [
  'omission',
  'hot',
  'cold',
  'repeat',
  'consecutive',
  'sum',
  'sumZones',
  'ratio',
  'zone',
]

const CARD_META = {
  omission: { title: '遗漏排行', desc: '当前遗漏最大，追冷、防过热参考' },
  hot: { title: '热号', desc: '近 30 期开出 ≥8 次' },
  cold: { title: '冷号', desc: '当前遗漏 ≥8 期，关注回补节奏' },
  repeat: { title: '重号走势', desc: '每期与上期重复个数' },
  consecutive: { title: '连号组数', desc: '相邻号码成组数量' },
  sum: { title: '和值走势', desc: '近 30 期和值，理论均值约 810' },
  sumZones: { title: '和值区间', desc: '近 100 期和值落点分布' },
  ratio: { title: '奇偶 · 大小', desc: '近 30 期每期结构' },
  zone: { title: '四区出号', desc: '最新期 vs 近 30 期均值' },
}

function loadCardOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (
      Array.isArray(saved)
      && saved.length === DEFAULT_CARD_ORDER.length
      && saved.every((id) => DEFAULT_CARD_ORDER.includes(id))
      && new Set(saved).size === saved.length
    ) {
      return saved
    }
  } catch {
    /* ignore */
  }
  return [...DEFAULT_CARD_ORDER]
}

const loading = ref(true)
const error = ref('')
const dataUpdatedAt = ref('')
const report = ref(null)
const cardOrder = ref(loadCardOrder())
const draggingId = ref(null)
const dragSnapshotHeight = ref(0)

const { statTip, statTipRef, showStatTip, hideStatTip } = useStatTip()
const { trigger: triggerCopied, isActive: isCopied } = useActionFeedback()

const consecutiveCopyText = computed(() => {
  const groups = report.value?.overview?.latestConsecutiveGroups
  if (!groups?.length) return ''
  return groups
    .flat()
    .sort((a, b) => a - b)
    .map((num) => formatBall(num))
    .join(' ')
})

const repeatCopyText = computed(() => {
  const nums = report.value?.overview?.latestRepeatNumbers
  if (!nums?.length) return ''
  return nums.map((num) => formatBall(num)).join(' ')
})

const deepColdCopyText = computed(() => {
  const nums = report.value?.deepColdNumbers
  if (!nums?.length) return ''
  return nums.map((num) => formatBall(num)).join(' ')
})

async function copyNumbers(key, text) {
  if (!text) return
  const ok = await copyText(text)
  if (!ok) {
    notifyError('复制失败')
    return
  }
  triggerCopied(key)
  notifySuccess('复制成功')
}

function showRepeatTip(event) {
  if (!report.value) return
  const balls = report.value.overview.latestRepeatNumbers || []
  showStatTip(event, {
    key: 'repeat',
    balls,
    empty: balls.length ? undefined : '暂无重号',
  })
}

function showConsecutiveTip(event) {
  if (!report.value) return
  const groups = report.value.overview.latestConsecutiveGroups || []
  showStatTip(event, {
    key: 'consecutive',
    groups,
    empty: groups.length ? undefined : '暂无连号组',
  })
}

function showDeepColdTip(event) {
  if (!report.value) return
  const balls = report.value.deepColdNumbers || []
  showStatTip(event, {
    key: 'deep-cold',
    balls,
    empty: balls.length ? undefined : '暂无深冷号码',
  })
}

const cardEls = {}
let dragState = null
let orderBeforeDrag = null
let ghostNode = null

function reportChartEntry(cardId) {
  return getReportChartEntry(cardId)
}

function reportChartData(cardId) {
  const entry = reportChartEntry(cardId)
  if (!entry?.dataKey || !report.value) return []
  return report.value[entry.dataKey] || []
}

function setCardRef(id, el) {
  if (el) cardEls[id] = el
  else delete cardEls[id]
}

function cardDesc(id) {
  const meta = CARD_META[id]
  if (!meta || !report.value) return meta?.desc || ''
  if (id === 'hot') return `近 ${report.value.overview.trendWindow} 期开出 ≥8 次`
  if (id === 'sum') return `近 ${report.value.overview.trendWindow} 期和值，理论均值约 810`
  if (id === 'sumZones') return `近 ${report.value.overview.sampleWindow} 期和值落点分布`
  if (id === 'ratio') return `近 ${report.value.overview.trendWindow} 期每期结构`
  if (id === 'zone') return `最新期 vs 近 ${report.value.overview.trendWindow} 期均值`
  return meta.desc
}

function saveCardOrder() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cardOrder.value))
}

function findDropTarget(clientX, clientY) {
  const nodes = document.elementsFromPoint(clientX, clientY)
  for (const node of nodes) {
    if (node.closest?.('.report-drag-ghost')) continue
    const card = node.closest?.('[data-report-card]')
    if (!card) continue
    const id = card.dataset.reportCard
    if (id && id !== draggingId.value) return id
  }
  return null
}

function createDragGhost(card) {
  removeDragGhost()
  ghostNode = card.cloneNode(true)
  ghostNode.classList.add('report-drag-ghost')
  ghostNode.removeAttribute('data-report-card')
  ghostNode.style.width = `${dragState.width}px`
  ghostNode.style.height = `${dragState.height}px`
  ghostNode.style.left = `${dragState.startX - dragState.offsetX}px`
  ghostNode.style.top = `${dragState.startY - dragState.offsetY}px`
  document.body.appendChild(ghostNode)
}

function updateDragGhost(event) {
  if (!ghostNode || !dragState) return
  ghostNode.style.left = `${event.clientX - dragState.offsetX}px`
  ghostNode.style.top = `${event.clientY - dragState.offsetY}px`
}

function removeDragGhost() {
  ghostNode?.remove()
  ghostNode = null
}

function applyPreviewMove(targetId) {
  const fromId = draggingId.value
  if (!fromId || !targetId || fromId === targetId) return

  const order = [...cardOrder.value]
  const fromIdx = order.indexOf(fromId)
  const toIdx = order.indexOf(targetId)
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return

  order.splice(fromIdx, 1)
  order.splice(toIdx, 0, fromId)
  cardOrder.value = order
}

function endDrag(save) {
  if (save && dragState?.active) {
    const changed = orderBeforeDrag
      && orderBeforeDrag.some((id, i) => id !== cardOrder.value[i])
    if (changed) saveCardOrder()
  } else if (orderBeforeDrag) {
    cardOrder.value = [...orderBeforeDrag]
  }

  window.removeEventListener('keydown', onDragKeyDown)
  clearDragListeners()
  removeDragGhost()
  dragState = null
  draggingId.value = null
  dragSnapshotHeight.value = 0
  orderBeforeDrag = null
}

function onDragKeyDown(event) {
  if (event.key !== 'Escape' || !dragState?.active) return
  endDrag(false)
}

function onDragPointerMove(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return

  const dx = event.clientX - dragState.startX
  const dy = event.clientY - dragState.startY

  if (!dragState.active) {
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    dragState.active = true
    draggingId.value = dragState.id
    dragSnapshotHeight.value = Math.round(dragState.height)
    createDragGhost(cardEls[dragState.id])
  }

  event.preventDefault()
  updateDragGhost(event)

  const targetId = findDropTarget(event.clientX, event.clientY)
  if (targetId && targetId !== dragState.hoverTarget) {
    dragState.hoverTarget = targetId
    applyPreviewMove(targetId)
  }
}

function onDragPointerEnd(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return

  const grip = dragState.gripEl
  if (grip?.hasPointerCapture?.(event.pointerId)) {
    grip.releasePointerCapture(event.pointerId)
  }

  endDrag(true)
}

function clearDragListeners() {
  window.removeEventListener('pointermove', onDragPointerMove)
  window.removeEventListener('pointerup', onDragPointerEnd)
  window.removeEventListener('pointercancel', onDragPointerEnd)
}

function onGripPointerDown(id, event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return

  const card = cardEls[id]
  if (!card) return

  event.preventDefault()
  event.stopPropagation()

  orderBeforeDrag = [...cardOrder.value]

  const rect = card.getBoundingClientRect()
  dragState = {
    id,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    width: rect.width,
    height: rect.height,
    active: false,
    hoverTarget: null,
    gripEl: event.currentTarget,
  }

  event.currentTarget.setPointerCapture(event.pointerId)
  window.addEventListener('pointermove', onDragPointerMove)
  window.addEventListener('pointerup', onDragPointerEnd)
  window.addEventListener('pointercancel', onDragPointerEnd)
  window.addEventListener('keydown', onDragKeyDown)
}

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    const data = await loadLotteryDataLocalFirst()
    dataUpdatedAt.value = data.updatedAtText || ''
    report.value = buildReportSnapshot(data.records)
  } catch (err) {
    error.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  clearDragListeners()
  removeDragGhost()
})

function omissionLevel(value) {
  if (value >= 20) return 'deep'
  if (value >= 15) return 'high'
  if (value >= 8) return 'mid'
  return 'low'
}
</script>

<template>
  <main class="main report-main">
    <header class="report-header">
      <div>
        <h1>数据报表</h1>
        <p
          v-if="report"
          class="report-meta"
        >
          快乐8选号规律 · 共 {{ report.overview.totalIssues }} 期 · 最新 {{ report.overview.latestIssue }}（{{ report.overview.latestDate }}）
          <template v-if="dataUpdatedAt"> · 更新于 {{ dataUpdatedAt }}</template>
        </p>
      </div>
    </header>

    <div
      v-if="loading"
      class="state-card"
    >
      <div class="spinner" />
      <span>正在加载开奖数据...</span>
    </div>

    <div
      v-else-if="error"
      class="state-card error-card"
    >
      <p>{{ error }}</p>
    </div>

    <template v-else-if="report">
      <section class="report-stats">
        <article class="stat-card stat-sum">
          <div class="stat-label">最新期和值</div>
          <div class="stat-value">{{ report.overview.latestSum }}</div>
          <div class="stat-hint">20 码合计，常看区间 750-870</div>
        </article>
        <article
          class="stat-card stat-repeat"
          @mouseenter="showRepeatTip"
          @mouseleave="hideStatTip"
        >
          <div class="stat-card-top">
            <div class="stat-label">最新期重号</div>
            <CopyButton
              v-if="repeatCopyText"
              size="sm"
              :copied="isCopied('repeat')"
              title="复制重号号码"
              @click="copyNumbers('repeat', repeatCopyText)"
            />
          </div>
          <div class="stat-value">{{ report.overview.latestRepeat }}</div>
          <div class="stat-hint">与上期重复号码个数，悬停查看</div>
        </article>
        <article
          class="stat-card stat-consecutive"
          @mouseenter="showConsecutiveTip"
          @mouseleave="hideStatTip"
        >
          <div class="stat-card-top">
            <div class="stat-label">最新期连号组</div>
            <CopyButton
              v-if="consecutiveCopyText"
              size="sm"
              :copied="isCopied('consecutive')"
              title="复制连号号码"
              @click="copyNumbers('consecutive', consecutiveCopyText)"
            />
          </div>
          <div class="stat-value">{{ report.overview.latestConsecutive }}</div>
          <div class="stat-hint">相邻号码成组数量，悬停查看</div>
        </article>
        <article
          class="stat-card stat-cold"
          @mouseenter="showDeepColdTip"
          @mouseleave="hideStatTip"
        >
          <div class="stat-card-top">
            <div class="stat-label">深冷号码</div>
            <CopyButton
              v-if="deepColdCopyText"
              size="sm"
              :copied="isCopied('deep-cold')"
              title="复制深冷号码"
              @click="copyNumbers('deep-cold', deepColdCopyText)"
            />
          </div>
          <div class="stat-value">{{ report.overview.deepColdCount }}</div>
          <div class="stat-hint">当前遗漏 ≥20 期，悬停查看</div>
        </article>
      </section>

      <StatHelpPopover
        :tip="statTip"
        :tip-ref="statTipRef"
      />

      <div class="report-workspace">
        <p class="report-drag-hint">拖动把手：卡片跟手移动，网格实时预览落位；松手保存，Esc 撤销</p>

        <div class="report-grid">
        <section
          v-for="cardId in cardOrder"
          :key="cardId"
          :ref="(el) => setCardRef(cardId, el)"
          class="report-card"
          :class="{ 'is-dragging': draggingId === cardId }"
          :style="draggingId === cardId && dragSnapshotHeight
            ? { '--drag-snapshot-h': `${dragSnapshotHeight}px` }
            : undefined"
          :data-report-card="cardId"
        >
          <header class="report-card-head">
            <button
              type="button"
              class="report-card-grip"
              aria-label="拖动排序"
              @pointerdown="onGripPointerDown(cardId, $event)"
            >
              ⠿
            </button>
            <h2>{{ CARD_META[cardId].title }}</h2>
          </header>
          <p class="report-desc">{{ cardDesc(cardId) }}</p>

          <div class="report-card-body">
          <div
            v-if="cardId === 'omission'"
            class="h-bars"
          >
            <div
              v-for="item in report.omissionRank.slice(0, 10)"
              :key="item.num"
              class="h-bar-row"
            >
              <span class="h-bar-label h-bar-label--num">{{ formatBall(item.num) }}</span>
              <div class="h-bar-track">
                <div
                  class="h-bar-fill"
                  :class="`h-bar-fill--omit-${omissionLevel(item.currentOmission)}`"
                  :style="{ width: `${(item.currentOmission / report.maxOmission) * 100}%` }"
                />
              </div>
              <span class="h-bar-value">{{ item.currentOmission }}期</span>
            </div>
          </div>

          <ReportTrendChart
            v-else-if="reportChartEntry(cardId)"
            :data="reportChartData(cardId)"
            :config="reportChartEntry(cardId).trend"
          />

          <div
            v-else-if="cardId === 'hot'"
            class="h-bars"
          >
            <div
              v-for="item in report.hot"
              :key="item.num"
              class="h-bar-row"
            >
              <span class="h-bar-label h-bar-label--num">{{ formatBall(item.num) }}</span>
              <div class="h-bar-track">
                <div
                  class="h-bar-fill h-bar-fill--hot"
                  :style="{ width: `${(item.count / report.maxHotCount) * 100}%` }"
                />
              </div>
              <span class="h-bar-value">{{ item.count }}次</span>
            </div>
          </div>

          <div
            v-else-if="cardId === 'cold'"
            class="h-bars"
          >
            <div
              v-for="item in report.cold"
              :key="item.num"
              class="h-bar-row"
            >
              <span class="h-bar-label h-bar-label--num">{{ formatBall(item.num) }}</span>
              <div class="h-bar-track">
                <div
                  class="h-bar-fill h-bar-fill--cold"
                  :style="{ width: `${(item.currentOmission / report.maxOmission) * 100}%` }"
                />
              </div>
              <span class="h-bar-value">{{ item.currentOmission }}期</span>
            </div>
          </div>

          <div
            v-else-if="cardId === 'sumZones'"
            class="h-bars h-bars--foot"
          >
            <div
              v-for="zone in report.sumZones"
              :key="zone.label"
              class="h-bar-row h-bar-row--label"
            >
              <span class="h-bar-label h-bar-label--short">{{ zone.label }}</span>
              <div class="h-bar-track">
                <div
                  class="h-bar-fill h-bar-fill--sum"
                  :style="{ width: `${(zone.count / report.maxSumZone) * 100}%` }"
                />
              </div>
              <span class="h-bar-value">{{ zone.count }}期</span>
            </div>
            <p class="report-zone-hint">{{ report.sumZones.map(z => z.hint).join(' · ') }}</p>
          </div>

          <div
            v-else-if="cardId === 'ratio'"
            class="ratio-panels"
          >
            <div class="ratio-panel">
              <h3>奇偶</h3>
              <div class="stacked-bars">
                <div
                  v-for="row in report.oddTrend"
                  :key="`odd-${row.issue}`"
                  class="stacked-bar-row"
                  :title="`第${row.issue}期 奇${row.odd} 偶${row.even}`"
                >
                  <div
                    class="stacked-seg stacked-seg--odd"
                    :style="{ height: `${(row.odd / 20) * 100}%` }"
                  />
                  <div
                    class="stacked-seg stacked-seg--even"
                    :style="{ height: `${(row.even / 20) * 100}%` }"
                  />
                </div>
              </div>
            </div>
            <div class="ratio-panel">
              <h3>大小</h3>
              <div class="stacked-bars">
                <div
                  v-for="row in report.sizeTrend"
                  :key="`size-${row.issue}`"
                  class="stacked-bar-row"
                  :title="`第${row.issue}期 小${row.small} 大${row.big}`"
                >
                  <div
                    class="stacked-seg stacked-seg--small"
                    :style="{ height: `${(row.small / 20) * 100}%` }"
                  />
                  <div
                    class="stacked-seg stacked-seg--big"
                    :style="{ height: `${(row.big / 20) * 100}%` }"
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            v-else-if="cardId === 'zone'"
            class="zone-compare"
          >
            <div
              v-for="zone in report.zoneAvg"
              :key="zone.label"
              class="zone-compare-item"
            >
              <div class="zone-compare-head">
                <strong>{{ zone.label }}</strong>
                <span>{{ zone.range }}</span>
              </div>
              <div class="zone-compare-bars">
                <div class="zone-bar-row">
                  <span>最新</span>
                  <div class="h-bar-track">
                    <div
                      class="h-bar-fill h-bar-fill--zone"
                      :style="{ width: `${(zone.latest / report.maxZoneLatest) * 100}%` }"
                    />
                  </div>
                  <span>{{ zone.latest }}</span>
                </div>
                <div class="zone-bar-row">
                  <span>均值</span>
                  <div class="h-bar-track">
                    <div
                      class="h-bar-fill h-bar-fill--zone-avg"
                      :style="{ width: `${(zone.avg / 5) * 100}%` }"
                    />
                  </div>
                  <span>{{ zone.avg }}</span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>
        </div>
      </div>

      <p class="report-disclaimer">以上均为历史开奖统计与规律参考，不构成投注建议。请以官方开奖公告为准。</p>
    </template>
  </main>
</template>

<style scoped>
.report-main {
  flex: 1;
  min-height: 0;
  gap: var(--spacing-md);
}

.report-header h1 {
  margin: 0 0 var(--spacing-xs);
  font-size: var(--font-size-title-lg);
  font-weight: 800;
}

.report-meta {
  margin: 0;
  font-size: var(--font-size-small);
  color: var(--text-dim);
}

.report-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  flex-shrink: 0;
}

.report-stats .stat-card {
  position: relative;
  overflow: hidden;
  padding: var(--spacing-lg) 18px;
  border-radius: var(--radius-md);
  border: var(--border-width) solid var(--border);
  background: var(--card);
  box-shadow: var(--shadow-soft);
}

.report-stats .stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}

.report-stats .stat-sum {
  background: linear-gradient(160deg, var(--link-bg) 0%, var(--card) 58%);
}

.report-stats .stat-sum::before {
  background: var(--link);
}

.report-stats .stat-repeat {
  background: linear-gradient(160deg, var(--primary-bg) 0%, var(--card) 58%);
}

.report-stats .stat-repeat::before {
  background: var(--primary);
}

.report-stats .stat-consecutive {
  background: linear-gradient(160deg, var(--warning-bg) 0%, var(--card) 58%);
}

.report-stats .stat-consecutive::before {
  background: var(--warning-strong);
}

.report-stats .stat-cold {
  background: linear-gradient(160deg, var(--info-bg) 0%, var(--card) 58%);
}

.report-stats .stat-cold::before {
  background: var(--info);
}

.report-stats .stat-label {
  margin-bottom: 6px;
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--text-soft);
}

.report-stats .stat-value {
  font-size: var(--font-size-title-lg);
  font-weight: 800;
  line-height: 1;
}

.report-stats .stat-sum .stat-value { color: var(--link); }
.report-stats .stat-repeat .stat-value { color: var(--primary); }
.report-stats .stat-consecutive .stat-value { color: var(--warning-strong); }
.report-stats .stat-cold .stat-value { color: var(--info); }

.report-stats .stat-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 6px;
}

.report-stats .stat-card-top .stat-label {
  margin-bottom: 0;
}

.report-stats .stat-hint {
  margin-top: 6px;
  font-size: var(--font-size-hint);
  color: var(--text-dim);
  line-height: 1.4;
}

.report-workspace {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.report-drag-hint {
  flex-shrink: 0;
  margin: 0;
  font-size: var(--font-size-hint);
  color: var(--text-dim);
  line-height: 1.25;
}

.report-grid {
  --report-bar-row-h: 18px;
  --report-bar-gap: 6px;
  --report-bar-rows: 10;
  --report-body-h: calc(
    var(--report-bar-rows) * var(--report-bar-row-h) +
    (var(--report-bar-rows) - 1) * var(--report-bar-gap)
  );
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--gap-card);
  align-items: stretch;
}

.report-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  align-self: start;
  width: 100%;
  padding: var(--spacing-lg);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
  box-shadow: var(--shadow-soft);
  transition: box-shadow 0.15s ease, opacity 0.15s ease;
}

.report-card.is-dragging {
  opacity: 0.22;
  border-style: dashed;
  box-shadow: none;
  align-self: start;
  height: var(--drag-snapshot-h);
  min-height: var(--drag-snapshot-h);
  max-height: var(--drag-snapshot-h);
  overflow: hidden;
}

:global(.report-drag-ghost) {
  position: fixed;
  z-index: 300;
  margin: 0;
  box-sizing: border-box;
  overflow: hidden;
  pointer-events: none;
  opacity: 0.96;
  cursor: grabbing;
  box-shadow: var(--shadow-elevated, 0 12px 32px rgba(0, 0, 0, 0.18));
  transform: rotate(0.5deg);
}

.report-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: calc(var(--spacing-lg) * -1) calc(var(--spacing-lg) * -1) 0;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-card) var(--radius-card) 0 0;
}

.report-card-grip {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text-dim);
  font-size: 14px;
  line-height: 1;
  cursor: grab;
  touch-action: none;
}

.report-card-grip:hover {
  background: var(--color-surface-muted);
  color: var(--text-soft);
}

.report-card-grip:active {
  cursor: grabbing;
}

.report-card h2 {
  margin: 0;
  font-size: var(--font-size-subtitle);
  font-weight: 700;
}

.report-desc {
  margin: 0;
  font-size: var(--font-size-hint);
  color: var(--text-dim);
  line-height: 1.25;
}

.report-card-body {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: var(--report-body-h);
  min-height: var(--report-body-h);
}

.report-card-body :deep(.trend-chart) {
  flex: 1;
  min-height: 0;
  height: 100%;
}

.h-bars {
  display: flex;
  flex-direction: column;
  gap: var(--report-bar-gap);
  flex: 1;
  height: 100%;
  min-height: 0;
}

.h-bars--foot .report-zone-hint {
  margin-top: auto;
}

.h-bar-row {
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  gap: 6px;
  height: var(--report-bar-row-h);
  flex-shrink: 0;
}

.h-bar-row--label {
  grid-template-columns: 44px 1fr 40px;
}

.h-bar-label--short {
  white-space: nowrap;
  font-size: 11px;
  line-height: 1;
}

.h-bar-label {
  font-size: var(--font-size-hint);
  font-weight: 600;
  color: var(--text-soft);
}

.h-bar-label--num {
  font-variant-numeric: tabular-nums;
}

.h-bar-track {
  height: 8px;
  border-radius: var(--radius-pill);
  background: var(--color-surface-muted);
  overflow: hidden;
}

.h-bar-fill {
  height: 100%;
  border-radius: var(--radius-pill);
  min-width: 2px;
}

.h-bar-fill--hot { background: var(--primary); }
.h-bar-fill--cold { background: var(--info); }
.h-bar-fill--sum { background: var(--accent); }
.h-bar-fill--zone { background: var(--link); }
.h-bar-fill--zone-avg { background: var(--border-strong); }
.h-bar-fill--omit-low { background: var(--border-strong); }
.h-bar-fill--omit-mid { background: var(--warning-strong); }
.h-bar-fill--omit-high { background: var(--primary); }
.h-bar-fill--omit-deep { background: var(--danger); }

.h-bar-value {
  font-size: var(--font-size-hint);
  font-weight: 700;
  color: var(--text-dim);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.report-zone-hint {
  margin: 0;
  font-size: 10px;
  color: var(--text-dim);
}

.ratio-panels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-sm);
  flex: 1;
  height: 100%;
  min-height: 0;
}

.ratio-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
  min-height: 0;
}

.ratio-panel h3 {
  margin: 0;
  font-size: var(--font-size-hint);
  font-weight: 700;
  color: var(--text-soft);
}

.stacked-bars {
  display: flex;
  align-items: flex-end;
  gap: 1px;
  flex: 1;
  min-height: 0;
  padding: 4px;
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-alt);
}

.stacked-bar-row {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  min-width: 2px;
  gap: 1px;
}

.stacked-seg {
  width: 100%;
  border-radius: 1px 1px 0 0;
}

.stacked-seg--odd { background: var(--info); }
.stacked-seg--even { background: var(--border-strong); }
.stacked-seg--small { background: var(--ball-b); }
.stacked-seg--big { background: var(--ball-a); }

.zone-compare {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-sm);
  flex: 1;
  height: 100%;
  min-height: 0;
}

.zone-compare-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
  min-height: 0;
  padding: var(--spacing-sm);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-alt);
}

.zone-compare-head {
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: 10px;
  color: var(--text-dim);
}

.zone-compare-head strong {
  color: var(--text);
  font-size: var(--font-size-hint);
}

.zone-compare-bars {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  justify-content: center;
}

.zone-bar-row {
  display: grid;
  grid-template-columns: 26px 1fr 22px;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--text-dim);
}

.report-disclaimer {
  flex-shrink: 0;
  margin: auto 0 0;
  font-size: var(--font-size-hint);
  color: var(--text-dim);
  line-height: 1.25;
  text-align: center;
}

@media (max-width: 860px) {
  .report-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .ratio-panels,
  .zone-compare {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }
}
</style>
