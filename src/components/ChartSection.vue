<script setup>
import { computed, ref } from 'vue'
import ChartToolbar from './ChartToolbar.vue'
import DistributionChart from './DistributionChart.vue'
import OmissionSummary from './OmissionSummary.vue'
import { filterRecords } from '../utils/recordFilter.js'
import { buildChart } from '../utils/charts/index.js'

const props = defineProps({
  records: {
    type: Array,
    default: () => [],
  },
})

const activeChart = ref('hmfb')

const filters = ref({
  periodCount: 30,
  weekdays: [],
  issueParity: 'all',
  issueStart: '',
  issueEnd: '',
  issueTails: [],
  dateStart: '',
  dateEnd: '',
})

const marks = ref({
  repeat: true,
  consecutive: false,
  edge: false,
  omission: true,
  omissionLayer: false,
  zoneLine: true,
  segmentLine: false,
})

const rowOrder = ref('asc')

const filteredRecords = computed(() => filterRecords(props.records, filters.value))
const chart = computed(() =>
  buildChart(activeChart.value, filteredRecords.value, {
    rowOrder: rowOrder.value,
    historyRecords: props.records,
  }),
)
const isSummary = computed(() => activeChart.value === 'ylqs')

const availableDates = computed(() => {
  const set = new Set(props.records.map((record) => record.date).filter(Boolean))
  return [...set].sort()
})

function applyFilters() {
  // 保留钩子
}
</script>

<template>
  <section class="panel chart-section">
    <header class="section-title">
      <h2>{{ chart.title }}</h2>
      <p class="panel-desc">
        {{ chart.desc }} · 显示 {{ chart.periodCount || filteredRecords.length }} 期
        <template v-if="filteredRecords.length !== records.length">
          （已筛选，原始 {{ records.length }} 期）
        </template>
      </p>
    </header>

    <ChartToolbar
      v-model:active-chart="activeChart"
      v-model:filters="filters"
      v-model:marks="marks"
      :max-period="records.length"
      :available-dates="availableDates"
      @apply="applyFilters"
    />

    <OmissionSummary v-if="isSummary" :data="chart" />
    <DistributionChart v-else :chart="chart" :marks="marks" v-model:row-order="rowOrder" />
  </section>
</template>

<style scoped>
.chart-section {
  padding-top: 16px;
}

.section-title {
  margin-bottom: 12px;
}

.section-title h2 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 700;
}

.section-title .panel-desc {
  margin: 0;
  color: var(--text-dim);
  font-size: 14px;
}
</style>
