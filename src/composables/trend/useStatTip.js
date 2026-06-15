import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

export function useStatTip() {
  const statTip = ref(null)
  const statTipRef = ref(null)

  function showStatTip(event, stat) {
    const rect = event.currentTarget.getBoundingClientRect()
    const anchorX = rect.left + rect.width / 2
    const text = Array.isArray(stat.help) ? stat.help.join('\n') : stat.help
    statTip.value = {
      key: stat.key,
      text,
      anchorX,
      x: anchorX,
      y: rect.top,
      anchorBottom: rect.bottom,
      placement: 'top',
      arrowOffset: 0,
    }
    nextTick(adjustStatTipPosition)
  }

  function adjustStatTipPosition() {
    const el = statTipRef.value
    if (!el || !statTip.value) return

    const margin = 10
    const gap = 8
    const vw = window.innerWidth
    const vh = window.innerHeight
    const tipRect = el.getBoundingClientRect()

    const anchorX = statTip.value.anchorX
    let { x, y, anchorBottom } = statTip.value
    let placement = 'top'

    const halfW = tipRect.width / 2
    if (x - halfW < margin) x = margin + halfW
    if (x + halfW > vw - margin) x = vw - margin - halfW

    const spaceAbove = y - margin
    const spaceBelow = vh - anchorBottom - margin
    const needH = tipRect.height + gap

    if (spaceAbove < needH && spaceBelow >= needH) {
      placement = 'bottom'
      y = anchorBottom
    } else if (spaceAbove < needH && spaceBelow < needH) {
      placement = 'top'
      y = Math.max(margin + needH, y)
    }

    const maxArrowOffset = Math.max(0, halfW - 10)
    const arrowOffset = Math.max(
      -maxArrowOffset,
      Math.min(maxArrowOffset, anchorX - x),
    )

    statTip.value = { ...statTip.value, x, y, placement, arrowOffset }
  }

  function hideStatTip() {
    statTip.value = null
  }

  onMounted(() => {
    window.addEventListener('resize', hideStatTip)
    window.addEventListener('scroll', hideStatTip, true)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', hideStatTip)
    window.removeEventListener('scroll', hideStatTip, true)
  })

  return {
    statTip,
    statTipRef,
    showStatTip,
    hideStatTip,
  }
}
