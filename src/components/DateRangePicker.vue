<script setup>
import { computed } from 'vue'
import SearchSelect from './SearchSelect.vue'

const props = defineProps({
  start: {
    type: String,
    default: '',
  },
  end: {
    type: String,
    default: '',
  },
  /** 可选开奖日期，格式 YYYY-MM-DD */
  dates: {
    type: Array,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  teleport: {
    type: Boolean,
    default: false,
  },
  panelClass: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:start', 'update:end', 'change'])

const sortedDates = computed(() => [...new Set(props.dates)].filter(Boolean).sort())

const startOptions = computed(() => {
  let list = sortedDates.value
  if (props.end) list = list.filter((date) => date <= props.end)
  return list.map((date) => ({ value: date, label: date }))
})

const endOptions = computed(() => {
  let list = sortedDates.value
  if (props.start) list = list.filter((date) => date >= props.start)
  return list.map((date) => ({ value: date, label: date }))
})

function emitRange(start, end) {
  let nextStart = start || ''
  let nextEnd = end || ''
  if (nextStart && nextEnd && nextStart > nextEnd) {
    ;[nextStart, nextEnd] = [nextEnd, nextStart]
  }
  emit('update:start', nextStart)
  emit('update:end', nextEnd)
  emit('change', { start: nextStart, end: nextEnd })
}

function setStart(value) {
  emitRange(value, props.end)
}

function setEnd(value) {
  emitRange(props.start, value)
}
</script>

<template>
  <div class="date-range-inline">
    <SearchSelect
      class="date-select"
      :model-value="start"
      :options="startOptions"
      placeholder="开始日期"
      search-placeholder="搜索日期..."
      :disabled="disabled || !sortedDates.length"
      :teleport="teleport"
      :panel-class="panelClass"
      @update:model-value="setStart"
    />
    <span class="range-sep">至</span>
    <SearchSelect
      class="date-select"
      :model-value="end"
      :options="endOptions"
      placeholder="结束日期"
      search-placeholder="搜索日期..."
      :disabled="disabled || !sortedDates.length"
      :teleport="teleport"
      :panel-class="panelClass"
      @update:model-value="setEnd"
    />
  </div>
</template>

<style scoped>
.date-range-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.date-select {
  min-width: 132px;
}

.range-sep {
  flex-shrink: 0;
  font-size: var(--font-size-small);
  color: var(--text-dim);
}
</style>
