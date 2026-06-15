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
  marks: { type: Object, default: () => ({}) },
  isPredictionCol: { type: Function, required: true },
  isPredictionSelected: { type: Function, required: true },
  isMergeRowSelected: { type: Function, required: true },
  isLatestDrawHit: { type: Function, default: () => false },
})

const emit = defineEmits([
  'add-row-below',
  'remove-row',
  'toggle-cell',
  'copy-row',
  'toggle-merge-row',
])
</script>

<template>
  <tbody class="prediction-zone">
    <tr
      v-for="(predRow, rowIndex) in predictionRows"
      :key="predRow.id"
      class="prediction-row"
      :class="{
        active: activeRowId === predRow.id,
        'merge-marked': isMergeRowSelected(predRow.id),
      }"
    >
      <td class="sticky-col col-issue">
        <div class="pred-controls">
          <button
            type="button"
            class="pred-merge-dot"
            :class="{ 'is-pinned': isMergeRowSelected(predRow.id) }"
            title="标记参与合集"
            aria-label="标记参与合集"
            @click.stop="emit('toggle-merge-row', predRow.id)"
          />
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
          'zone-line': marks.zoneLine && isZoneBoundaryCol(num, chart),
          inactive: activeRowId !== predRow.id,
          'pred-readonly': !isPredictionCol(num),
        }"
        @click="isPredictionCol(num) && emit('toggle-cell', predRow.id, num)"
      >
        <span
          v-if="isPredictionCol(num) && isPredictionSelected(predRow.id, num)"
          class="pred-ball"
          :class="{ 'hit-latest': isLatestDrawHit(num) }"
        >
          {{ columnHeaders[num - 1] }}
        </span>
      </td>
    </tr>
  </tbody>
</template>
