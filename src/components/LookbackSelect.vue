<script setup>
import { computed } from 'vue'
import SearchSelect from './SearchSelect.vue'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 9,
  },
  presets: {
    type: Array,
    default: () => [5, 9, 15, 20, 30, 50],
  },
  max: {
    type: Number,
    default: 50,
  },
  label: {
    type: String,
    default: '追溯期数',
  },
  optionSuffix: {
    type: String,
    default: '期',
  },
  placeholder: {
    type: String,
    default: '选择或输入期数',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  inline: {
    type: Boolean,
    default: false,
  },
  embedded: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const options = computed(() => {
  const max = Math.max(props.max, 1)
  const values = new Set(props.presets.filter((value) => value <= max))

  if (props.modelValue >= 1 && props.modelValue <= max) {
    values.add(props.modelValue)
  }

  return [...values]
    .sort((a, b) => a - b)
    .map((value) => ({
      value,
      label: props.embedded
        ? String(value)
        : `${value} ${props.optionSuffix}`.trim(),
    }))
})

function parseInput(raw) {
  const text = String(raw ?? '').trim()
  if (!text || !/^\d+$/.test(text)) return null
  const num = Number.parseInt(text, 10)
  if (!Number.isFinite(num) || num < 1) return null
  return num
}

function normalizeValue(raw) {
  const parsed = typeof raw === 'number' ? raw : parseInput(raw)
  if (parsed == null) return null
  const max = Math.max(props.max, 1)
  return Math.min(Math.max(parsed, 1), max)
}

function handleChange(value) {
  const next = normalizeValue(value)
  if (next == null) return
  emit('update:modelValue', next)
  emit('change', next)
}
</script>

<template>
  <label class="lookback-control" :class="{ inline, embedded }">
    <span v-if="label && !embedded" class="lookback-label">{{ label }}</span>
    <SearchSelect
      :model-value="modelValue"
      :options="options"
      :placeholder="placeholder"
      search-placeholder="输入期数"
      :disabled="disabled || max < 1"
      :embedded="embedded"
      allow-custom
      :class="embedded ? 'lookback-embed' : inline ? 'lookback-inline' : 'lookback-block'"
      @update:model-value="handleChange"
    />
  </label>
</template>

<style scoped>
.lookback-control {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 140px;
}

.lookback-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-dim);
  white-space: nowrap;
}

.lookback-control.inline {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  min-width: auto;
}

.lookback-control.embedded {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  min-width: auto;
  vertical-align: middle;
}

.lookback-block,
.lookback-inline {
  width: 100%;
}

.lookback-control.inline :deep(.lookback-inline) {
  width: 168px;
}

.lookback-embed {
  width: 72px;
}
</style>
