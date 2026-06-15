<script setup>
import { ref, onMounted } from 'vue'
import { fetchLotteryData } from './api/lottery.js'
import { analyzeNumbers } from './utils/numberPicker.js'
import ResultPanel from './components/ResultPanel.vue'
import DetailTable from './components/DetailTable.vue'
import ChartSection from './components/ChartSection.vue'

const loading = ref(true)
const error = ref('')
const warning = ref('')
const dataSource = ref('')
const records = ref([])
const result = ref(null)
const lookback = ref(10)

async function loadData() {
  loading.value = true
  error.value = ''
  warning.value = ''

  try {
    const data = await fetchLotteryData()
    records.value = data.records
    const sourceMap = {
      remote: '乐彩网实时数据',
      local: '本地缓存数据',
      bundled: '内置开奖数据',
    }
    dataSource.value = sourceMap[data.source] || '开奖数据'
    warning.value = data.warning || ''

    if (records.value.length < lookback.value + 1) {
      throw new Error(`数据不足，至少需要 ${lookback.value + 1} 期`)
    }

    result.value = analyzeNumbers(records.value, lookback.value)
  } catch (err) {
    error.value = err.message || '加载失败'
    result.value = null
  } finally {
    loading.value = false
  }
}

function rerunAnalysis() {
  if (!records.value.length) return
  result.value = analyzeNumbers(records.value, lookback.value)
}

onMounted(loadData)
</script>

<template>
  <div class="app">
    <header class="hero">
      <div class="hero-content">
        <p class="eyebrow">快乐8 · 邻号跨度选号</p>
        <h1>快乐8选号分析工具</h1>
        <p class="subtitle">
          以最新一期 20 个开奖号为基准，往前追溯历史期数，按「邻号最小跨度 + 反向跨度」规则生成 A/B 类候选号
        </p>
      </div>
      <div class="hero-actions">
        <label class="lookback-control">
          追溯期数
          <input
            v-model.number="lookback"
            type="number"
            min="1"
            max="50"
            @change="rerunAnalysis"
          />
        </label>
        <button class="btn" :disabled="loading" @click="loadData">
          {{ loading ? '加载中...' : '刷新数据' }}
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
        <div class="meta-bar">
          <span class="chip">数据来源：<strong>{{ dataSource }}</strong></span>
          <span class="chip">历史共 <strong>{{ records.length }}</strong> 期</span>
          <span class="chip">当前期号 <strong>{{ result.current.issue }}</strong></span>
          <span v-if="warning" class="chip chip-warn">{{ warning }}</span>
        </div>

        <ChartSection :records="records" />
        <ResultPanel :result="result" />
        <DetailTable :steps="result.steps" />
      </template>
    </main>

    <footer class="footer">
      <p>规则说明：对每个开奖号，在之前 N 期内找到曾开出该号的期次，取其次一期开奖号中与该号跨度最小的邻号入选，再按相同跨度反向选号。重复入选为 A 类，仅 1 次为 B 类。</p>
      <p class="disclaimer">开奖数据仅供参考，请以官方公告为准。</p>
    </footer>
  </div>
</template>
