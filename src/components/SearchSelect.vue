<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: '请选择',
  },
  searchPlaceholder: {
    type: String,
    default: '搜索...',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  embedded: {
    type: Boolean,
    default: false,
  },
  tone: {
    type: String,
    default: '',
  },
  allowCustom: {
    type: Boolean,
    default: false,
  },
  filterOption: {
    type: Function,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const rootRef = ref(null)
const listRef = ref(null)
const open = ref(false)
const keyword = ref('')

const resolvedTone = computed(() => {
  if (props.tone) return props.tone
  return props.embedded ? 'accent' : 'default'
})

const displayText = computed(() => {
  const matched = props.options.find((option) => option.value === props.modelValue)
  if (matched) return matched.label
  if (props.modelValue !== '' && props.modelValue != null) return String(props.modelValue)
  return ''
})

const filteredOptions = computed(() => {
  const text = keyword.value.trim()
  if (!text) return props.options

  if (props.filterOption) {
    return props.options.filter((option) => props.filterOption(text, option))
  }

  const lower = text.toLowerCase()
  return props.options.filter((option) => (
    String(option.value ?? '').toLowerCase().includes(lower)
    || String(option.label ?? '').toLowerCase().includes(lower)
  ))
})

function resetListScroll() {
  if (listRef.value) listRef.value.scrollTop = 0
}

watch(keyword, () => {
  resetListScroll()
})

watch(filteredOptions, () => {
  resetListScroll()
})

function toggleOpen() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) keyword.value = ''
}

function closePanel(commitCustom = true) {
  if (open.value && commitCustom) commitCustomValue()
  open.value = false
  keyword.value = ''
}

function selectOption(option) {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  open.value = false
  keyword.value = ''
}

function commitCustomValue() {
  if (!props.allowCustom) return
  const text = keyword.value.trim()
  if (!text) return
  emit('update:modelValue', text)
  emit('change', text)
}

function handleSearchKeydown(event) {
  if (event.key !== 'Enter') return
  event.preventDefault()
  if (filteredOptions.value.length === 1) {
    selectOption(filteredOptions.value[0])
    return
  }
  commitCustomValue()
  open.value = false
  keyword.value = ''
}

function handleClickOutside(event) {
  if (!rootRef.value?.contains(event.target)) {
    closePanel(true)
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
    class="search-select"
    :class="[resolvedTone, { open, disabled }]"
  >
    <button
      type="button"
      class="search-select-trigger"
      :disabled="disabled"
      @click="toggleOpen"
    >
      <span v-if="displayText" class="search-select-value">{{ displayText }}</span>
      <span v-else class="search-select-placeholder">{{ placeholder }}</span>
      <span class="search-select-arrow" aria-hidden="true">▾</span>
    </button>

    <div v-if="open" class="search-select-panel">
      <input
        v-model="keyword"
        type="text"
        class="search-select-input"
        :placeholder="searchPlaceholder"
        @keydown="handleSearchKeydown"
      />
      <div
        v-if="filteredOptions.length"
        ref="listRef"
        class="search-select-list-wrap"
      >
        <ul
          :key="keyword"
          class="search-select-list"
        >
          <li
            v-for="(option, index) in filteredOptions"
            :key="`${option.value}__${index}`"
            class="search-select-option"
            :class="{ active: option.value === modelValue }"
            @mousedown.prevent="selectOption(option)"
          >
            {{ option.label }}
          </li>
        </ul>
      </div>
      <p v-else class="search-select-empty">无匹配项</p>
      <p v-if="allowCustom" class="search-select-tip">输入后按 Enter 确认</p>
    </div>
  </div>
</template>

<style scoped>
.search-select {
  position: relative;
  min-width: 140px;
}

.search-select.embedded,
.search-select.accent {
  display: inline-block;
  min-width: auto;
  vertical-align: middle;
}

.search-select.filter {
  display: inline-block;
  min-width: auto;
  vertical-align: middle;
}

.search-select-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-height: 32px;
  padding: 4px 10px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--bg-soft);
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
  text-align: left;
}

.search-select.embedded .search-select-trigger,
.search-select.accent .search-select-trigger {
  min-height: 28px;
  padding: 2px 8px;
  border-color: #fecdd3;
  background: #fff1f2;
  font-weight: 700;
  color: #e11d48;
}

.search-select.filter .search-select-trigger {
  min-height: 28px;
  padding: 4px 8px;
  border-color: var(--border-strong);
  background: #fff;
  font-size: 12px;
  font-weight: 400;
  color: var(--text);
}

.search-select-trigger:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.search-select-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-select-placeholder {
  flex: 1;
  color: var(--text-dim);
}

.search-select-arrow {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--text-dim);
}

.search-select-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 2000;
  min-width: 100%;
  width: max-content;
  max-width: 280px;
  padding: 8px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: #fff;
  box-shadow: var(--shadow-soft);
}

.search-select-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--border-strong);
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}

.search-select-input:focus {
  border-color: #1677ff;
}

.search-select-list-wrap {
  max-height: 220px;
  margin-top: 8px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.search-select-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.search-select-option {
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}

.search-select-option:hover,
.search-select-option.active {
  background: #e6f4ff;
  color: #1677ff;
}

.search-select-empty,
.search-select-tip {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--text-dim);
}
</style>
