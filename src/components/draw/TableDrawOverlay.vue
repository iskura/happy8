<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'

const props = defineProps({
  drawTool: { type: Object, required: true },
  targetRef: { type: Object, default: null },
  contentKey: { type: [String, Number], default: '' },
})

const hitLayerActive = computed(() => {
  const tool = props.drawTool?.activeTool
  return Boolean(tool && !['clear', 'undo'].includes(tool))
})

const overlayRef = ref(null)
const size = ref({ width: 0, height: 0 })
const draft = ref(null)

let resizeObserver = null
let drawing = false

function getTargetEl() {
  return unref(props.targetRef) || null
}

function syncSize() {
  const el = getTargetEl()
  if (!el) return
  // 仅用 offset 尺寸，避免 overlay 高度参与 scrollHeight 形成「缩表后仍有大段空白」
  size.value = {
    width: el.offsetWidth,
    height: el.offsetHeight,
  }
}

function localPoint(event) {
  const overlay = overlayRef.value
  const el = getTargetEl()
  if (!overlay || !el) return { x: 0, y: 0 }

  const overlayRect = overlay.getBoundingClientRect()
  return {
    x: event.clientX - overlayRect.left,
    y: event.clientY - overlayRect.top,
  }
}

function normalizeBox(start, end) {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(end.x - start.x),
    h: Math.abs(end.y - start.y),
  }
}

function finishShape(shape) {
  if (!shape) return
  const minSize = 4
  const isLineLike = shape.type === 'line' || shape.type === 'arrow'
  const lineLength = isLineLike
    ? Math.hypot(shape.x2 - shape.x1, shape.y2 - shape.y1)
    : 0
  const valid =
    shape.points?.length > 2 ||
    (isLineLike ? lineLength >= minSize : shape.w >= minSize || shape.h >= minSize)

  if (valid) {
    props.drawTool.addShape(shape)
  }
  draft.value = null
}

function onPointerDown(event) {
  if (!hitLayerActive.value) return
  if (event.button !== 0) return

  const tool = props.drawTool.activeTool
  const color = props.drawTool.color
  const point = localPoint(event)

  drawing = true
  draft.value = {
    type: tool,
    color,
    x1: point.x,
    y1: point.y,
    x2: point.x,
    y2: point.y,
    points: tool === 'curve' ? [point] : [],
  }
  event.preventDefault()
  event.stopPropagation()
}

function onPointerMove(event) {
  if (!drawing || !draft.value) return
  const point = localPoint(event)
  const shape = draft.value

  if (shape.type === 'curve') {
    const last = shape.points[shape.points.length - 1]
    if (!last || Math.hypot(point.x - last.x, point.y - last.y) > 3) {
      shape.points.push(point)
    }
    return
  }

  shape.x2 = point.x
  shape.y2 = point.y
}

function onPointerUp(event) {
  if (!drawing || !draft.value) return
  drawing = false
  const shape = draft.value
  const color = shape.color

  if (shape.type === 'curve') {
    finishShape({ type: 'curve', color, points: [...shape.points] })
    return
  }

  if (shape.type === 'line' || shape.type === 'arrow') {
    finishShape({
      type: shape.type,
      color,
      x1: shape.x1,
      y1: shape.y1,
      x2: shape.x2,
      y2: shape.y2,
    })
    event?.preventDefault()
    return
  }

  const box = normalizeBox(
    { x: shape.x1, y: shape.y1 },
    { x: shape.x2, y: shape.y2 },
  )
  finishShape({ type: shape.type, color, ...box })
  event?.preventDefault()
}

function lineEndpoints(shape) {
  if (shape.x1 != null) {
    return {
      x1: shape.x1,
      y1: shape.y1,
      x2: shape.x2,
      y2: shape.y2,
    }
  }
  return {
    x1: shape.x,
    y1: shape.y,
    x2: shape.x + shape.w,
    y2: shape.y + shape.h,
  }
}

function curvePath(points) {
  if (!points.length) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i += 1) {
    d += ` L ${points[i].x} ${points[i].y}`
  }
  return d
}

onMounted(() => {
  nextTick(syncSize)
  const el = getTargetEl()
  if (typeof ResizeObserver !== 'undefined' && el) {
    resizeObserver = new ResizeObserver(syncSize)
    resizeObserver.observe(el)
  }
  window.addEventListener('resize', syncSize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncSize)
  resizeObserver?.disconnect()
})

