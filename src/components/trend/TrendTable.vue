<script setup>
import { computed, ref, toRef } from 'vue'
import { resolveChartUi } from '../../config/chartRegistry.js'
import { useTrendTableColumns } from '../../composables/trend/useTrendTableColumns.js'
import { useTrendTableLayout } from '../../composables/trend/useTrendTableLayout.js'
import { useFreezePanels } from '../../composables/trend/useFreezePanels.js'
import { useStatTip } from '../../composables/trend/useStatTip.js'
import { usePredictionRows } from '../../composables/trend/usePredictionRows.js'
import { useTrendStats, useTrendCellClasses } from '../../composables/trend/useTrendCellClasses.js'
import TrendTableToolbar from './TrendTableToolbar.vue'
import TrendTableColgroup from './TrendTableColgroup.vue'
import TrendTableBody from './TrendTableBody.vue'
import TrendChartHead from './TrendChartHead.vue'
import TrendChartPrediction from './TrendChartPrediction.vue'
import ChartStatsSection from './ChartStatsSection.vue'
import PredictionMergeDialog from './PredictionMergeDialog.vue'
import TableDrawOverlay from '../draw/TableDrawOverlay.vue'
import './trend-table.css'

const props = defineProps({
  chart: { type: Object, required: true },
  marks: { type: Object, default: () => ({}) },
  rowOrder: { type: String, default: 'asc' },
  drawTool: { type: Object, default: null },
  isDrawing: { type: Boolean, default: false },
})

const emit = defineEmits(['update:rowOrder'])

const chartRef = toRef(props, 'chart')
const marksRef = toRef(props, 'marks')

const ui = computed(() => props.chart.ui || resolveChartUi({ kind: 'trend' }, props.chart))

const {
  columnHeaders,
  columnNumbers,
  headerGroups,
  wrapStyle,
  issueColWidth,
} = useTrendTableColumns(chartRef, ui)

const tableWrapRef = ref(null)
const bodyScrollRef = ref(null)
const tableSuiteRef = ref(null)

const { freeze, toggleFreeze } = useFreezePanels(ui.value?.freeze)

useTrendTableLayout({
  tableWrapRef,
  bodyScrollRef,
  columnHeaders,
  chart: chartRef,
  freeze,
  issueColWidth,
  ui,
})

const { statTip, statTipRef, showStatTip, hideStatTip } = useStatTip()

const {
  statMode,
  statRows,
  indicatorHelpItem,
  statCellValue,
} = useTrendStats(chartRef, ui)

const chartId = computed(() => props.chart.id)
const {
  predictionRows,
  activeRowId,
  copiedKey,
  addPredictionRowBelow,
  removePredictionRow,
  isPredictionSelected,
  togglePredictionCell,
  copyPredictionRow,
  isPredictionCol,
  isMergeRowSelected,
  toggleMergeRowSelect,
  mergeRowsKeepSources,
  mergeRowsAndDeleteSources,
  cancelMergeSelection,
  showMergeDialog,
  mergeSelectedRowIds,
} = usePredictionRows(chartId)

const {
  cellClasses,
  displayHit,
  isSegmentLine,
  formatIssueDate,
} = useTrendCellClasses(chartRef, marksRef, ui)

const issueColMode = ref('issue')
const predictionEnabled = computed(() => ui.value?.prediction?.enabled !== false)
const predictionMaxColumns = computed(() => ui.value?.prediction?.maxColumns)

function setRowOrder(order) {
  emit('update:rowOrder', order)
}

function checkPredictionCol(num) {
  return isPredictionCol(num, predictionMaxColumns.value)
}

const latestDrawHitSet = computed(() => {
  const rows = props.chart.rows
  if (!rows?.length) return new Set()

  let latest = rows[0]
  for (let i = 1; i < rows.length; i += 1) {
    if (Number(rows[i].issue) > Number(latest.issue)) latest = rows[i]
  }

  return new Set(latest.activeCols || latest.numbers || [])
})

function isLatestDrawHit(num) {
  return latestDrawHitSet.value.has(num)
}
</script>

