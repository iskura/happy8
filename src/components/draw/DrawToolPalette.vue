<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { DRAW_COLORS, DRAW_TOOLS } from '../../constants/drawTool.js'

const props = defineProps({
  drawTool: { type: Object, required: true },
})

const showPanel = ref(false)
const triggerRef = ref(null)
const panelRef = ref(null)
const panelStyle = ref({ top: '0px', left: '0px' })

let hideTimer = null

const isActive = computed(
  () => props.drawTool.activeTool && !['clear', 'undo'].includes(props.drawTool.activeTool),
)

function updatePanelPosition() {
  const trigger = triggerRef.value
  const panel = panelRef.value
  if (!trigger || !panel) return

  const rect = trigger.getBoundingClientRect()
  const panelRect = panel.getBoundingClientRect()
  const margin = 8
  const gap = 6

  let top = rect.bottom + gap
  let left = rect.right - panelRect.width

  if (left < margin) left = margin
  if (left + panelRect.width > window.innerWidth - margin) {
    left = window.innerWidth - panelRect.width - margin
  }

  if (top + panelRect.height > window.innerHeight - margin) {
    top = rect.top - panelRect.height - gap
  }
  if (top < margin) top = margin

  panelStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
  }
}

function openPanel() {
  clearTimeout(hideTimer)
  showPanel.value = true
  nextTick(() => {
    updatePanelPosition()
  })
}

function scheduleClose() {
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    showPanel.value = false
  }, 200)
}

function pickTool(toolId) {
  props.drawTool.selectTool(toolId)
}

function pickColor(value) {
  props.drawTool.selectColor(value)
}

function onWindowChange() {
  if (showPanel.value) updatePanelPosition()
}

onBeforeUnmount(() => {
  clearTimeout(hideTimer)
  window.removeEventListener('resize', onWindowChange)
  window.removeEventListener('scroll', onWindowChange, true)
})

if (typeof window !== 'undefined') {
  window.addEventListener('resize', onWindowChange)
  window.addEventListener('scroll', onWindowChange, true)
}
</script>

<template>
  <div
    class="draw-tool-anchor"
    @mouseenter="openPanel"
    @mouseleave="scheduleClose"
  >
    <button
      ref="triggerRef"
      type="button"
      class="draw-tool-trigger"
      :class="{ active: showPanel || isActive }"
      title="绘制工具"
      aria-label="绘制工具"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
        />
      </svg>
    </button>

    <Teleport to="body">
      <div
        v-show="showPanel"
        ref="panelRef"
        class="draw-tool-panel"
        :style="panelStyle"
        @mouseenter="openPanel"
        @mouseleave="scheduleClose"
      >
        <div class="draw-tool-row">
          <button
            v-for="tool in DRAW_TOOLS"
            :key="tool.id"
            type="button"
            class="draw-tool-item"
            :class="{ active: drawTool.activeTool === tool.id }"
            @click="pickTool(tool.id)"
          >
            <span class="draw-tool-icon" :class="`icon-${tool.id}`" />
            <span class="draw-tool-label">{{ tool.label }}</span>
          </button>
        </div>
        <div class="draw-color-row">
          <button
            v-for="item in DRAW_COLORS"
            :key="item.id"
            type="button"
            class="draw-color-dot"
            :class="{ active: drawTool.color === item.value }"
            :style="{ '--dot-color': item.value }"
            :title="item.id"
            @click="pickColor(item.value)"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.draw-tool-anchor {
  position: relative;
  margin-left: auto;
  flex-shrink: 0;
}

.draw-tool-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid #d8dee9;
  border-radius: 4px;
  background: #fff;
  color: var(--text-soft);
  cursor: pointer;
}

.draw-tool-trigger:hover,
.draw-tool-trigger.active {
  border-color: #1677ff;
  color: #1677ff;
  background: #f0f7ff;
}
</style>

<style>
.draw-tool-panel {
  position: fixed;
  z-index: 10050;
  width: max-content;
  max-width: calc(100vw - 16px);
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
}

.draw-tool-panel .draw-tool-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin-bottom: 10px;
}

.draw-tool-panel .draw-tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 44px;
  padding: 4px 2px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
}

.draw-tool-panel .draw-tool-item:hover {
  background: #f8fafc;
}

.draw-tool-panel .draw-tool-item.active .draw-tool-label {
  color: #e53935;
  font-weight: 700;
}

.draw-tool-panel .draw-tool-icon {
  width: 28px;
  height: 22px;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
}

.draw-tool-panel .icon-rect {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 22'%3E%3Crect x='4' y='3' width='20' height='16' fill='none' stroke='%23334155' stroke-width='1.5'/%3E%3Ccircle cx='4' cy='3' r='1.5' fill='%23fff' stroke='%23334155'/%3E%3Ccircle cx='24' cy='3' r='1.5' fill='%23fff' stroke='%23334155'/%3E%3Ccircle cx='4' cy='19' r='1.5' fill='%23fff' stroke='%23334155'/%3E%3Ccircle cx='24' cy='19' r='1.5' fill='%23fff' stroke='%23334155'/%3E%3C/svg%3E");
}

.draw-tool-panel .icon-circle {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 22'%3E%3Cellipse cx='14' cy='11' rx='10' ry='7' fill='none' stroke='%23334155' stroke-width='1.5'/%3E%3C/svg%3E");
}

.draw-tool-panel .icon-line {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 22'%3E%3Cline x1='4' y1='18' x2='24' y2='4' stroke='%23334155' stroke-width='1.5'/%3E%3Ccircle cx='4' cy='18' r='1.5' fill='%23fff' stroke='%23334155'/%3E%3Ccircle cx='24' cy='4' r='1.5' fill='%23fff' stroke='%23334155'/%3E%3C/svg%3E");
}

.draw-tool-panel .icon-arrow {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 22'%3E%3Cline x1='4' y1='18' x2='22' y2='4' stroke='%23334155' stroke-width='1.5'/%3E%3Cpolygon points='22,4 18,6 20,8' fill='%23334155'/%3E%3C/svg%3E");
}

.draw-tool-panel .icon-curve {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 22'%3E%3Cpath d='M4 16 Q10 4 24 8' fill='none' stroke='%23334155' stroke-width='1.5'/%3E%3C/svg%3E");
}

.draw-tool-panel .icon-clear {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 22'%3E%3Cpath d='M8 10 L20 10 L18 18 L10 18 Z' fill='none' stroke='%23334155' stroke-width='1.3'/%3E%3Cpath d='M10 10 L12 6 L16 6 L18 10' fill='none' stroke='%23334155' stroke-width='1.3'/%3E%3C/svg%3E");
}

.draw-tool-panel .icon-undo {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 22'%3E%3Cpath d='M16 6 H8 C5 6 4 9 4 11 C4 13 5 16 8 16 H18' fill='none' stroke='%23334155' stroke-width='1.5'/%3E%3Cpolyline points='10,4 6,6 10,8' fill='none' stroke='%23334155' stroke-width='1.5'/%3E%3C/svg%3E");
}

.draw-tool-panel .draw-tool-label {
  font-size: 11px;
  color: #64748b;
  line-height: 1;
}

.draw-tool-panel .draw-color-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 2px;
}

.draw-tool-panel .draw-color-dot {
  width: 22px;
  height: 22px;
  border: 2px solid transparent;
  border-radius: 50%;
  background: var(--dot-color);
  cursor: pointer;
  padding: 0;
}

.draw-tool-panel .draw-color-dot.active {
  border-color: var(--dot-color);
  box-shadow: 0 0 0 2px #fff, 0 0 0 3px var(--dot-color);
}
</style>
