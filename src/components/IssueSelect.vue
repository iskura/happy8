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
})

const emit = defineEmits(['update:modelValue', 'change'])

const options = computed(() =>
  props.records.map((record) => ({
    value: record.issue,
    label: props.embedded
      ? record.issue
      : `${record.issue}（${record.date}）`,
  })),
)

function filterOption(input, option) {
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
    :placeholder="embedded ? '期号' : '搜索期号或日期'"
    search-placeholder="搜索期号或日期"
    :disabled="disabled || !records.length"
    :embedded="embedded"
    :class="embedded ? 'issue-embed' : 'issue-block'"
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
</style>
