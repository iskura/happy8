<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

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

const rootRef = ref(null)
const panelRef = ref(null)
const listRef = ref(null)
const open = ref(false)
const keyword = ref('')
const panelStyle = ref({})

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

function updatePanelPosition() {
  if (!props.teleport || !rootRef.value) return
  const rect = rootRef.value.getBoundingClientRect()
  panelStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    minWidth: `${rect.width}px`,
  }
}

function bindPanelPositionListeners() {
  window.addEventListener('scroll', updatePanelPosition, true)
  window.addEventListener('resize', updatePanelPosition, { passive: true })
}

function unbindPanelPositionListeners() {
  window.removeEventListener('scroll', updatePanelPosition, true)
  window.removeEventListener('resize', updatePanelPosition)
}

watch(open, (isOpen) => {
  if (isOpen && props.teleport) {
    nextTick(() => {
      updatePanelPosition()
      bindPanelPositionListeners()
    })
    return
  }
  if (!isOpen) {
    unbindPanelPositionListeners()
    panelStyle.value = {}
  }
})

function toggleOpen() {
  if (props.disabled) return
  const nextOpen = !open.value
  if (nextOpen) {
    if (props.teleport) updatePanelPosition()
    keyword.value = ''
  }
  open.value = nextOpen
}

function closePanel(commitCustom = true) {
  if (open.value && commitCustom) commitCustomValue()
  open.value = false
  keyword.value = ''
  unbindPanelPositionListeners()
  panelStyle.value = {}
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
  const target = event.target
  if (rootRef.value?.contains(target)) return
  if (panelRef.value?.contains(target)) return
  closePanel(true)
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  unbindPanelPositionListeners()
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
      @mousedown.stop
      @click.stop="toggleOpen"
    >
      <span v-if="displayText" class="search-select-value">{{ displayText }}</span>
      <span v-else class="search-select-placeholder">{{ placeholder }}</span>
      <span class="search-select-arrow" aria-hidden="true">▾</span>
    </button>

    <Teleport
      to="body"
      :disabled="!teleport"
    >
      <div
        v-if="open"
        ref="panelRef"
        class="search-select-panel"
        :class="[panelClass, { 'is-teleported': teleport }]"
        :style="teleport ? panelStyle : null"
      >
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
        <p
          v-else
          class="search-select-empty"
        >无匹配项</p>
        <p
          v-if="allowCustom"
          class="search-select-tip"
        >输入后按 Enter 确认</p>
      </div>
    </Teleport>
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
  font-size: var(--font-size-body);
  cursor: pointer;
  text-align: left;
}

.search-select.embedded .search-select-trigger,
.search-select.accent .search-select-trigger {
  min-height: 28px;
  padding: 2px 8px;
  border-color: var(--primary-border);
  background: var(--primary-bg);
  font-weight: 700;
  color: var(--primary);
}

.search-select.filter .search-select-trigger {
  min-height: 28px;
  padding: 4px 8px;
  border-color: var(--border-strong);
  background: var(--color-surface);
  font-size: var(--font-size-small);
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
  font-size: var(--font-size-tiny);
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
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
}

.search-select-panel.is-teleported {
  position: fixed;
  top: auto;
  left: auto;
  z-index: 10060;
}

.search-select-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-xs);
  font-size: 13px;
  outline: none;
}

.search-select-input:focus {
  border-color: var(--link);
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
  border-radius: var(--radius-xs);
  font-size: 13px;
  cursor: pointer;
}

.search-select-option:hover,
.search-select-option.active {
  background: var(--link-bg-active);
  color: var(--link);
}

.search-select-empty,
.search-select-tip {
  margin: 8px 0 0;
  font-size: var(--font-size-small);
  color: var(--text-dim);
}
</style>
