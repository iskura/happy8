import { ref, watch } from 'vue'
import { formatBall, copyText } from '../../utils/format.js'
import {
  createPredictionRow,
  loadPredictionRows,
  loadActivePredictionRowId,
  savePredictionRows,
} from '../../utils/predictionStorage.js'

export function usePredictionRows(chartId) {
  const predictionRows = ref([createPredictionRow()])
  const activeRowId = ref('')
  const copiedKey = ref('')

  function initPredictionRows(id) {
    const saved = loadPredictionRows(id)
    predictionRows.value = saved?.length ? saved : [createPredictionRow()]
    const savedActive = loadActivePredictionRowId(id)
    const hasActive = predictionRows.value.some((row) => row.id === savedActive)
    activeRowId.value = hasActive ? savedActive : predictionRows.value[0]?.id || ''
  }

  watch(
    chartId,
    (id) => {
      if (id) initPredictionRows(id)
    },
    { immediate: true },
  )

  watch(
    [predictionRows, activeRowId],
    () => {
      if (chartId.value) {
        savePredictionRows(chartId.value, predictionRows.value, activeRowId.value)
      }
    },
    { deep: true },
  )

  function selectPredictionRow(rowId) {
    activeRowId.value = rowId
  }

  function addPredictionRowBelow(rowIndex) {
    const newRow = createPredictionRow()
    const next = [...predictionRows.value]
    next.splice(rowIndex + 1, 0, newRow)
    predictionRows.value = next
    activeRowId.value = newRow.id
  }

  function removePredictionRow(rowIndex) {
    const removed = predictionRows.value[rowIndex]
    if (predictionRows.value.length <= 1) {
      const emptyRow = createPredictionRow()
      predictionRows.value = [emptyRow]
      activeRowId.value = emptyRow.id
      return
    }
    predictionRows.value = predictionRows.value.filter((_, index) => index !== rowIndex)
    if (activeRowId.value === removed.id) {
      const nextIndex = Math.min(rowIndex, predictionRows.value.length - 1)
      activeRowId.value = predictionRows.value[nextIndex]?.id || ''
    }
  }

  function isPredictionSelected(rowId, num) {
    const row = predictionRows.value.find((item) => item.id === rowId)
    return row?.numbers.includes(num)
  }

  function togglePredictionCell(rowId, num) {
    selectPredictionRow(rowId)
    const rowIndex = predictionRows.value.findIndex((item) => item.id === rowId)
    if (rowIndex < 0) return
    const numbers = [...predictionRows.value[rowIndex].numbers]
    const index = numbers.indexOf(num)
    if (index >= 0) numbers.splice(index, 1)
    else numbers.push(num)
    const next = [...predictionRows.value]
    next[rowIndex] = { ...next[rowIndex], numbers }
    predictionRows.value = next
  }

  async function copyPredictionRow(rowId) {
    const row = predictionRows.value.find((item) => item.id === rowId)
    const nums = [...(row?.numbers || [])].sort((a, b) => a - b)
    const text = nums.map((num) => formatBall(num)).join(' ')
    const ok = await copyText(text)
    if (ok) flashCopied(rowId)
  }

  function flashCopied(key) {
    copiedKey.value = key
    window.setTimeout(() => {
      if (copiedKey.value === key) copiedKey.value = ''
    }, 1500)
  }

  function isPredictionCol(num, maxColumns) {
    if (!maxColumns) return true
    return num <= maxColumns
  }

  return {
    predictionRows,
    activeRowId,
    copiedKey,
    addPredictionRowBelow,
    removePredictionRow,
    isPredictionSelected,
    togglePredictionCell,
    copyPredictionRow,
    isPredictionCol,
  }
}
