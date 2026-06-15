<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'

const props = defineProps({
  drawTool: { type: Object, required: true },
  isDrawing: { type: Boolean, default: false },
  targetRef: { type: Object, default: null },
})

const overlayRef = ref(null)
const size = ref({ width: 0, height: 0 })
const draft = ref(null)
const textInput = ref({
  visible: false,
  x: 0,
  y: 0,
  value: '',
})

let resizeObserver = null
let drawing = false

function getTargetEl() {
  return unref(props.targetRef) || null
}

function syncSize() {
  const el = getTargetEl()
  if (!el) return
  size.value = {
    width: Math.max(el.offsetWidth, el.scrollWidth),
    height: Math.max(el.offsetHeight, el.scrollHeight),
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
  const minSize = shape.type === 'text' ? 0 : 4
  const isLineLike = shape.type === 'line' || shape.type === 'arrow'
  const lineLength = isLineLike
    ? Math.hypot(shape.x2 - shape.x1, shape.y2 - shape.y1)
    : 0
  const valid =
    shape.type === 'text' ||
    shape.points?.length > 2 ||
    (isLineLike ? lineLength >= minSize : shape.w >= minSize || shape.h >= minSize)

  if (valid) {
    props.drawTool.addShape(shape)
  }
  draft.value = null
}

function onPointerDown(event) {
  if (!props.isDrawing) return
  if (event.button !== 0) return

  const tool = props.drawTool.activeTool
  const color = props.drawTool.color
  const point = localPoint(event)

  if (tool === 'text') {
    textInput.value = { visible: true, x: point.x, y: point.y, value: '' }
    nextTick(() => {
      overlayRef.value?.querySelector('.draw-text-input')?.focus()
    })
    event.preventDefault()
    event.stopPropagation()
    return
  }

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

function commitText() {
  const value = textInput.value.value.trim()
  if (value) {
    props.drawTool.addShape({
      type: 'text',
      color: props.drawTool.color,
      x: textInput.value.x,
      y: textInput.value.y,
      text: value,
    })
  }
  textInput.value.visible = false
  textInput.value.value = ''
}

function cancelText() {
  textInput.value.visible = false
  textInput.value.value = ''
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
</script>

<template>
  <div
    ref="overlayRef"
    class="table-draw-overlay"
    :class="{ interactive: isDrawing }"
    :style="{ width: `${size.width}px`, height: `${size.height}px` }"
    @mousedown="onPointerDown"
    @mousemove="onPointerMove"
    @mouseup="onPointerUp"
    @mouseleave="onPointerUp"
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
        <text
          v-else-if="shape.type === 'text'"
          :x="shape.x"
          :y="shape.y"
          :fill="shape.color"
          font-size="14"
          font-weight="700"
        >
          {{ shape.text }}
        </text>
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

    <input
      v-if="textInput.visible"
      class="draw-text-input"
      :style="{ left: `${textInput.x}px`, top: `${textInput.y}px` }"
      v-model="textInput.value"
      placeholder="输入文字"
      @keydown.enter.prevent="commitText"
      @keydown.esc.prevent="cancelText"
      @blur="commitText"
    />
  </div>
</template>

<style scoped>
.table-draw-overlay {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 8;
  pointer-events: none;
}

.table-draw-overlay.interactive {
  pointer-events: auto;
  cursor: crosshair;
  z-index: 10;
}

.draw-svg {
  display: block;
  pointer-events: none;
}

.draw-text-input {
  position: absolute;
  z-index: 31;
  min-width: 80px;
  padding: 2px 6px;
  border: 1px solid #94a3b8;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 700;
  outline: none;
  background: #fff;
  pointer-events: auto;
}
</style>
