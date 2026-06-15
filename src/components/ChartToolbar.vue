<script setup>
import { computed, ref } from 'vue'
import {
  CHART_TYPES,
  PERIOD_PRESETS,
  WEEKDAY_OPTIONS,
  MARK_OPTIONS,
} from '../constants/chartTypes.js'
import LookbackSelect from './LookbackSelect.vue'
import DateRangePicker from './DateRangePicker.vue'

const props = defineProps({
  filters: { type: Object, required: true },
  marks: { type: Object, required: true },
  activeChart: { type: String, default: 'hmfb' },
  maxPeriod: { type: Number, default: 1000 },
  availableDates: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:filters', 'update:marks', 'update:activeChart', 'apply'])

const showSamePeriod = ref(false)

const periodCount = computed({
  get: () => props.filters.periodCount,
  set: (value) => patchFilters({ periodCount: value }),
})

function selectChart(chart) {
  emit('update:activeChart', chart.id)
}

function patchFilters(patch) {
  emit('update:filters', { ...props.filters, ...patch })
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
    <div class="chart-nav">
      <span class="nav-label">常用</span>
      <div class="nav-items">
        <button
          v-for="chart in CHART_TYPES"
          :key="chart.id"
          class="nav-btn"
          :class="{ active: chart.id === activeChart }"
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
          class="filter-btn"
          :class="{ active: filters.weekdays.includes(day.value) }"
          @click="toggleWeekday(day.value)"
        >
          {{ day.label }}
        </button>
        <span class="filter-divider" />
        <button class="filter-btn" :class="{ active: filters.issueParity === 'odd' }" @click="setParity('odd')">单期</button>
        <button class="filter-btn" :class="{ active: filters.issueParity === 'even' }" @click="setParity('even')">双期</button>
        <button class="filter-btn" :class="{ active: filters.issueParity === 'all' }" @click="setParity('all')">全部</button>
      </div>

      <div class="filter-group issue-range">
        <label>期号：</label>
        <input
          :value="filters.issueStart"
          placeholder="起始"
          @input="patchFilters({ issueStart: $event.target.value })"
        />
        <span>-</span>
        <input
          :value="filters.issueEnd"
          placeholder="结束"
          @input="patchFilters({ issueEnd: $event.target.value })"
        />
        <button class="filter-btn primary" @click="applyFilters">查看</button>
        <button class="filter-btn" @click="showSamePeriod = !showSamePeriod">
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
          class="filter-btn sm"
          :class="{ active: filters.issueTails.includes(tail - 1) }"
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
        <button type="button" class="filter-btn reset-btn" @click="resetSamePeriod">重置条件</button>
      </div>
    </div>

    <div class="mark-bar">
      <span class="mark-label">标注</span>
      <button
        v-for="item in MARK_OPTIONS"
        :key="item.key"
        class="mark-btn"
        :class="{ active: marks[item.key] }"
        @click="toggleMark(item.key)"
      >
        {{ item.label }}
      </button>
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
  background: #fafbfc;
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

.nav-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.nav-btn {
  border: 1px solid #d8dee9;
  background: #fff;
  color: var(--text);
  padding: 5px 12px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.nav-btn:hover {
  border-color: #7cb3ff;
  color: #1677ff;
}

.nav-btn.active {
  border-color: #1677ff;
  color: #1677ff;
  font-weight: 600;
}

.filter-bar,
.mark-bar,
.same-period-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  background: #fff;
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
  font-size: 12px;
  font-weight: 600;
  color: var(--text-dim);
  margin-right: 2px;
}

.filter-divider {
  width: 1px;
  height: 18px;
  background: var(--border-strong);
  margin: 0 4px;
}

.filter-btn {
  border: 1px solid #d8dee9;
  background: #fff;
  color: var(--text-soft);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.filter-btn:hover {
  border-color: #1677ff;
  color: #1677ff;
}

.filter-btn.active {
  background: #e6f4ff;
  border-color: #1677ff;
  color: #1677ff;
  font-weight: 600;
}

.filter-btn.primary {
  background: #1677ff;
  border-color: #1677ff;
  color: #fff;
}

.filter-btn.sm {
  min-width: 36px;
  padding: 3px 6px;
}

.issue-range input {
  width: 72px;
  padding: 4px 8px;
  border: 1px solid var(--border-strong);
  border-radius: 4px;
  font-size: 12px;
}

.issue-range {
  gap: 6px;
  font-size: 12px;
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
  font-size: 12px;
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
}

.mark-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-dim);
  margin-right: 4px;
}

.mark-btn {
  border: 1px solid #d8dee9;
  background: #fff;
  color: var(--text-soft);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.mark-btn.active {
  background: #fff7e6;
  border-color: #ffc53d;
  color: #d48806;
  font-weight: 600;
}
</style>
