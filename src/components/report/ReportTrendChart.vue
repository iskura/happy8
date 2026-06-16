<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { buildChartSeries } from '../../utils/reportMetrics.js'

const props = defineProps({
  data: { type: Array, required: true },
  config: { type: Object, required: true },
})

const chartBodyRef = ref(null)
const chartSize = shallowRef({ width: 0, height: 0 })
const activeIndex = ref(null)

let resizeObserver = null

const chartConfig = computed(() => ({
  mode: 'line',
  color: 'var(--link)',
  valueLabel: '数值',
  valueSuffix: '',
  strokeWidth: 2,
  showCrosshair: true,
  ...props.config,
}))

const chartPadding = computed(() => ({
  top: 12,
  right: 10,
  bottom: 8,
  left: 22,
}))

const series = computed(() => {
  if (!chartSize.value.width || !chartSize.value.height) {
    return { coords: [], polyline: '', min: 0, max: 0 }
  }
  return buildChartSeries(props.data, {
    width: chartSize.value.width,
    height: chartSize.value.height,
    padding: chartPadding.value,
    mode: chartConfig.value.mode,
  })
})

const activePoint = computed(() => {
  if (activeIndex.value == null) return null
  return series.value.coords[activeIndex.value] || null
})

const latestPoint = computed(() => {
  const coords = series.value.coords
  return coords.length ? coords[coords.length - 1] : null
})

function barOpacity(index) {
  if (activeIndex.value == null) return 0.55
  return activeIndex.value === index ? 1 : 0.28
}

function pickNearest(clientX, containerEl) {
  const coords = series.value.coords
  if (!coords.length || !containerEl || !chartSize.value.width) return

  const rect = containerEl.getBoundingClientRect()
  if (!rect.width) return

  const x = ((clientX - rect.left) / rect.width) * chartSize.value.width

  let nearest = 0
  let minDist = Infinity
  for (const pt of coords) {
    const dist = Math.abs(pt.x - x)
    if (dist < minDist) {
      minDist = dist
      nearest = pt.index
    }
  }
  activeIndex.value = nearest
}

function onChartMove(event) {
  pickNearest(event.clientX, chartBodyRef.value)
}

function onChartLeave() {
  activeIndex.value = null
}

function syncChartSize(entry) {
  const width = Math.floor(entry.contentRect.width)
  const height = Math.floor(entry.contentRect.height)
  if (width > 0 && height > 0) {
    chartSize.value = { width, height }
  }
}

onMounted(() => {
  if (!chartBodyRef.value) return
  resizeObserver = new ResizeObserver((entries) => {
    syncChartSize(entries[0])
  })
  resizeObserver.observe(chartBodyRef.value)
  syncChartSize({ contentRect: chartBodyRef.value.getBoundingClientRect() })
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<template>
  <div class="trend-chart">
    <div
      v-if="activePoint"
      class="trend-chart-tip"
    >
      <strong>第 {{ activePoint.issue }} 期</strong>
      <span>{{ chartConfig.valueLabel }} {{ activePoint.value }}{{ chartConfig.valueSuffix }}</span>
    </div>
    <div
      v-else-if="latestPoint"
      class="trend-chart-tip trend-chart-tip--muted"
    >
      <span>最新 第 {{ latestPoint.issue }} 期 · {{ chartConfig.valueLabel }} {{ latestPoint.value }}{{ chartConfig.valueSuffix }}</span>
    </div>

    <div
      ref="chartBodyRef"
      class="trend-chart-body"
      @mousemove="onChartMove"
      @mouseleave="onChartLeave"
    >
      <svg
        v-if="chartSize.width > 0 && chartSize.height > 0"
        class="trend-chart-svg"
        :viewBox="`0 0 ${chartSize.width} ${chartSize.height}`"
        role="img"
        :aria-label="`${chartConfig.valueLabel}走势图`"
      >
        <line
          :x1="chartPadding.left"
          :y1="chartPadding.top"
          :x2="chartPadding.left"
          :y2="chartSize.height - chartPadding.bottom"
          class="trend-chart-axis"
        />
        <line
          :x1="chartPadding.left"
          :y1="chartSize.height - chartPadding.bottom"
          :x2="chartSize.width - chartPadding.right"
          :y2="chartSize.height - chartPadding.bottom"
          class="trend-chart-axis"
        />

        <text
          :x="chartPadding.left - 2"
          :y="chartPadding.top + 10"
          class="trend-chart-y-label"
          text-anchor="end"
        >{{ series.max }}</text>
        <text
          :x="chartPadding.left - 2"
          :y="chartSize.height - chartPadding.bottom"
          class="trend-chart-y-label"
          text-anchor="end"
        >{{ series.min }}</text>

        <template v-if="chartConfig.mode === 'bar'">
          <rect
            v-for="pt in series.coords"
            :key="pt.index"
            :x="pt.barX"
            :y="pt.barY"
            :width="pt.barWidth"
            :height="pt.barHeight"
            :fill="chartConfig.color"
            :opacity="barOpacity(pt.index)"
            rx="1"
          />
        </template>

        <polyline
          v-else-if="series.polyline"
          :points="series.polyline"
          fill="none"
          :stroke="chartConfig.color"
          :stroke-width="chartConfig.strokeWidth"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <line
          v-if="chartConfig.showCrosshair && activePoint"
          :x1="activePoint.x"
          :y1="chartPadding.top"
          :x2="activePoint.x"
          :y2="chartSize.height - chartPadding.bottom"
          class="trend-chart-cross"
        />
      </svg>
    </div>

    <div class="trend-chart-foot">
      <span>共 {{ data.length }} 期</span>
      <span>悬停查看每期数值</span>
    </div>
  </div>
</template>

<style scoped>
.trend-chart {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
  height: 100%;
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-alt);
  padding: var(--spacing-sm);
}

.trend-chart-tip {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-shrink: 0;
  min-height: 20px;
  font-size: var(--font-size-small);
}

.trend-chart-tip strong {
  color: var(--text);
  font-weight: 700;
}

.trend-chart-tip span {
  color: var(--text-soft);
}

.trend-chart-tip--muted span {
  color: var(--text-dim);
  font-size: var(--font-size-hint);
}

.trend-chart-body {
  position: relative;
  flex: 1;
  min-height: 0;
  cursor: crosshair;
}

.trend-chart-svg {
  display: block;
  width: 100%;
  height: 100%;
}

.trend-chart-axis {
  stroke: var(--border);
  stroke-width: 1;
}

.trend-chart-y-label {
  fill: var(--text-dim);
  font-size: 10px;
  font-weight: 600;
}

.trend-chart-cross {
  stroke: var(--border-strong);
  stroke-width: 1;
  stroke-dasharray: 3 3;
  opacity: 0.8;
}

.trend-chart-foot {
  display: flex;
  justify-content: space-between;
  flex-shrink: 0;
  font-size: 10px;
  color: var(--text-dim);
}
</style>
