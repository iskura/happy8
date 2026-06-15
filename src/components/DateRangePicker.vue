<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  start: {
    type: String,
    default: '',
  },
  end: {
    type: String,
    default: '',
  },
  min: {
    type: String,
    default: '',
  },
  max: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '选择日期范围',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:start', 'update:end', 'change'])

const rootRef = ref(null)
const open = ref(false)
const draftStart = ref('')
const draftEnd = ref('')

const displayText = computed(() => {
  if (props.start && props.end) return `${props.start} 至 ${props.end}`
  if (props.start) return `${props.start} 起`
  if (props.end) return `截至 ${props.end}`
  return ''
})

watch(open, (isOpen) => {
  if (!isOpen) return
  draftStart.value = props.start
  draftEnd.value = props.end
})

function toggleOpen() {
  if (props.disabled) return
  open.value = !open.value
}

function closePanel() {
  open.value = false
}

function normalizeRange(start, end) {
  let nextStart = start || ''
  let nextEnd = end || ''
  if (nextStart && nextEnd && nextStart > nextEnd) {
    ;[nextStart, nextEnd] = [nextEnd, nextStart]
  }
  return { start: nextStart, end: nextEnd }
}

function applyRange(start = draftStart.value, end = draftEnd.value) {
  const range = normalizeRange(start, end)
  draftStart.value = range.start
  draftEnd.value = range.end
  emit('update:start', range.start)
  emit('update:end', range.end)
  emit('change', range)
  closePanel()
}

function clearRange() {
  draftStart.value = ''
  draftEnd.value = ''
  emit('update:start', '')
  emit('update:end', '')
  emit('change', { start: '', end: '' })
  closePanel()
}

function handleStartInput(event) {
  draftStart.value = event.target.value
}

function handleEndInput(event) {
  draftEnd.value = event.target.value
}

function handleClickOutside(event) {
  if (!rootRef.value?.contains(event.target)) {
    closePanel()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <div
    ref="rootRef"
    class="date-range-picker"
    :class="{ open, disabled }"
  >
    <button
      type="button"
      class="date-range-trigger"
      :disabled="disabled"
      @click="toggleOpen"
    >
      <span v-if="displayText" class="date-range-value">{{ displayText }}</span>
      <span v-else class="date-range-placeholder">{{ placeholder }}</span>
      <span class="date-range-icon" aria-hidden="true">▾</span>
    </button>

    <div v-if="open" class="date-range-panel">
      <div class="date-range-row">
        <label class="date-range-field">
          <span>开始日期</span>
          <input
            class="date-range-input"
            type="date"
            :value="draftStart"
            :min="min || undefined"
            :max="max || undefined"
            @input="handleStartInput"
          />
        </label>
        <label class="date-range-field">
          <span>结束日期</span>
          <input
            class="date-range-input"
            type="date"
            :value="draftEnd"
            :min="min || undefined"
            :max="max || undefined"
            @input="handleEndInput"
          />
        </label>
      </div>
      <div class="date-range-actions">
        <button type="button" class="date-range-btn" @click="clearRange">清空</button>
        <button type="button" class="date-range-btn primary" @click="applyRange()">确定</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.date-range-picker {
  position: relative;
  display: inline-block;
}

.date-range-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 220px;
  min-height: 32px;
  padding: 4px 10px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: #fff;
  color: var(--text);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
}

.date-range-trigger:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.date-range-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.date-range-placeholder {
  flex: 1;
  color: var(--text-dim);
}

.date-range-icon {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--text-dim);
}

.date-range-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 2000;
  min-width: 280px;
  padding: 12px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: #fff;
  box-shadow: var(--shadow-soft);
}

.date-range-row {
  display: grid;
  gap: 10px;
}

.date-range-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--text-dim);
}

.date-range-input {
  width: 100%;
  min-height: 34px;
  padding: 6px 10px;
  border: 1px solid var(--border-strong);
  border-radius: 4px;
  font-size: 13px;
  color: var(--text);
  background: #fff;
  cursor: pointer;
}

.date-range-input:focus {
  outline: none;
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.12);
}

.date-range-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.date-range-btn {
  border: 1px solid #d8dee9;
  background: #fff;
  color: var(--text-soft);
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.date-range-btn.primary {
  background: #1677ff;
  border-color: #1677ff;
  color: #fff;
}

.date-range-btn:hover {
  border-color: #1677ff;
  color: #1677ff;
}

.date-range-btn.primary:hover {
  color: #fff;
}
</style>
