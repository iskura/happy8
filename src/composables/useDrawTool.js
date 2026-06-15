import { computed, reactive, watch } from 'vue'
import { DEFAULT_DRAW_COLOR } from '../constants/drawTool.js'

const STORAGE_PREFIX = 'happy8-draw-shapes'

function loadShapes(chartId) {
  if (!chartId) return []
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}-${chartId}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveShapes(chartId, shapes) {
  if (!chartId) return
  try {
    localStorage.setItem(`${STORAGE_PREFIX}-${chartId}`, JSON.stringify(shapes))
  } catch {
    // ignore
  }
}

export function useDrawTool(chartId) {
  const drawTool = reactive({
    activeTool: '',
    color: DEFAULT_DRAW_COLOR,
    shapes: [],
    selectTool(toolId) {
      if (toolId === 'clear') {
        drawTool.shapes = []
        drawTool.activeTool = ''
        return
      }
      if (toolId === 'undo') {
        drawTool.shapes = drawTool.shapes.slice(0, -1)
        return
      }
      if (drawTool.activeTool === toolId) {
        drawTool.activeTool = ''
        return
      }
      drawTool.activeTool = toolId
    },
    selectColor(value) {
      drawTool.color = value
    },
    addShape(shape) {
      drawTool.shapes.push(shape)
    },
  })

  const isDrawing = computed(
    () => drawTool.activeTool && !['clear', 'undo'].includes(drawTool.activeTool),
  )

  watch(
    chartId,
    (id) => {
      drawTool.shapes = loadShapes(id)
    },
    { immediate: true },
  )

  watch(
    () => drawTool.shapes,
    (value) => {
      saveShapes(chartId.value, value)
    },
    { deep: true },
  )

  return { drawTool, isDrawing }
}
