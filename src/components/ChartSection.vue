<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import ChartToolbar from './ChartToolbar.vue'
import TrendTable from './trend/TrendTable.vue'
import OmissionSummary from './OmissionSummary.vue'
import { filterRecords } from '../utils/recordFilter.js'
import { buildChart } from '../utils/charts/index.js'
import { useDrawTool } from '../composables/useDrawTool.js'

const props = defineProps({
  records: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  refreshing: {
    type: Boolean,
    default: false,
  },
  dataUpdatedAt: {
    type: String,
    default: '',
  },
  dataSourceLabel: {
    type: String,
    default: '',
  },
  refreshScheduleLabel: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['refresh'])

const sectionRef = ref(null)
const isFullscreen = ref(false)

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

const { drawTool } = useDrawTool(activeChart)

const filteredRecords = computed(() => filterRecords(props.records, filters.value))
const chart = computed(() =>
  buildChart(activeChart.value, filteredRecords.value, {
    rowOrder: rowOrder.value,
    historyRecords: props.records,
  }),
)
const isSummary = computed(() => chart.value.kind === 'summary')

const availableDates = computed(() => {
  const set = new Set(props.records.map((record) => record.date).filter(Boolean))
  return [...set].sort()
})

function applyFilters() {
  // 保留钩子
}

function onFullscreenChange() {
  isFullscreen.value = document.fullscreenElement === sectionRef.value
}

async function toggleFullscreen() {
  const el = sectionRef.value
  if (!el) return

  try {
    if (document.fullscreenElement === el) {
      await document.exitFullscreen()
    } else {
      await el.requestFullscreen()
    }
  } catch {
    // 浏览器可能拒绝全屏
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<template>
  <section ref="sectionRef" class="panel chart-section" :class="{ 'is-fullscreen': isFullscreen }">
    <header class="section-title">
      <div class="section-title-text">
        <h2>{{ chart.title }}</h2>
        <p class="panel-desc">
          {{ chart.desc }} · 显示 {{ chart.periodCount || filteredRecords.length }} 期
          <template v-if="filteredRecords.length !== records.length">
            （已筛选，原始 {{ records.length }} 期）
          </template>
        </p>
      </div>
      <div class="section-title-actions">
        <p v-if="dataUpdatedAt" class="section-data-meta">
          更新于 {{ dataUpdatedAt }}
          <template v-if="dataSourceLabel"> · {{ dataSourceLabel }}</template>
          <template v-if="refreshScheduleLabel"> · {{ refreshScheduleLabel }} 自动更新</template>
        </p>
        <button
          type="button"
          class="chart-refresh-btn"
          :disabled="loading || refreshing"
          :title="refreshing ? '更新中...' : '刷新数据'"
          @click="emit('refresh')"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path
              d="M21 12a9 9 0 1 1-2.64-6.36"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <path
              d="M21 3v6h-6"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>{{ refreshing ? '更新中' : '刷新数据' }}</span>
        </button>
        <button
          type="button"
          class="chart-fullscreen-btn"
          :title="isFullscreen ? '退出全屏' : '全屏'"
          :aria-label="isFullscreen ? '退出全屏' : '全屏'"
          @click="toggleFullscreen"
        >
        <svg v-if="!isFullscreen" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"
          />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"
          />
        </svg>
        </button>
      </div>
    </header>

    <ChartToolbar
      v-model:active-chart="activeChart"
      v-model:filters="filters"
      v-model:marks="marks"
      :draw-tool="drawTool"
      :max-period="records.length"
      :available-dates="availableDates"
      :records="records"
      @apply="applyFilters"
    />

    <OmissionSummary v-if="isSummary" :data="chart" />
    <TrendTable
      v-else
      :chart="chart"
      :marks="marks"
      :draw-tool="drawTool"
      v-model:row-order="rowOrder"
    />
  </section>
</template>

<style scoped>
.chart-section {
  padding-top: 16px;
  --chart-scroll-max-height: 92vh;
}

.chart-section:fullscreen,
.chart-section.is-fullscreen {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 12px;
  overflow: hidden;
  background: #fff;
  box-sizing: border-box;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.section-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-title-text h2 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 700;
}

.section-title .panel-desc {
  margin: 0;
  color: var(--text-dim);
  font-size: 14px;
}

.section-title-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.section-data-meta {
  margin: 0;
  max-width: 280px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--text-dim);
  text-align: right;
}

.chart-refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--text-soft);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.chart-refresh-btn:hover:not(:disabled) {
  color: #1677ff;
  border-color: #91caff;
  background: #f0f7ff;
}

.chart-refresh-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.chart-refresh-btn svg {
  display: block;
  flex-shrink: 0;
}

.chart-fullscreen-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--text-dim);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.chart-fullscreen-btn svg {
  display: block;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.chart-fullscreen-btn:hover {
  color: #1677ff;
  border-color: #91caff;
  background: #f0f7ff;
}

.chart-section:fullscreen :deep(.chart-toolbar),
.chart-section.is-fullscreen :deep(.chart-toolbar) {
  flex-shrink: 0;
  border-radius: 4px;
}

.chart-section:fullscreen :deep(.distribution-wrap),
.chart-section.is-fullscreen :deep(.distribution-wrap) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.chart-section:fullscreen :deep(.distribution-scroll),
.chart-section.is-fullscreen :deep(.distribution-scroll) {
  max-height: none;
  flex: 1;
  min-height: 0;
  border-radius: 4px;
}

.chart-section:fullscreen :deep(.empty-chart),
.chart-section.is-fullscreen :deep(.empty-chart) {
  border-radius: 4px;
}

.chart-section:fullscreen :deep(.omission-summary),
.chart-section.is-fullscreen :deep(.omission-summary) {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
