<script setup>
import { computed } from 'vue'
import SearchSelect from './SearchSelect.vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  records: {
    type: Array,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  embedded: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: '',
  },
  searchPlaceholder: {
    type: String,
    default: '搜索期号或日期',
  },
  tone: {
    type: String,
    default: 'default',
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

const emit = defineEmits(['update:modelValue', 'change'])

const resolvedTone = computed(() => {
  if (props.tone !== 'default') return props.tone
  return props.embedded ? 'accent' : 'default'
})

const resolvedPlaceholder = computed(() => {
  if (props.placeholder) return props.placeholder
  return props.embedded ? '期号' : '搜索期号或日期'
})

const options = computed(() => {
  const list = props.records.map((record) => ({
    value: record.issue,
    label: props.embedded || props.tone === 'filter'
      ? record.issue
      : `${record.issue}（${record.date}）`,
  }))

  if (props.clearable) {
    return [{ value: '', label: '不限' }, ...list]
  }

  return list
})

const isDisabled = computed(() => props.disabled || options.value.length === 0)

function filterOption(input, option) {
  if (option?.value === '') return true

  const keyword = input.trim()
  if (!keyword) return true
  const record = props.records.find((item) => item.issue === option?.value)
  return (
    String(option?.value ?? '').includes(keyword)
    || String(option?.label ?? '').includes(keyword)
    || String(record?.date ?? '').includes(keyword)
  )
}

function handleChange(value) {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<template>
  <SearchSelect
    :model-value="modelValue"
    :options="options"
    :filter-option="filterOption"
    :placeholder="resolvedPlaceholder"
    :search-placeholder="searchPlaceholder"
    :disabled="isDisabled"
    :tone="resolvedTone"
    :teleport="teleport"
    :panel-class="panelClass"
    :class="{
      'issue-block': resolvedTone === 'default',
      'issue-embed': resolvedTone === 'accent',
      'issue-filter': resolvedTone === 'filter',
    }"
    @update:model-value="handleChange"
  />
</template>

<style scoped>
.issue-block {
  width: 240px;
}

.issue-embed {
  width: 108px;
}

.issue-filter {
  width: 100px;
}
</style>