<template>
  <div ref="tableWrapRef" class="distribution-wrap" :style="wrapStyle">
    <TrendTableToolbar
      :legend="ui.legend"
      :freeze="freeze"
      :row-order="rowOrder"
      @toggle-freeze="toggleFreeze"
      @update:row-order="setRowOrder"
    />

    <div v-if="!chart.rows?.length" class="empty-chart">没有符合筛选条件的开奖数据</div>

    <div v-else ref="bodyScrollRef" class="distribution-scroll">
      <div class="distribution-h-scroll draw-layer-wrap">
        <div ref="tableSuiteRef" class="table-suite">
          <table class="distribution-table table-body">
            <TrendTableColgroup
              :column-count="columnHeaders.length"
              col-key-prefix="col-body"
            />
            <TrendChartHead
              :chart="chart"
              :column-headers="columnHeaders"
              :issue-col-mode="issueColMode"
              :frozen="freeze.head"
              :header-groups="headerGroups"
              :marks="marks"
              @update:issue-col-mode="issueColMode = $event"
            />
            <TrendTableBody
              :rows="chart.rows"
              :issue-col-mode="issueColMode"
              :marks="marks"
              :cell-classes="cellClasses"
              :display-hit="displayHit"
              :format-issue-date="formatIssueDate"
              :is-segment-line="isSegmentLine"
            />
            <TrendChartPrediction
              v-if="predictionEnabled && !freeze.pred"
              :chart="chart"
              :column-headers="columnHeaders"
              :column-numbers="columnNumbers"
              :prediction-rows="predictionRows"
              :active-row-id="activeRowId"
              :copied-key="copiedKey"
              :marks="marks"
              :is-prediction-col="checkPredictionCol"
              :is-prediction-selected="isPredictionSelected"
              :is-merge-row-selected="isMergeRowSelected"
              :is-latest-draw-hit="isLatestDrawHit"
              @add-row-below="addPredictionRowBelow"
              @remove-row="removePredictionRow"
              @toggle-cell="togglePredictionCell"
              @copy-row="copyPredictionRow"
              @toggle-merge-row="toggleMergeRowSelect"
            />
          </table>

          <ChartStatsSection
            v-if="!freeze.stats"
            :chart="chart"
            :column-headers="columnHeaders"
            :stat-rows="statRows"
            :indicator-help-item="indicatorHelpItem"
            :stat-cell-value="statCellValue"
            :stat-mode="statMode"
            :marks="marks"
            col-key-prefix="col-stats"
            @show-tip="showStatTip"
            @hide-tip="hideStatTip"
            @update:stat-mode="statMode = $event"
          />

          <div
            v-if="freeze.pred || freeze.stats"
            class="distribution-bottom-fixed"
            :class="{ 'is-sticky': freeze.pred || freeze.stats }"
          >
            <table v-if="predictionEnabled && freeze.pred" class="distribution-table table-pred">
              <TrendTableColgroup
                :column-count="columnHeaders.length"
                col-key-prefix="col-pred"
              />
              <TrendChartPrediction
                :chart="chart"
                :column-headers="columnHeaders"
                :column-numbers="columnNumbers"
                :prediction-rows="predictionRows"
                :active-row-id="activeRowId"
                :copied-key="copiedKey"
                :marks="marks"
                :is-prediction-col="checkPredictionCol"
                :is-prediction-selected="isPredictionSelected"
                :is-merge-row-selected="isMergeRowSelected"
                :is-latest-draw-hit="isLatestDrawHit"
                @add-row-below="addPredictionRowBelow"
                @remove-row="removePredictionRow"
                @toggle-cell="togglePredictionCell"
                @copy-row="copyPredictionRow"
                @toggle-merge-row="toggleMergeRowSelect"
              />
            </table>

            <ChartStatsSection
              v-if="freeze.stats"
              :chart="chart"
              :column-headers="columnHeaders"
              :stat-rows="statRows"
              :indicator-help-item="indicatorHelpItem"
              :stat-cell-value="statCellValue"
              :stat-mode="statMode"
              :marks="marks"
              col-key-prefix="col-foot"
              @show-tip="showStatTip"
              @hide-tip="hideStatTip"
              @update:stat-mode="statMode = $event"
            />
          </div>

          <TableDrawOverlay
            v-if="drawTool"
            :draw-tool="drawTool"
            :is-drawing="isDrawing"
            :target-ref="tableSuiteRef"
            :content-key="chart.rows?.length ?? 0"
          />
        </div>
      </div>
    </div>

    <PredictionMergeDialog
      v-if="showMergeDialog"
      :count="mergeSelectedRowIds.length"
      @merge="mergeRowsKeepSources"
      @delete-merge="mergeRowsAndDeleteSources"
      @cancel="cancelMergeSelection"
    />

    <Teleport to="body">
      <div
        v-if="statTip"
        ref="statTipRef"
        class="stat-help-popover"
        :class="{ 'is-bottom': statTip.placement === 'bottom' }"
        role="tooltip"
        :style="{
          left: `${statTip.x}px`,
          top: `${statTip.y}px`,
          '--arrow-offset': `${statTip.arrowOffset}px`,
        }"
      >
        {{ statTip.text }}
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.stat-help-popover {
  position: fixed;
  z-index: 10001;
  width: max-content;
  max-width: min(280px, calc(100vw - 20px));
  padding: 8px 10px;
  border-radius: 8px;
  background: #1e293b;
  color: #f8fafc;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.45;
  text-align: left;
  white-space: pre-line;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.22);
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 8px));
}

.stat-help-popover.is-bottom {
  transform: translate(-50%, 8px);
}

.stat-help-popover::after {
  content: '';
  position: absolute;
  left: calc(50% + var(--arrow-offset, 0px));
  top: 100%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #1e293b;
}

.stat-help-popover.is-bottom::after {
  top: auto;
  bottom: 100%;
  border-top-color: transparent;
  border-bottom-color: #1e293b;
}

.draw-layer-wrap {
  position: relative;
}
</style>
