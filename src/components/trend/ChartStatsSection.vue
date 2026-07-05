<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import TrendTableColgroup from './TrendTableColgroup.vue'
import TrendChartStats from './TrendChartStats.vue'

defineProps({
  chart: { type: Object, required: true },
  columnHeaders: { type: Array, required: true },
  statRows: { type: Array, required: true },
  allStatRows: { type: Array, required: true },
  isStatVisible: { type: Function, required: true },
  indicatorHelpItem: { type: Object, default: null },
  statCellValue: { type: Function, required: true },
  statCellExtraClass: { type: Function, default: null },
  statMode: { type: String, default: 'page' },
  marks: { type: Object, default: () => ({}) },
  colKeyPrefix: { type: String, default: 'col-stats' },
})

const emit = defineEmits(['show-tip', 'hide-tip', 'update:statMode', 'toggle-stat-visible'])

const settingsOpen = ref(false)
const settingsBtnRef = ref(null)
const settingsPanelRef = ref(null)
const panelStyle = ref({ left: '0px', top: '0px' })

function setStatMode(mode) {
  emit('update:statMode', mode)
}

function updatePanelPosition() {
  const btn = settingsBtnRef.value
  if (!btn) return
  const rect = btn.getBoundingClientRect()
  panelStyle.value = {
    left: `${rect.left}px`,
    top: `${rect.bottom + 6}px`,
  }
}

async function toggleSettings() {
  settingsOpen.value = !settingsOpen.value
  if (settingsOpen.value) {
    await nextTick()
    updatePanelPosition()
  }
}

function onToggleStatVisible(key) {
  emit('toggle-stat-visible', key)
}

function onDocumentClick(event) {
  if (!settingsOpen.value) return
  if (settingsBtnRef.value?.contains(event.target)) return
  if (settingsPanelRef.value?.contains(event.target)) return
  settingsOpen.value = false
}

function onLayoutChange() {
  if (settingsOpen.value) updatePanelPosition()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  window.addEventListener('resize', onLayoutChange)
  window.addEventListener('scroll', onLayoutChange, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener('resize', onLayoutChange)
  window.removeEventListener('scroll', onLayoutChange, true)
})
</script>

<template>
  <div class="chart-stats-section">
    <div class="chart-stats-title-bar">
      <div class="stats-title-bar">
        <span class="stat-label-wrap">
          <span>图表指标统计</span>
          <span
            class="stat-settings-wrap"
          >
            <button
              ref="settingsBtnRef"
              type="button"
              class="stat-settings-btn"
              :class="{ 'is-open': settingsOpen }"
              aria-label="指标显示设置"
              title="指标显示设置"
              @click.stop="toggleSettings"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.04 7.04 0 0 0-1.63-.94l-.36-2.54A.49.49 0 0 0 14 2h-4a.49.49 0 0 0-.49.42l-.36 2.54c-.59.24-1.13.57-1.63.94l-2.39-.96a.49.49 0 0 0-.59.22L2.62 8.48a.49.49 0 0 0 .12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.3.59.22l2.39-.96c.5.37 1.04.7 1.63.94l.36 2.54c.05.24.25.42.49.42h4c.24 0 .44-.18.49-.42l.36-2.54c.59-.24 1.13-.57 1.63-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"
                />
              </svg>
            </button>
            <Teleport to="body">
              <div
                v-if="settingsOpen"
                ref="settingsPanelRef"
                class="stat-settings-panel"
                role="menu"
                :style="panelStyle"
                @click.stop
              >
                <p class="stat-settings-title">显示指标</p>
                <label
                  v-for="row in allStatRows"
                  :key="row.key"
                  class="stat-settings-item"
                >
                  <input
                    type="checkbox"
                    :checked="isStatVisible(row.key)"
                    @change="onToggleStatVisible(row.key)"
                  />
                  <span>{{ row.label }}</span>
                </label>
              </div>
            </Teleport>
          </span>
          <span
            v-if="indicatorHelpItem"
            class="stat-help-wrap"
            @mouseenter="emit('show-tip', $event, indicatorHelpItem)"
            @mouseleave="emit('hide-tip')"
            @focusin="emit('show-tip', $event, indicatorHelpItem)"
            @focusout="emit('hide-tip')"
          >
            <button type="button" class="stat-help-btn" aria-label="图表指标说明">?</button>
          </span>
        </span>
        <div class="stats-mode-toggle">
          <button
            type="button"
            class="stats-mode-btn"
            :class="{ active: statMode === 'history' }"
            @click="setStatMode('history')"
          >
            历史统计
          </button>
          <button
            type="button"
            class="stats-mode-btn"
            :class="{ active: statMode === 'page' }"
            @click="setStatMode('page')"
          >
            当前页统计
          </button>
        </div>
      </div>
    </div>

    <table class="distribution-table table-foot">
      <TrendTableColgroup
        :column-count="columnHeaders.length"
        :col-key-prefix="colKeyPrefix"
      />
      <TrendChartStats
        :chart="chart"
        :column-headers="columnHeaders"
        :stat-rows="statRows"
        :stat-cell-value="statCellValue"
        :stat-cell-extra-class="statCellExtraClass"
        :marks="marks"
        @show-tip="(event, item) => emit('show-tip', event, item)"
        @hide-tip="emit('hide-tip')"
      />
    </table>
  </div>
</template>
