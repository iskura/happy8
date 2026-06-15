<script setup>
import { computed, ref, onBeforeUnmount, onMounted } from 'vue'
import {
  loadLotteryDataLocalFirst,
  refreshLotteryDataFromUpstream,
} from './api/lottery.js'
import { useLotteryAutoRefresh } from './composables/useLotteryAutoRefresh.js'
import { getScheduleLabel, shouldAutoRefresh } from './utils/lotteryCache.js'
import { notifyError, notifySuccess } from './utils/uiMessage.js'
import { analyzeNumbers } from './utils/numberPicker.js'
import ResultPanel from './components/ResultPanel.vue'
import DetailTable from './components/DetailTable.vue'
import ChartSection from './components/ChartSection.vue'

const REST_REMIND_MS = 60 * 60 * 1000
const SESSION_START_KEY = 'happy8-session-start'
const REST_SHOWN_KEY = 'happy8-rest-shown'

const loading = ref(true)
const refreshing = ref(false)
const error = ref('')
const records = ref([])
const result = ref(null)
const lookback = ref(9)
const selectedIssue = ref('')
const dataSource = ref('')
const dataUpdatedAt = ref('')
const showRestReminder = ref(false)
const showLoveModal = ref(false)
const loveModalShake = ref(false)

const refreshScheduleLabel = getScheduleLabel()

const dataSourceLabel = computed(() => {
  if (dataSource.value === 'cache') return '本地缓存'
  if (dataSource.value === 'bundled') return '内置数据'
  if (dataSource.value === 'upstream') return '最新数据'
  return ''
})

let restReminderTimer = null
let loveShakeTimer = null
let autoRefreshRunning = false

function getMaxLookback(issue = selectedIssue.value) {
  if (!records.value.length) return 0
  const index = issue
    ? records.value.findIndex((record) => record.issue === issue)
    : 0
  if (index < 0) return 0
  return records.value.length - index - 1
}

function runAnalysis() {
  if (!records.value.length) return

  const maxLookback = getMaxLookback()
  if (maxLookback < 1) {
    throw new Error('所选期号之前没有足够历史数据')
  }

  if (lookback.value > maxLookback) {
    lookback.value = maxLookback
  }

  result.value = analyzeNumbers(
    records.value,
    lookback.value,
    selectedIssue.value || records.value[0].issue,
  )
}

function applyLotteryData(data) {
  records.value = data.records
  dataSource.value = data.source
  dataUpdatedAt.value = data.updatedAtText || ''
  selectedIssue.value = records.value[0]?.issue || ''

  if (records.value.length < lookback.value + 1) {
    throw new Error(`数据不足，至少需要 ${lookback.value + 1} 期`)
  }

  runAnalysis()
}

async function loadData() {
  loading.value = true
  error.value = ''

  try {
    const data = await loadLotteryDataLocalFirst()
    applyLotteryData(data)
  } catch (err) {
    error.value = err.message || '加载失败'
    result.value = null
  } finally {
    loading.value = false
  }
}

async function refreshData(options = {}) {
  const { silent = false, scheduled = false } = options
  if (refreshing.value || autoRefreshRunning) return

  refreshing.value = true
  autoRefreshRunning = true
  error.value = ''

  try {
    const data = await refreshLotteryDataFromUpstream()
    applyLotteryData(data)

    if (!silent) {
      notifySuccess(`已更新 ${data.records.length} 期开奖数据`)
    } else if (scheduled) {
      notifySuccess(`已到 ${refreshScheduleLabel}，已自动更新开奖数据`)
    }
  } catch (err) {
    const message = err.message || '刷新失败'
    if (!silent) {
      error.value = message
      notifyError(message)
    }
  } finally {
    refreshing.value = false
    autoRefreshRunning = false
  }
}

async function tryScheduledRefresh() {
  if (!shouldAutoRefresh()) return
  await refreshData({ silent: true, scheduled: true })
}

const { checkSchedule } = useLotteryAutoRefresh(() => {
  tryScheduledRefresh()
})

function rerunAnalysis() {
  if (!records.value.length) return

  try {
    error.value = ''
    runAnalysis()
  } catch (err) {
    error.value = err.message || '分析失败'
    result.value = null
  }
}

function getSessionStart() {
  const stored = sessionStorage.getItem(SESSION_START_KEY)
  if (stored) return Number(stored)
  const now = Date.now()
  sessionStorage.setItem(SESSION_START_KEY, String(now))
  return now
}

function openRestReminder() {
  if (sessionStorage.getItem(REST_SHOWN_KEY)) return
  showRestReminder.value = true
  sessionStorage.setItem(REST_SHOWN_KEY, '1')
}

function setupRestReminder() {
  if (sessionStorage.getItem(REST_SHOWN_KEY)) return

  const remaining = REST_REMIND_MS - (Date.now() - getSessionStart())
  if (remaining <= 0) {
    openRestReminder()
    return
  }

  restReminderTimer = window.setTimeout(openRestReminder, remaining)
}

function dismissRestReminder() {
  showRestReminder.value = false
}

