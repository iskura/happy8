<script setup>
import { isZoneBoundaryCol } from '../../utils/chartZone.js'

const props = defineProps({
  chart: { type: Object, required: true },
  columnHeaders: { type: Array, required: true },
  statRows: { type: Array, required: true },
  statCellValue: { type: Function, required: true },
  marks: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['show-tip', 'hide-tip'])

function statCellClass(index) {
  const colNum = index + 1
  return {
    'zone-line': props.marks.zoneLine && isZoneBoundaryCol(colNum, props.chart),
  }
}
</script>

<template>
  <tfoot>
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