watch(
  hitLayerActive,
  (value) => {
    if (!value) {
      drawing = false
      draft.value = null
    }
  },
)

watch(
  () => getTargetEl(),
  (el) => {
    resizeObserver?.disconnect()
    if (el && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize)
      resizeObserver.observe(el)
    }
    nextTick(syncSize)
  },
)

watch(
  () => props.contentKey,
  () => nextTick(syncSize),
)
</script>

<template>
  <div
    class="table-draw-display"
    :style="{ width: `${size.width}px`, height: `${size.height}px` }"
  >
    <svg
      class="draw-svg"
      :width="size.width"
      :height="size.height"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker
          id="draw-arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="context-stroke" />
        </marker>
      </defs>

      <template v-for="(shape, index) in drawTool.shapes" :key="`shape-${index}`">
        <rect
          v-if="shape.type === 'rect'"
          :x="shape.x"
          :y="shape.y"
          :width="shape.w"
          :height="shape.h"
          fill="none"
          :stroke="shape.color"
          stroke-width="2"
        />
        <ellipse
          v-else-if="shape.type === 'circle'"
          :cx="shape.x + shape.w / 2"
          :cy="shape.y + shape.h / 2"
          :rx="shape.w / 2"
          :ry="shape.h / 2"
          fill="none"
          :stroke="shape.color"
          stroke-width="2"
        />
        <line
          v-else-if="shape.type === 'line'"
          :x1="lineEndpoints(shape).x1"
          :y1="lineEndpoints(shape).y1"
          :x2="lineEndpoints(shape).x2"
          :y2="lineEndpoints(shape).y2"
          :stroke="shape.color"
          stroke-width="2"
        />
        <line
          v-else-if="shape.type === 'arrow'"
          :x1="lineEndpoints(shape).x1"
          :y1="lineEndpoints(shape).y1"
          :x2="lineEndpoints(shape).x2"
          :y2="lineEndpoints(shape).y2"
          :stroke="shape.color"
          stroke-width="2"
          marker-end="url(#draw-arrowhead)"
        />
        <path
          v-else-if="shape.type === 'curve'"
          :d="curvePath(shape.points)"
          fill="none"
          :stroke="shape.color"
          stroke-width="2"
        />
      </template>

      <template v-if="draft">
        <rect
          v-if="draft.type === 'rect'"
          :x="Math.min(draft.x1, draft.x2)"
          :y="Math.min(draft.y1, draft.y2)"
          :width="Math.abs(draft.x2 - draft.x1)"
          :height="Math.abs(draft.y2 - draft.y1)"
          fill="none"
          :stroke="draft.color"
          stroke-width="2"
          stroke-dasharray="4 3"
        />
        <ellipse
          v-else-if="draft.type === 'circle'"
          :cx="(draft.x1 + draft.x2) / 2"
          :cy="(draft.y1 + draft.y2) / 2"
          :rx="Math.abs(draft.x2 - draft.x1) / 2"
          :ry="Math.abs(draft.y2 - draft.y1) / 2"
          fill="none"
          :stroke="draft.color"
          stroke-width="2"
          stroke-dasharray="4 3"
        />
        <line
          v-else-if="draft.type === 'line' || draft.type === 'arrow'"
          :x1="draft.x1"
          :y1="draft.y1"
          :x2="draft.x2"
          :y2="draft.y2"
          :stroke="draft.color"
          stroke-width="2"
          stroke-dasharray="4 3"
          :marker-end="draft.type === 'arrow' ? 'url(#draw-arrowhead)' : undefined"
        />
        <path
          v-else-if="draft.type === 'curve'"
          :d="curvePath(draft.points)"
          fill="none"
          :stroke="draft.color"
          stroke-width="2"
          stroke-dasharray="4 3"
        />
      </template>
    </svg>
  </div>

  <div
    v-if="hitLayerActive"
    ref="overlayRef"
    class="table-draw-hitlayer"
    :style="{ width: `${size.width}px`, height: `${size.height}px` }"
    @mousedown="onPointerDown"
    @mousemove="onPointerMove"
    @mouseup="onPointerUp"
    @mouseleave="onPointerUp"
  />
</template>

<style scoped>
.table-draw-display {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 8;
  pointer-events: none;
}

.table-draw-hitlayer {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  cursor: crosshair;
}

.draw-svg {
  display: block;
  pointer-events: none;
}
</style>
