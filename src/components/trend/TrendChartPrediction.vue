<script setup>
import CopyButton from '../CopyButton.vue'
import { isZoneBoundaryCol } from '../../utils/chartZone.js'

const props = defineProps({
  chart: { type: Object, required: true },
  columnHeaders: { type: Array, required: true },
  columnNumbers: { type: Array, required: true },
  predictionRows: { type: Array, required: true },
  activeRowId: { type: String, default: '' },
  copiedKey: { type: String, default: '' },
  isPredictionCol: { type: Function, required: true },
  isPredictionSelected: { type: Function, required: true },
})

const emit = defineEmits([
  'add-row-below',
  'remove-row',
  'toggle-cell',
  'copy-row',
])
</script>

<template>
  <tbody class="prediction-zone">
    <tr
      v-for="(predRow, rowIndex) in predictionRows"
      :key="predRow.id"
      class="prediction-row"
      :class="{ active: activeRowId === predRow.id }"
    >
      <td class="sticky-col col-issue">
        <div class="pred-controls">
          <span class="pred-seq">{{ rowIndex + 1 }}</span>
          <button
            type="button"
            class="pred-action-btn add"
            title="在此行下方新增"
            @click="emit('add-row-below', rowIndex)"
          >
            +
          </button>
          <button
            type="button"
            class="pred-action-btn del"
            title="删除此行"
            @click="emit('remove-row', rowIndex)"
          >
            −
          </button>
          <CopyButton
            size="sm"
            :copied="copiedKey === predRow.id"
            :disabled="!predRow.numbers.length"
            title="复制所选号码"
            @click="emit('copy-row', predRow.id)"
          />
        </div>
      </td>
      <td
        v-for="num in columnNumbers"
        :key="`${predRow.id}-${num}`"
        class="col-num pred-cell"
        :class="{
          selected: isPredictionCol(num) && isPredictionSelected(predRow.id, num),
          'zone-line': isZoneBoundaryCol(num, chart),
          'group-separator': chart.groupSeparators?.includes(num),
          inactive: activeRowId !== predRow.id,
          'pred-readonly': !isPredictionCol(num),
        }"
        @click="isPredictionCol(num) && emit('toggle-cell', predRow.id, num)"
      >
        <span
          v-if="isPredictionCol(num) && isPredictionSelected(predRow.id, num)"
          class="pred-ball"
        >
          {{ columnHeaders[num - 1] }}
        </span>
      </td>
    </tr>
  </tbody>
</template>
