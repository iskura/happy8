<script setup>
import { computed, inject, onBeforeUnmount, reactive, ref, watch } from 'vue'
import {
  addNumberRecord,
  buildNumberRecordStats,
  createNumberRecord,
  deleteNumberRecord,
  loadNumberRecords,
} from '../utils/numberRecordStorage.js'
import { exportNumberRecordsToExcel } from '../utils/exportNumberRecords.js'
import { loadLotteryDataLocalFirst } from '../api/lottery.js'
import { notifyError, notifySuccess } from '../utils/uiMessage.js'
import IssueSelect from './IssueSelect.vue'
import DateRangePicker from './DateRangePicker.vue'
import './number-record-panel.css'

const injectedLotteryRecords = inject('lotteryRecords', null)

const DRAG_THRESHOLD = 6

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const activeTab = ref('records')
const searchIssue = ref('')
const searchDateStart = ref('')
const searchDateEnd = ref('')
const statsSearchIssue = ref('')
const statsSearchDateStart = ref('')
const statsSearchDateEnd = ref('')
const records = ref([])
const lotteryRecords = ref([])
const formError = ref('')
const panelRef = ref(null)
const dragBarRef = ref(null)
const panelPos = ref(null)
const isDragging = ref(false)

let dragState = null

const panelStyle = computed(() => {
  if (!panelPos.value) return null
  return {
    left: `${panelPos.value.left}px`,
    top: `${panelPos.value.top}px`,
  }
})

const form = reactive({
  issue: '',
  spent: '',
  numberCount: '',
  profit: '',
  note: '',
})

const stats = computed(() => buildNumberRecordStats(records.value))

const availableIssueRecords = computed(() => {
  const recorded = new Set(records.value.map((item) => item.issue))
  return lotteryRecords.value.filter((item) => !recorded.has(item.issue))
})

const issueDateByIssue = computed(() => {
  const map = new Map()
  for (const item of lotteryRecords.value) {
    map.set(item.issue, item.date)
  }
  return map
})

const availableDates = computed(() => {
  const dates = lotteryRecords.value.map((item) => item.date).filter(Boolean)
  return [...new Set(dates)].sort()
})

const hasActiveSearch = computed(() => (
  Boolean(searchIssue.value.trim() || searchDateStart.value || searchDateEnd.value)
))

const filteredRecords = computed(() => filterRecordsBySearch(
  records.value,
  searchIssue.value,
  searchDateStart.value,
  searchDateEnd.value,
))

const statsHasActiveSearch = computed(() => (
  Boolean(statsSearchIssue.value.trim() || statsSearchDateStart.value || statsSearchDateEnd.value)
))

const statsFilteredRecords = computed(() => filterRecordsBySearch(
  records.value,
  statsSearchIssue.value,
  statsSearchDateStart.value,
  statsSearchDateEnd.value,
))

function filterRecordsBySearch(list, issueKeyword, dateStart, dateEnd) {
  const issue = issueKeyword.trim()
  return list.filter((item) => {
    if (issue && item.issue !== issue) return false
    if (dateStart || dateEnd) {
      const recordDate = issueDateByIssue.value.get(item.issue) || formatDate(item.createdAt)
      if (dateStart && recordDate < dateStart) return false
      if (dateEnd && recordDate > dateEnd) return false
    }
    return true
  })
}

function getRecordDate(item) {
  return issueDateByIssue.value.get(item.issue) || formatDate(item.createdAt)
}

function syncLotteryRecordsFromInject() {
  const list = injectedLotteryRecords?.value
  if (!list?.length) return false
  lotteryRecords.value = list
  return true
}

async function loadLotteryRecords() {
  if (syncLotteryRecordsFromInject()) return

  try {
    const data = await loadLotteryDataLocalFirst()
    lotteryRecords.value = data.records
  } catch {
    if (!syncLotteryRecordsFromInject()) {
      lotteryRecords.value = []
    }
  }
}

