<script setup>
import { computed, ref } from 'vue'
import {
  CHART_TYPES,
  PERIOD_PRESETS,
  WEEKDAY_OPTIONS,
  MARK_OPTIONS,
} from '../constants/chartTypes.js'
import { notifyInfo } from '../utils/uiMessage.js'
import LookbackSelect from './LookbackSelect.vue'
import DateRangePicker from './DateRangePicker.vue'
import IssueSelect from './IssueSelect.vue'
import DrawToolPalette from './draw/DrawToolPalette.vue'

const props = defineProps({
  filters: { type: Object, required: true },
  marks: { type: Object, required: true },
  drawTool: { type: Object, default: null },
  activeChart: { type: String, default: 'hmfb' },
  maxPeriod: { type: Number, default: 1000 },
  availableDates: { type: Array, default: () => [] },
  records: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:filters', 'update:marks', 'update:activeChart', 'apply'])

const showSamePeriod = ref(false)
const showChartNav = ref(false)

const activeChartLabel = computed(
  () => CHART_TYPES.find((chart) => chart.id === props.activeChart)?.label || '号码分布',
)

const periodCount = computed({
  get: () => props.filters.periodCount,
  set: (value) => patchFilters({ periodCount: value }),
})

function selectChart(chart) {
  emit('update:activeChart', chart.id)
  if (window.matchMedia('(max-width: 640px)').matches) {
    showChartNav.value = false
  }
}

function patchFilters(patch) {
  emit('update:filters', { ...props.filters, ...patch })
}

function normalizeIssueRange(start, end) {
  if (!start || !end || start <= end) {
    return { issueStart: start, issueEnd: end, swapped: false }
  }
  return { issueStart: end, issueEnd: start, swapped: true }
}

function updateIssueStart(value) {
  const { issueStart, issueEnd, swapped } = normalizeIssueRange(
    value,
    props.filters.issueEnd,
  )
  patchFilters({ issueStart, issueEnd })
  if (swapped) notifyInfo(`期号范围已自动调整为 ${issueStart} - ${issueEnd}`)
}

function updateIssueEnd(value) {
  const { issueStart, issueEnd, swapped } = normalizeIssueRange(
    props.filters.issueStart,
    value,
  )
  patchFilters({ issueStart, issueEnd })
  if (swapped) notifyInfo(`期号范围已自动调整为 ${issueStart} - ${issueEnd}`)
}

function toggleWeekday(value) {
  const set = new Set(props.filters.weekdays)
  if (set.has(value)) set.delete(value)
  else set.add(value)
  patchFilters({ weekdays: [...set] })
}

function toggleMulti(key, value) {
  const set = new Set(props.filters[key])
  if (set.has(value)) set.delete(value)
  else set.add(value)
  patchFilters({ [key]: [...set] })
}

function setParity(value) {
  patchFilters({ issueParity: value })
}

function toggleMark(key) {
  emit('update:marks', { ...props.marks, [key]: !props.marks[key] })
}

function resetSamePeriod() {
  emit('update:filters', {
    ...props.filters,
    weekdays: [],
    issueTails: [],
    dateStart: '',
    dateEnd: '',
  })
}

function handleDateChange(range) {
  patchFilters({
    dateStart: range.start,
    dateEnd: range.end,
  })
}

function applyFilters() {
  emit('apply')
}
</script>

<template>
  <div class="chart-toolbar">
    <div
      class="chart-nav"
      :class="{ 'is-expanded': showChartNav }"
    >
      <button
        type="button"
        class="nav-toggle"
        :aria-expanded="showChartNav"
        @click="showChartNav = !showChartNav"
      >
        <span class="nav-label">常用</span>
        <span class="nav-current">{{ activeChartLabel }}</span>
        <span
          class="nav-chevron"
          aria-hidden="true"
        />
      </button>
      <span class="nav-label nav-label--desktop">常用</span>
      <div class="nav-items">
        <button
          v-for="chart in CHART_TYPES"
          :key="chart.id"
          class="toolbar-btn toolbar-btn--nav"
          :class="{ 'is-active': chart.id === activeChart }"
          :title="chart.label"
          @click="selectChart(chart)"
        >
          {{ chart.label }}
        </button>
      </div>
    </div>

    <div class="filter-bar">
      <LookbackSelect
        v-model="periodCount"
        inline
        label="显示期数"
        placeholder="选择或输入期数"
        :presets="PERIOD_PRESETS"
        :max="maxPeriod"
      />

      <div class="filter-group">
        <button
          v-for="day in WEEKDAY_OPTIONS"
          :key="day.value"
          class="toolbar-btn"
          :class="{ 'is-active': filters.weekdays.includes(day.value) }"
          @click="toggleWeekday(day.value)"
        >
          {{ day.label }}
        </button>
        <span class="filter-divider" />
        <button class="toolbar-btn" :class="{ 'is-active': filters.issueParity === 'odd' }" @click="setParity('odd')">单期</button>
        <button class="toolbar-btn" :class="{ 'is-active': filters.issueParity === 'even' }" @click="setParity('even')">双期</button>
        <button class="toolbar-btn" :class="{ 'is-active': filters.issueParity === 'all' }" @click="setParity('all')">全部</button>
      </div>

      <div class="filter-group issue-range">
        <label>期号：</label>
        <IssueSelect
          :model-value="filters.issueStart"
          :records="records"
          clearable
          tone="filter"
          placeholder="起始"
          search-placeholder="搜索起始期号"
          @update:model-value="updateIssueStart"
        />
        <span>-</span>
        <IssueSelect
          :model-value="filters.issueEnd"
          :records="records"
          clearable
          tone="filter"
          placeholder="结束"
          search-placeholder="搜索结束期号"
          @update:model-value="updateIssueEnd"
        />
        <button class="toolbar-btn toolbar-btn--primary" @click="applyFilters">查看</button>
        <button class="toolbar-btn" @click="showSamePeriod = !showSamePeriod">
          {{ showSamePeriod ? '收起同期筛选' : '同期筛选' }}
        </button>
      </div>
    </div>

    <div v-if="showSamePeriod" class="same-period-panel">
      <div class="same-group">
        <span class="same-label">期号尾</span>
        <button
          v-for="tail in 10"
          :key="tail"
          class="toolbar-btn toolbar-btn--sm"
          :class="{ 'is-active': filters.issueTails.includes(tail - 1) }"
          @click="toggleMulti('issueTails', tail - 1)"
        >
          {{ tail - 1 }}尾
        </button>
      </div>
      <div class="same-group date-row">
        <span class="same-label">日期</span>
        <DateRangePicker
          :start="filters.dateStart"
          :end="filters.dateEnd"
          :dates="availableDates"
          @change="handleDateChange"
        />
        <button type="button" class="toolbar-btn reset-btn" @click="resetSamePeriod">重置条件</button>
      </div>
    </div>

    <div class="mark-bar">
      <span class="mark-label">标注</span>
      <button
        v-for="item in MARK_OPTIONS"
        :key="item.key"
        class="toolbar-btn toolbar-btn--mark"
        :class="{ 'is-active': marks[item.key] }"
        @click="toggleMark(item.key)"
      >
        {{ item.label }}
      </button>
      <DrawToolPalette v-if="drawTool" :draw-tool="drawTool" />
    </div>
  </div>
</template>

<style scoped>
.chart-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
  overflow: visible;
}

.chart-nav {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 12px;
  background: var(--color-nav-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.nav-label {
  flex-shrink: 0;
  padding-top: 5px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.nav-toggle {
  display: none;
}

.nav-label--desktop {
  display: block;
}

.nav-current {
  display: none;
}

.nav-chevron {
  display: none;
}

.nav-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

@media (max-width: 640px) {
  .chart-nav {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .nav-label--desktop {
    display: none;
  }

  .nav-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }

  .nav-current {
    display: block;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--font-size-small);
    font-weight: 600;
    color: var(--link);
  }

  .nav-chevron {
    display: block;
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-right: 2px solid var(--text-dim);
    border-bottom: 2px solid var(--text-dim);
    transform: rotate(45deg);
    margin-top: -3px;
    transition: transform var(--transition-fast);
  }

  .chart-nav.is-expanded .nav-chevron {
    transform: rotate(-135deg);
    margin-top: 3px;
  }

  .nav-label {
    padding-top: 0;
  }

  .nav-items {
    display: none;
  }

  .chart-nav.is-expanded .nav-items {
    display: flex;
  }
}

.filter-bar,
.mark-bar,
.same-period-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  background: var(--color-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: visible;
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.filter-group-label {
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--text-dim);
  margin-right: 2px;
}

.filter-divider {
  width: var(--border-width);
  height: 18px;
  background: var(--border-strong);
  margin: 0 var(--spacing-xs);
}

.toolbar-btn--sm {
  min-width: 36px;
  padding: 3px 6px;
}

.issue-range {
  gap: 6px;
  font-size: var(--font-size-small);
  color: var(--text-soft);
}

.same-period-panel {
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}

.same-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.same-label {
  flex-shrink: 0;
  width: 48px;
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--text-dim);
}

.date-row {
  flex-wrap: wrap;
}

.reset-btn {
  margin-left: 4px;
}

.mark-bar {
  gap: 6px;
  align-items: center;
}

.mark-label {
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--text-dim);
  margin-right: var(--spacing-xs);
}
</style>
