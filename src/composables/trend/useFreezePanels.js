import { ref, watch } from 'vue'

const FREEZE_STORAGE_KEY = 'happy8-chart-freeze'

function loadFreezeState() {
  try {
    const raw = localStorage.getItem(FREEZE_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function useFreezePanels(defaultPanels = {}) {
  const freeze = ref({
    head: true,
    pred: true,
    stats: true,
    ...defaultPanels,
    ...loadFreezeState(),
  })

  function toggleFreeze(key) {
    freeze.value[key] = !freeze.value[key]
  }

  watch(
    freeze,
    (value) => {
      try {
        localStorage.setItem(FREEZE_STORAGE_KEY, JSON.stringify(value))
      } catch {
        // ignore
      }
    },
    { deep: true },
  )

  return { freeze, toggleFreeze }
}
