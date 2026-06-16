<script setup>
import { computed, onMounted, provide, ref } from 'vue'
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

const loading = ref(true)
const refreshing = ref(false)
const error = ref('')
const records = ref([])
const result = ref(null)
const lookback = ref(9)
const selectedIssue = ref('')
const dataSource = ref('')
const dataUpdatedAt = ref('')

const refreshScheduleLabel = getScheduleLabel()

const dataSourceLabel = computed(() => {
  if (dataSource.value === 'cache') return '本地缓存'
  if (dataSource.value === 'bundled') return '内置数据'
  if (dataSource.value === 'upstream') return '最新数据'
  return ''
})

const pageMeta = computed(() => ({
  dataUpdatedAt: dataUpdatedAt.value,
  dataSourceLabel: dataSourceLabel.value,
  refreshScheduleLabel,
}))

provide('pageMeta', pageMeta)
provide('lotteryRecords', records)

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

onMounted(async () => {
  await loadData()
  await tryScheduledRefresh()
  checkSchedule()
})
</script>

<template>
  <main class="main">
      <div
        v-if="loading"
        class="state-card"
      >
        <div class="spinner" />
        <span>正在加载开奖数据，请稍候...</span>
      </div>

      <div
        v-else-if="error"
        class="state-card error-card"
      >
        <p>{{ error }}</p>
        <button
          class="btn"
          type="button"
          @click="loadData"
        >
          重试
        </button>
      </div>

      <template v-else-if="result">
        <div
          id="section-chart"
          class="page-section"
        >
          <ChartSection
            :records="records"
            :loading="loading"
            :refreshing="refreshing"
            :data-updated-at="dataUpdatedAt"
            :data-source-label="dataSourceLabel"
            :refresh-schedule-label="refreshScheduleLabel"
            @refresh="refreshData()"
          />
        </div>
        <div
          id="section-result"
          class="page-section"
        >
          <ResultPanel
            v-model:selected-issue="selectedIssue"
            v-model:lookback="lookback"
            :result="result"
            :records="records"
            :max-lookback="getMaxLookback()"
            :disabled="loading"
            @issue-change="rerunAnalysis"
            @lookback-change="rerunAnalysis"
          />
        </div>
        <div
          id="section-detail"
          class="page-section"
        >
          <DetailTable
            :source-details="result.sourceDetails"
            :lookback="result.lookback"
            :base-issue="result.current.issue"
          />
        </div>
      </template>
    </main>

    <footer
      id="section-footer"
      class="footer"
    >
      <p>规则说明：对每个开奖号，在之前 N 期内找到曾开出该号的期次，取其次一期开奖号中与该号跨度最小的邻号入选，再按相同跨度反向选号。重复入选为 A 类，仅 1 次为 B 类。</p>
      <p class="disclaimer">开奖数据仅供参考，请以官方公告为准。</p>
    </footer>
</template>

<style scoped>
.page-section {
  scroll-margin-top: calc(var(--thyuu-header-height, 3.5rem) + var(--spacing-xs));
}

.page-section:first-child {
  margin-top: 0;
}
</style>