function setupLoveModal() {
  showLoveModal.value = true
}

function answerLove(choice) {
  if (choice === 'yes') {
    showLoveModal.value = false
    return
  }

  showLoveModal.value = true
  loveModalShake.value = false
  window.requestAnimationFrame(() => {
    loveModalShake.value = true
    if (loveShakeTimer) window.clearTimeout(loveShakeTimer)
    loveShakeTimer = window.setTimeout(() => {
      loveModalShake.value = false
    }, 520)
  })
}

onMounted(async () => {
  setupLoveModal()
  await loadData()
  setupRestReminder()
  await tryScheduledRefresh()
  checkSchedule()
})

onBeforeUnmount(() => {
  if (restReminderTimer) window.clearTimeout(restReminderTimer)
  if (loveShakeTimer) window.clearTimeout(loveShakeTimer)
})
</script>

<template>
  <div class="app">
    <header class="hero">
      <h1>快乐8选号分析工具</h1>
      <div class="hero-actions">
        <p v-if="dataUpdatedAt" class="data-meta">
          更新于 {{ dataUpdatedAt }}
          <template v-if="dataSourceLabel"> · {{ dataSourceLabel }}</template>
          · {{ refreshScheduleLabel }} 自动更新
        </p>
        <button
          class="btn"
          :disabled="loading || refreshing"
          @click="refreshData()"
        >
          {{ refreshing ? '更新中...' : '刷新数据' }}
        </button>
      </div>
    </header>

    <main class="main">
      <div v-if="loading" class="state-card">
        <div class="spinner" />
        <span>正在加载开奖数据，请稍候...</span>
      </div>

      <div v-else-if="error" class="state-card error-card">
        <p>{{ error }}</p>
        <button class="btn" @click="loadData">重试</button>
      </div>

      <template v-else-if="result">
        <ChartSection :records="records" />
        <ResultPanel
          :result="result"
          :records="records"
          v-model:selected-issue="selectedIssue"
          v-model:lookback="lookback"
          :max-lookback="getMaxLookback()"
          :disabled="loading"
          @issue-change="rerunAnalysis"
          @lookback-change="rerunAnalysis"
        />
        <DetailTable
          :source-details="result.sourceDetails"
          :lookback="result.lookback"
          :base-issue="result.current.issue"
        />
      </template>
    </main>

    <footer class="footer">
      <p>规则说明：对每个开奖号，在之前 N 期内找到曾开出该号的期次，取其次一期开奖号中与该号跨度最小的邻号入选，再按相同跨度反向选号。重复入选为 A 类，仅 1 次为 B 类。</p>
      <p class="disclaimer">开奖数据仅供参考，请以官方公告为准。</p>
    </footer>

    <div v-if="showLoveModal" class="love-modal-backdrop">
      <div
        class="love-modal"
        :class="{ shake: loveModalShake }"
        role="dialog"
        aria-modal="true"
        aria-labelledby="love-modal-title"
      >
        <p id="love-modal-title" class="love-modal-text">老婆，你爱我吗？</p>
        <div class="love-modal-actions">
          <button type="button" class="btn love-btn-yes" @click="answerLove('yes')">爱</button>
          <button type="button" class="btn love-btn-no" @click="answerLove('no')">不爱</button>
        </div>
      </div>
    </div>

    <div v-if="showRestReminder" class="rest-modal-backdrop" @click.self="dismissRestReminder">
      <div class="rest-modal" role="dialog" aria-modal="true" aria-labelledby="rest-modal-title">
        <p id="rest-modal-title" class="rest-modal-text">老婆别看了，休息下。给我发消息了！</p>
        <button type="button" class="btn rest-modal-btn" @click="dismissRestReminder">好的</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.data-meta {
  margin: 0;
  font-size: 12px;
  color: var(--text-dim);
  text-align: right;
}

.love-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.5);
}

.love-modal {
  width: min(100%, 360px);
  padding: 32px 24px 24px;
  border-radius: var(--radius-md);
  background: #fff;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.22);
  text-align: center;
}

.love-modal.shake {
  animation: love-shake 0.5s ease;
}

@keyframes love-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-8px);
  }
  40%,
  80% {
    transform: translateX(8px);
  }
}

.love-modal-text {
  margin: 0 0 24px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.6;
  color: var(--text);
}

.love-modal-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.love-btn-yes {
  min-width: 100px;
  background: linear-gradient(135deg, #fb7185, #e11d48);
  border: none;
  color: #fff;
}

.love-btn-yes:hover {
  filter: brightness(1.05);
}

.love-btn-no {
  min-width: 100px;
  background: #f1f5f9;
  border: 1px solid var(--border);
  color: var(--text-soft);
}

.love-btn-no:hover {
  background: #e2e8f0;
}

.rest-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.45);
}

.rest-modal {
  width: min(100%, 360px);
  padding: 28px 24px 22px;
  border-radius: var(--radius-md);
  background: #fff;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
  text-align: center;
}

.rest-modal-text {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.6;
  color: var(--text);
}

.rest-modal-btn {
  min-width: 120px;
}
</style>