function refreshRecords() {
  records.value = loadNumberRecords()
}

function resetForm() {
  form.issue = ''
  form.spent = ''
  form.numberCount = ''
  form.profit = ''
  form.note = ''
  formError.value = ''
}

function resetSearch() {
  searchIssue.value = ''
  searchDateStart.value = ''
  searchDateEnd.value = ''
}

function resetStatsSearch() {
  statsSearchIssue.value = ''
  statsSearchDateStart.value = ''
  statsSearchDateEnd.value = ''
}

function formatMoney(value) {
  const num = Number(value) || 0
  const prefix = num > 0 ? '+' : ''
  return `${prefix}${num.toFixed(2)}`
}

function formatDate(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function onSubmitRecord() {
  const issue = form.issue.trim()
  if (!issue) {
    formError.value = '请填写期号'
    return
  }
  if (records.value.some((item) => item.issue === issue)) {
    formError.value = '该期号已有记录'
    return
  }

  const record = createNumberRecord({
    issue,
    spent: form.spent,
    numberCount: form.numberCount,
    profit: form.profit,
    note: form.note,
  })

  records.value = addNumberRecord(record)
  resetForm()
}

function confirmRemoveRecord(item) {
  const label = item?.issue ? `第 ${item.issue} 期` : '该条'
  if (!window.confirm(`确定删除${label}记录？此操作不可恢复。`)) return
  records.value = deleteNumberRecord(item.id)
}

function onExportExcel() {
  if (!records.value.length) {
    notifyError('暂无记录可导出')
    return
  }
  try {
    exportNumberRecordsToExcel(records.value)
    notifySuccess('已导出 Excel 表格')
  } catch {
    notifyError('导出失败，请稍后重试')
  }
}

function resetPanelPosition() {
  panelPos.value = null
}

function clearDragListeners() {
  const bar = dragBarRef.value
  if (!bar) return
  bar.removeEventListener('pointermove', onDragPointerMove)
  bar.removeEventListener('pointerup', onDragPointerEnd)
  bar.removeEventListener('pointercancel', onDragPointerEnd)
}

function onDragPointerMove(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return

  const dx = event.clientX - dragState.startX
  const dy = event.clientY - dragState.startY

  if (!dragState.active) {
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    dragState.active = true
    isDragging.value = true
  }

  event.preventDefault()

  const panel = panelRef.value
  if (!panel || !panelPos.value) return

  const rect = panel.getBoundingClientRect()
  const pad = 8
  const maxLeft = Math.max(pad, window.innerWidth - rect.width - pad)
  const maxTop = Math.max(pad, window.innerHeight - rect.height - pad)

  panelPos.value = {
    left: Math.min(Math.max(pad, dragState.originLeft + dx), maxLeft),
    top: Math.min(Math.max(pad, dragState.originTop + dy), maxTop),
  }
}

function onDragPointerEnd(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return

  const bar = dragBarRef.value
  if (bar?.hasPointerCapture?.(event.pointerId)) {
    bar.releasePointerCapture(event.pointerId)
  }

  clearDragListeners()
  dragState = null
  isDragging.value = false
}

function onDragPointerDown(event) {
  if (!canDragPanel()) return
  if (event.pointerType === 'mouse' && event.button !== 0) return

  const panel = panelRef.value
  const bar = dragBarRef.value
  if (!panel || !bar) return

  event.preventDefault()

  const rect = panel.getBoundingClientRect()
  if (!panelPos.value) {
    panelPos.value = { left: rect.left, top: rect.top }
  }

  dragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originLeft: panelPos.value.left,
    originTop: panelPos.value.top,
    active: false,
  }

  bar.setPointerCapture(event.pointerId)
  bar.addEventListener('pointermove', onDragPointerMove)
  bar.addEventListener('pointerup', onDragPointerEnd)
  bar.addEventListener('pointercancel', onDragPointerEnd)
}

