<script setup>
import { computed, ref } from 'vue'
import ChartToolbar from './ChartToolbar.vue'
import TrendTable from './trend/TrendTable.vue'
import OmissionSummary from './OmissionSummary.vue'
import { filterRecords } from '../utils/recordFilter.js'
import { buildChart } from '../utils/charts/index.js'
import { useDrawTool } from '../composables/useDrawTool.js'
import { useFullscreen } from '../composables/useFullscreen.js'

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
const { isFullscreen, toggleFullscreen } = useFullscreen(sectionRef)

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
</script>

<template>
  <section
    ref="sectionRef"
    class="panel chart-section"
    :class="{ 'is-fullscreen': isFullscreen }"
  >
    <header class="section-title">
      <div class="section-title-row">
        <h2>{{ chart.title }}</h2>
        <div class="section-title-actions">
          <p
            v-if="dataUpdatedAt"
            class="section-data-meta"
          >
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
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              aria-hidden="true"
            >
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
            <span class="chart-refresh-btn__label">{{ refreshing ? '更新中' : '刷新数据' }}</span>
          </button>
          <button
            type="button"
            class="icon-action-btn icon-action-btn--md icon-action-btn--info"
            :title="isFullscreen ? '退出全屏' : '全屏'"
            :aria-label="isFullscreen ? '退出全屏' : '全屏'"
            @click="toggleFullscreen"
          >
            <svg
              v-if="!isFullscreen"
              class="icon-action-btn__svg"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"
              />
            </svg>
            <svg
              v-else
              class="icon-action-btn__svg"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
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
      </div>
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
      :draw-tool="drawTool"
      :max-period="records.length"
      :available-dates="availableDates"
      :records="records"
      @apply="applyFilters"
    />

    <OmissionSummary
      v-if="isSummary"
      :data="chart"
    />
    <TrendTable
      v-else
      v-model:row-order="rowOrder"
      :chart="chart"
      :marks="marks"
      :draw-tool="drawTool"
    />
  </section>
</template>

<style scoped>
.chart-section {
  padding-top: var(--spacing-lg);
  --chart-scroll-max-height: 92vh;
}

.chart-section:fullscreen,
.chart-section.is-fullscreen {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: var(--spacing-md);
  overflow: hidden;
  background: var(--color-surface);
  box-sizing: border-box;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.section-title {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.section-title-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: var(--spacing-sm);
  min-width: 0;
}

.section-title-row h2 {
  margin: 0;
  flex-shrink: 0;
  font-size: var(--font-size-title);
  font-weight: 700;
  white-space: nowrap;
}

.section-data-meta {
  margin: 0;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-size-small);
  line-height: 1.4;
  color: var(--text-dim);
}

.section-title .panel-desc {
  margin: 0;
  color: var(--text-dim);
  font-size: var(--font-size-body);
}

.section-title-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 1;
  min-width: 0;
  margin-left: auto;
}

.section-title-actions .chart-refresh-btn,
.section-title-actions .icon-action-btn {
  flex-shrink: 0;
}

.chart-refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: var(--control-height-md);
  padding: 0 var(--spacing-md);
  border: var(--border-width) solid var(--link);
  border-radius: var(--radius-xs);
  background: var(--link);
  color: var(--text-on-primary);
  font-size: var(--font-size-small);
  font-weight: 600;
  cursor: pointer;
  transition:
    filter var(--transition-fast),
    border-color var(--transition-fast),
    background var(--transition-fast);
}

.chart-refresh-btn:hover:not(:disabled) {
  filter: brightness(1.06);
  border-color: var(--link);
  background: var(--link);
  color: var(--text-on-primary);
}

.chart-refresh-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.chart-refresh-btn svg {
  display: block;
  flex-shrink: 0;
}

@media (max-width: 520px) {
  .section-title-row h2 {
    font-size: var(--font-size-body);
  }

  .chart-refresh-btn {
    padding: 0 var(--spacing-sm);
  }

  .chart-refresh-btn__label {
    display: none;
  }
}

.chart-section:fullscreen :deep(.chart-toolbar),
.chart-section.is-fullscreen :deep(.chart-toolbar) {
  flex-shrink: 0;
  border-radius: var(--radius-xs);
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
  border-radius: var(--radius-xs);
}

.chart-section:fullscreen :deep(.empty-chart),
.chart-section.is-fullscreen :deep(.empty-chart) {
  border-radius: var(--radius-xs);
}

.chart-section:fullscreen :deep(.omission-summary),
.chart-section.is-fullscreen :deep(.omission-summary) {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
