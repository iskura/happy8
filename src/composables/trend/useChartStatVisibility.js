import { computed, ref, watch } from 'vue'
import { loadVisibleStatKeys, saveVisibleStatKeys } from '../../utils/chartStatVisibility.js'

export function useChartStatVisibility(chartId, allStatRows) {
  const visibleKeys = ref([])

  function syncFromChart() {
    const keys = (allStatRows.value || []).map((row) => row.key)
    visibleKeys.value = loadVisibleStatKeys(chartId.value, keys)
  }

  watch([chartId, allStatRows], syncFromChart, { immediate: true, deep: true })

  const visibleStatRows = computed(() => {
    const keySet = new Set(visibleKeys.value)
    return (allStatRows.value || []).filter((row) => keySet.has(row.key))
  })

  function isStatVisible(key) {
    return visibleKeys.value.includes(key)
  }

  function toggleStatVisible(key) {
    if (isStatVisible(key)) {
      if (visibleKeys.value.length <= 1) return
      visibleKeys.value = visibleKeys.value.filter((item) => item !== key)
    } else {
      visibleKeys.value = [...visibleKeys.value, key]
    }
    saveVisibleStatKeys(chartId.value, visibleKeys.value)
  }

  return {
    visibleStatRows,
    isStatVisible,
    toggleStatVisible,
  }
}
