<script setup>
import { isZoneBoundaryCol } from '../../utils/chartZone.js'

const props = defineProps({
  chart: { type: Object, required: true },
  columnHeaders: { type: Array, required: true },
  statRows: { type: Array, required: true },
  indicatorHelpItem: { type: Object, default: null },
  statCellValue: { type: Function, required: true },
  statMode: { type: String, default: 'page' },
})

const emit = defineEmits(['show-tip', 'hide-tip', 'update:statMode'])

function setStatMode(mode) {
  emit('update:statMode', mode)
}

function statCellClass(index) {
  const colNum = index + 1
  return {
    'zone-head': isZoneBoundaryCol(colNum, props.chart),
    'group-separator': props.chart.groupSeparators?.includes(colNum),
  }
}
</script>

<template>
  <tfoot>
    <tr class="chart-stats-title-row">
      <td :colspan="columnHeaders.length + 1" class="chart-stats-title-cell">
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
      </td>
    </tr>
    <tr v-for="stat in statRows" :key="stat.key" class="dist-stats-row">
      <td class="sticky-col col-issue dist-stats-label">
        <span class="stat-label-wrap">
          <span>{{ stat.label }}</span>
          <span
            v-if="stat.help"
            class="stat-help-wrap"
            @mouseenter="emit('show-tip', $event, stat)"
            @mouseleave="emit('hide-tip')"
            @focusin="emit('show-tip', $event, stat)"
            @focusout="emit('hide-tip')"
          >
            <button type="button" class="stat-help-btn" :aria-label="`${stat.label}说明`">?</button>
          </span>
        </span>
      </td>
      <td
        v-for="(_, index) in columnHeaders"
        :key="`${stat.key}-${index}`"
        class="col-num stat-cell"
        :class="[
          statCellClass(index),
          { 'stat-empty': !statCellValue(stat.key, index + 1) },
        ]"
      >
        {{ statCellValue(stat.key, index + 1) }}
      </td>
    </tr>
  </tfoot>
</template>