function canDragPanel() {
  return window.matchMedia('(min-width: 642px)').matches
}

function stopDragging() {
  clearDragListeners()
  dragState = null
  isDragging.value = false
}

function switchTab(tab) {
  if (activeTab.value === tab) return
  activeTab.value = tab
  if (tab === 'stats') {
    resetForm()
  }
}

watch(
  () => props.open,
  (visible) => {
    if (!visible) {
      stopDragging()
      return
    }
    refreshRecords()
    loadLotteryRecords()
    activeTab.value = 'records'
    resetSearch()
    resetStatsSearch()
    resetForm()
    resetPanelPosition()
  },
)

if (injectedLotteryRecords) {
  watch(injectedLotteryRecords, (list) => {
    if (props.open && list?.length) {
      lotteryRecords.value = list
    }
  })
}

onBeforeUnmount(() => {
  stopDragging()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="nrp-mask">
      <button
        v-if="open"
        type="button"
        class="thyuu-dialog-mask"
        aria-label="关闭号码记录"
        @click="emit('close')"
      />
    </Transition>

    <Transition name="nrp-dialog">
      <aside
        v-if="open"
        id="global-panel"
        ref="panelRef"
        class="thyuu-dialog global-panel"
        :class="{
          'is-custom-position': panelPos,
          'is-dragging': isDragging,
        }"
        :style="panelStyle"
        role="dialog"
        aria-modal="true"
        aria-label="号码记录"
      >
        <div class="side-come">
          <button
            ref="dragBarRef"
            type="button"
            class="nrp-drag-handle"
            title="按住拖拽移动"
            aria-label="拖拽移动弹窗"
            @pointerdown="onDragPointerDown"
          >
            <span
              class="drag-grip"
              aria-hidden="true"
            >⋮⋮</span>
          </button>

          <div class="button welcome-tip">
            本地记录每期投入、注数与盈亏
          </div>

          <button
            type="button"
            class="export-btn"
            @click="onExportExcel"
          >
            导出 Excel
          </button>
        </div>

        <div class="nrp-tab-wrap">
          <div
            class="toggle-btn is-sidebar"
            role="tablist"
            aria-label="号码记录面板切换"
          >
            <i
              role="tab"
              tabindex="0"
              :class="{ 'is-active': activeTab === 'records' }"
              :aria-selected="activeTab === 'records'"
              @click="switchTab('records')"
              @keydown.enter.prevent="switchTab('records')"
              @keydown.space.prevent="switchTab('records')"
            >号码记录</i>
            <i
              role="tab"
              tabindex="0"
              :class="{ 'is-active': activeTab === 'stats' }"
              :aria-selected="activeTab === 'stats'"
              @click="switchTab('stats')"
              @keydown.enter.prevent="switchTab('stats')"
              @keydown.space.prevent="switchTab('stats')"
            >数据统计</i>
          </div>
        </div>

        <div class="toggle-area side-area no-scrollbar">
          <div
            v-show="activeTab === 'records'"
            class="side-switch is-guest"
          >
            <form
              class="nrp-search-bar"
              role="search"
              @submit.prevent
            >
              <label class="search-item search-item--issue">
                <span>期号</span>
                <IssueSelect
                  v-model="searchIssue"
                  :records="lotteryRecords"
                  clearable
                  tone="filter"
                  placeholder="不限"
                  search-placeholder="搜索期号或日期"
                  teleport
                  panel-class="nrp-select-panel"
                />
              </label>
              <label class="search-item search-item--date">
                <span>日期</span>
                <DateRangePicker
                  :start="searchDateStart"
                  :end="searchDateEnd"
                  :dates="availableDates"
                  teleport
                  panel-class="nrp-select-panel"
                  @update:start="searchDateStart = $event"
                  @update:end="searchDateEnd = $event"
                />
              </label>
              <button
                v-if="hasActiveSearch"
                type="button"
                class="search-reset"
                @click="resetSearch"
              >
                清除
              </button>
            </form>

            <section
              v-if="filteredRecords.length"
              class="recent-comment"
            >
              <ul class="no-scrollbar">
                <li
                  v-for="item in filteredRecords"
                  :key="item.id"
                >
                  <div
                    class="avatar"
                    aria-hidden="true"
                  >
                    {{ item.issue.slice(-2) }}
                  </div>
                  <div class="record-row">
                    <div class="record-main">
                      <cite>
                        第 {{ item.issue }} 期
                        <time>{{ formatDate(item.createdAt) }}</time>
                      </cite>
                      <p class="record-detail">
                        <span class="record-detail-core">
                          投入 <strong>¥{{ Number(item.spent).toFixed(2) }}</strong>
                          · 注数 <strong>{{ item.numberCount }}</strong>
                          · 盈亏
                          <strong :class="Number(item.profit) >= 0 ? 'profit-up' : 'profit-down'">
                            ¥{{ formatMoney(item.profit) }}
                          </strong>
                        </span><span
                          v-if="item.note"
                          class="record-note"
                          :title="item.note"
                        > · {{ item.note }}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      class="record-delete-btn"
                      title="删除此记录"
                      @click="confirmRemoveRecord(item)"
                    >
                      删除
                    </button>
                  </div>
                </li>
              </ul>
            </section>

            <section class="thyuu-block add-record">
              <h6 data-icon="＋">新增记录</h6>
              <form
                class="add-form"
                @submit.prevent="onSubmitRecord"
              >
                <div class="form-grid">
                  <label class="form-issue">
                    <span>期号<em class="nrp-required" aria-hidden="true">*</em></span>
                    <IssueSelect
                      v-model="form.issue"
                      :records="availableIssueRecords"
                      tone="filter"
                      placeholder="选择期号"
                      search-placeholder="搜索期号或日期"
                      teleport
                      panel-class="nrp-select-panel"
                    />
                  </label>
                  <label>
                    <span>投入<em class="nrp-required" aria-hidden="true">*</em></span>
                    <span class="nrp-input-unit">
                      <input
                        v-model="form.spent"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                      <span
                        class="nrp-input-unit-text"
                        aria-hidden="true"
                      >元</span>
                    </span>
                  </label>
                  <label>
                    <span>注数<em class="nrp-required" aria-hidden="true">*</em></span>
                    <span class="nrp-input-unit">
                      <input
                        v-model="form.numberCount"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                      />
                      <span
                        class="nrp-input-unit-text"
                        aria-hidden="true"
                      >注</span>
                    </span>
                  </label>
                  <label>
                    <span>盈亏<em class="nrp-required" aria-hidden="true">*</em></span>
                    <span class="nrp-input-unit">
                      <input
                        v-model="form.profit"
                        type="number"
                        step="0.01"
                        placeholder="正赚负亏"
                      />
                      <span
                        class="nrp-input-unit-text"
                        aria-hidden="true"
                      >元</span>
                    </span>
                  </label>
                </div>
                <label class="note-field">
                  <span>备注</span>
                  <input
                    v-model="form.note"
                    type="text"
                    placeholder="号码或玩法说明"
                  />
                </label>
                <p
                  v-if="formError"
                  class="form-error"
                >
                  {{ formError }}
                </p>
                <button
                  type="submit"
                  class="save-btn"
                >
                  保存记录
                </button>
              </form>
            </section>
          </div>

          <div
            v-show="activeTab === 'stats'"
            class="side-switch is-stats"
          >
            <form
              class="nrp-search-bar"
              role="search"
              @submit.prevent
            >
              <label class="search-item search-item--issue">
                <span>期号</span>
                <IssueSelect
                  v-model="statsSearchIssue"
                  :records="lotteryRecords"
                  clearable
                  tone="filter"
                  placeholder="不限"
                  search-placeholder="搜索期号或日期"
                  teleport
                  panel-class="nrp-select-panel"
                />
              </label>
              <label class="search-item search-item--date">
                <span>日期</span>
                <DateRangePicker
                  :start="statsSearchDateStart"
                  :end="statsSearchDateEnd"
                  :dates="availableDates"
                  teleport
                  panel-class="nrp-select-panel"
                  @update:start="statsSearchDateStart = $event"
                  @update:end="statsSearchDateEnd = $event"
                />
              </label>
              <button
                v-if="statsHasActiveSearch"
                type="button"
                class="search-reset"
                @click="resetStatsSearch"
              >
                清除
              </button>
            </form>

            <div class="nrp-records-table-wrap">
              <table class="nrp-records-table">
                <thead>
                  <tr>
                    <th>期号</th>
                    <th>日期</th>
                    <th>投入</th>
                    <th>注数</th>
                    <th>盈亏</th>
                    <th>备注</th>
                    <th class="nrp-col-action">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in statsFilteredRecords"
                    :key="item.id"
                  >
                    <td>{{ item.issue }}</td>
                    <td>{{ getRecordDate(item) }}</td>
                    <td>¥{{ Number(item.spent).toFixed(2) }}</td>
                    <td>{{ item.numberCount }}</td>
                    <td :class="Number(item.profit) >= 0 ? 'profit-up' : 'profit-down'">
                      ¥{{ formatMoney(item.profit) }}
                    </td>
                    <td
                      class="nrp-col-note"
                      :title="item.note || undefined"
                    >{{ item.note || '—' }}</td>
                    <td class="nrp-col-action">
                      <button
                        type="button"
                        class="record-delete-btn"
                        title="删除此记录"
                        @click="confirmRemoveRecord(item)"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p
                v-if="!statsFilteredRecords.length"
                class="nrp-table-empty"
              >
                {{ statsHasActiveSearch ? '没有匹配的记录' : '暂无本地记录' }}
              </p>
            </div>

            <section class="thyuu-block nrp-stats-summary">
              <h6 data-icon="◎">汇总统计</h6>
              <ul class="nrp-stats-grid no-scrollbar">
                <li>
                  <time>记录期数</time>
                  <span>{{ stats.totalIssues }} 期</span>
                </li>
                <li>
                  <time>总投入</time>
                  <span>¥{{ stats.totalSpent.toFixed(2) }}</span>
                </li>
                <li>
                  <time>总盈亏</time>
                  <span :class="stats.totalProfit >= 0 ? 'profit-up' : 'profit-down'">
                    ¥{{ formatMoney(stats.totalProfit) }}
                  </span>
                </li>
                <li>
                  <time>平均注数</time>
                  <span>{{ stats.avgNumbers.toFixed(1) }} 注</span>
                </li>
                <li>
                  <time>盈利期数</time>
                  <span>{{ stats.winCount }} 期</span>
                </li>
                <li>
                  <time>亏损期数</time>
                  <span>{{ stats.loseCount }} 期</span>
                </li>
                <li v-if="stats.totalIssues">
                  <time>平均每期盈亏</time>
                  <span :class="stats.totalProfit >= 0 ? 'profit-up' : 'profit-down'">
                    ¥{{ formatMoney(stats.totalProfit / stats.totalIssues) }}
                  </span>
                </li>
              </ul>
            </section>
          </div>
        </div>

        <div
          v-if="records.length"
          class="nrp-panel-summary"
          aria-label="记录汇总"
        >
          <i
            class="count-spent"
            data-tip="总投入"
            aria-label="总投入"
          >¥{{ stats.totalSpent.toFixed(2) }}</i>
          <i
            class="count-profit"
            :class="stats.totalProfit >= 0 ? 'is-up' : 'is-down'"
            data-tip="总盈亏"
            aria-label="总盈亏"
          >¥{{ formatMoney(stats.totalProfit) }}</i>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
