const STORAGE_KEY = 'happy8-prediction-rows'
const C_CLASS_ROW_KEY = 'happy8-c-class-row-index'
export const PREDICTION_UPDATE_EVENT = 'happy8-prediction-update'
export const PREDICTION_CHART_ID = 'hmfb'

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // 存储失败时静默忽略
  }
}

function notifyPredictionUpdate(chartId) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(PREDICTION_UPDATE_EVENT, { detail: { chartId } }))
}

export function createPredictionRow(numbers = [], id = null) {
  return {
    id: id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    numbers: [...numbers],
  }
}

export function loadPredictionRows(chartId) {
  if (!chartId) return null
  const store = readStore()
  const rows = store[chartId]
  if (!Array.isArray(rows) || !rows.length) return null
  return rows.map((row) => createPredictionRow(row.numbers || [], row.id))
}

export function savePredictionRows(chartId, rows, activeRowId = '') {
  if (!chartId) return
  const store = readStore()
  store[chartId] = rows.map((row) => ({
    id: row.id,
    numbers: [...(row.numbers || [])],
  }))
  store[`${chartId}__active`] = activeRowId || ''
  writeStore(store)
  notifyPredictionUpdate(chartId)
}

export function appendPredictionRow(chartId, numbers = []) {
  if (!chartId) return null

  const existing = loadPredictionRows(chartId) || [createPredictionRow()]
  const newRow = createPredictionRow([...numbers].sort((a, b) => a - b))
  const rows = [...existing, newRow]
  savePredictionRows(chartId, rows, newRow.id)
  return { row: newRow, index: rows.length }
}

export function loadCClassRowIndex() {
  try {
    const value = Number.parseInt(localStorage.getItem(C_CLASS_ROW_KEY) || '1', 10)
    return Number.isFinite(value) && value > 0 ? value : 1
  } catch {
    return 1
  }
}

export function saveCClassRowIndex(index) {
  try {
    localStorage.setItem(C_CLASS_ROW_KEY, String(index))
  } catch {
    // 存储失败时静默忽略
  }
}

export function loadActivePredictionRowId(chartId) {
  if (!chartId) return ''
  const store = readStore()
  return store[`${chartId}__active`] || ''
}
