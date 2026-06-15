import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { formatBall, copyText } from '../../utils/format.js'
import { notifyError, notifySuccess } from '../../utils/uiMessage.js'
import {
  createPredictionRow,
  loadPredictionRows,
  loadActivePredictionRowId,
  savePredictionRows,
  PREDICTION_UPDATE_EVENT,
} from '../../utils/predictionStorage.js'

export function usePredictionRows(chartId) {
  const predictionRows = ref([createPredictionRow()])
  const activeRowId = ref('')
  const copiedKey = ref('')
  const mergeSelectedRowIds = ref([])

  const showMergeDialog = computed(
    () => mergeSelectedRowIds.value.length >= 2,
  )

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

  function rowsSignature(rows) {
    return JSON.stringify(rows.map((row) => ({ id: row.id, numbers: row.numbers })))
  }

  function handlePredictionUpdate(event) {
    const id = chartId.value
    if (!id) return
    if (event.detail?.chartId && event.detail.chartId !== id) return

    const saved = loadPredictionRows(id)
    const nextRows = saved?.length ? saved : [createPredictionRow()]
    const savedActive = loadActivePredictionRowId(id)
    const hasActive = nextRows.some((row) => row.id === savedActive)
    const nextActive = hasActive ? savedActive : nextRows[0]?.id || ''

    if (
      rowsSignature(predictionRows.value) === rowsSignature(nextRows) &&
      activeRowId.value === nextActive
    ) {
      return
    }

    predictionRows.value = nextRows
    activeRowId.value = nextActive
  }

  onMounted(() => {
    window.addEventListener(PREDICTION_UPDATE_EVENT, handlePredictionUpdate)
  })

  onBeforeUnmount(() => {
    window.removeEventListener(PREDICTION_UPDATE_EVENT, handlePredictionUpdate)
  })

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
      clearMergeSelection()
      return
    }
    predictionRows.value = predictionRows.value.filter((_, index) => index !== rowIndex)
    mergeSelectedRowIds.value = mergeSelectedRowIds.value.filter((id) => id !== removed.id)
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
    if (!ok) {
      notifyError('复制失败')
      return
    }
    flashCopied(rowId)
    notifySuccess(nums.length ? `已复制 ${nums.length} 个号码` : '复制成功')
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

  function clearMergeSelection() {
    mergeSelectedRowIds.value = []
  }

  function isMergeRowSelected(rowId) {
    return mergeSelectedRowIds.value.includes(rowId)
  }

  function toggleMergeRowSelect(rowId) {
    if (isMergeRowSelected(rowId)) {
      mergeSelectedRowIds.value = mergeSelectedRowIds.value.filter((id) => id !== rowId)
      return
    }
    mergeSelectedRowIds.value = [...mergeSelectedRowIds.value, rowId]
  }

  function collectUnionNumbers(rowIds) {
    const union = new Set()
    for (const id of rowIds) {
      const row = predictionRows.value.find((item) => item.id === id)
      for (const num of row?.numbers || []) union.add(num)
    }
    return [...union].sort((a, b) => a - b)
  }

  function mergeSelectedRows(consumeSources = false) {
    const ids = [...mergeSelectedRowIds.value]
    if (ids.length < 2) return

    const numbers = collectUnionNumbers(ids)
    const newRow = createPredictionRow(numbers)
    let next = [...predictionRows.value, newRow]

    if (consumeSources) {
      const idSet = new Set(ids)
      next = next.filter((row) => row.id === newRow.id || !idSet.has(row.id))
    }

    if (!next.length) next = [newRow]

    predictionRows.value = next
    activeRowId.value = newRow.id
    clearMergeSelection()

    if (consumeSources) {
      notifySuccess(`已删除合并 ${ids.length} 行，生成新预测行（${numbers.length} 个号码）`)
    } else {
      notifySuccess(`已合并 ${ids.length} 行，生成新预测行（${numbers.length} 个号码）`)
    }
  }

  function mergeRowsKeepSources() {
    mergeSelectedRows(false)
  }

  function mergeRowsAndDeleteSources() {
    mergeSelectedRows(true)
  }

  function cancelMergeSelection() {
    clearMergeSelection()
  }

  return {
    predictionRows,
    activeRowId,
    copiedKey,
    mergeSelectedRowIds,
    showMergeDialog,
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
  }
}
