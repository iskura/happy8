const STORAGE_KEY = 'happy8-chart-stat-visible'

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
    // ignore
  }
}

export function loadVisibleStatKeys(chartId, allKeys = []) {
  if (!chartId || !allKeys.length) return [...allKeys]

  const saved = readStore()[chartId]
  if (!Array.isArray(saved)) return [...allKeys]

  const keySet = new Set(allKeys)
  const visible = saved.filter((key) => keySet.has(key))
  return visible.length ? visible : [...allKeys]
}

export function saveVisibleStatKeys(chartId, visibleKeys = []) {
  if (!chartId) return
  const store = readStore()
  store[chartId] = [...visibleKeys]
  writeStore(store)
}
