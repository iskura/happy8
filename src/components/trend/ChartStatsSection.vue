<script setup>
import TrendTableColgroup from './TrendTableColgroup.vue'
import TrendChartStats from './TrendChartStats.vue'

defineProps({
  chart: { type: Object, required: true },
  columnHeaders: { type: Array, required: true },
  statRows: { type: Array, required: true },
  indicatorHelpItem: { type: Object, default: null },
  statCellValue: { type: Function, required: true },
  statMode: { type: String, default: 'page' },
  marks: { type: Object, default: () => ({}) },
  colKeyPrefix: { type: String, default: 'col-stats' },
})

const emit = defineEmits(['show-tip', 'hide-tip', 'update:statMode'])

function setStatMode(mode) {
  emit('update:statMode', mode)
}
</script>

<template>
  <div class="chart-stats-section">
    <div class="chart-stats-title-bar">
      <div class="stats-title-bar">
        <span class="stat-label-wrap">
          <span>图表指标统计</span>
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
        :marks="marks"
        @show-tip="(event, item) => emit('show-tip', event, item)"
        @hide-tip="emit('hide-tip')"
      />
    </table>
  </div>
</template>
