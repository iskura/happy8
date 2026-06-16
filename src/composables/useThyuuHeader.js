import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const THEME_KEY = 'happy8-theme'
const AT_TOP_THRESHOLD = 24
const SCROLL_THRESHOLD = 48
const SECTION_NAV_PROGRESS = 3

export function useThyuuHeader() {
  const activeSection = ref('chart')
  const showGoTop = ref(false)
  const theme = ref('light')
  const openDialog = ref('')
  const scrollY = ref(0)
  const scrollProgress = ref(0)
  const scrollDirection = ref('up')
  const inFirstSectionZone = ref(true)
  const sectionNavOpen = ref(false)

  const isAtTop = computed(() => scrollY.value <= AT_TOP_THRESHOLD)
  const showSectionNav = computed(
    () => sectionNavOpen.value && !inFirstSectionZone.value,
  )
  const isNavHided = computed(() => showSectionNav.value)

  let ticking = false
  let lastScrollY = 0

  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || 'light'
    } catch {
      return 'light'
    }
  }

  function applyTheme(value) {
    theme.value = value
    const root = document.documentElement
    if (value === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('theme', prefersDark ? 'dark' : 'light')
    } else {
      root.setAttribute('theme', value)
    }
    try {
      localStorage.setItem(THEME_KEY, value)
    } catch {
      // ignore
    }
  }

  function syncScrollProgress() {
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
    const ratio = Math.min(Math.max(window.scrollY / maxScroll, 0), 1)
    scrollProgress.value = Math.round(ratio * 100)
  }

  function syncFirstSectionZone() {
    const chart = document.getElementById('section-chart')
    if (!chart) {
      inFirstSectionZone.value = scrollY.value < window.innerHeight
      return
    }
    const rect = chart.getBoundingClientRect()
    inFirstSectionZone.value = rect.bottom > window.innerHeight * 0.35
  }

  function syncActiveSection() {
    const sectionIds = ['section-chart', 'section-result', 'section-detail']
    const marker = window.innerHeight * 0.28
    let current = 'chart'

    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (!el) continue
      const { top } = el.getBoundingClientRect()
      if (top <= marker) {
        current = id.replace('section-', '')
      }
    }

    activeSection.value = current
  }

  function syncSectionNavOpen() {
    if (inFirstSectionZone.value) {
      sectionNavOpen.value = false
      return
    }
    if (scrollDirection.value === 'down' && scrollProgress.value >= SECTION_NAV_PROGRESS) {
      sectionNavOpen.value = true
      return
    }
    if (scrollDirection.value === 'up') {
      sectionNavOpen.value = false
    }
  }

  function syncBodyNavClasses() {
    const body = document.body
    body.classList.add('nav-style-auto')
    body.classList.toggle('nav-at-top', isAtTop.value)
    body.classList.toggle('nav-compact', !isAtTop.value)
    body.classList.toggle('nav-fixed', !isAtTop.value)
    body.classList.toggle('nav-hided', isNavHided.value)
  }

  function scrollToSection(targetId) {
    const el = document.getElementById(targetId)
    if (!el) return
    const id = targetId.replace('section-', '')
    if (id) activeSection.value = id
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    openDialog.value = ''
  }

  function toggleDialog(id) {
    openDialog.value = openDialog.value === id ? '' : id
  }

  function closeDialogs() {
    openDialog.value = ''
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function updateScrollState() {
    const currentY = window.scrollY
    if (currentY > lastScrollY) scrollDirection.value = 'down'
    else if (currentY < lastScrollY) scrollDirection.value = 'up'
    lastScrollY = currentY
    scrollY.value = currentY
    showGoTop.value = scrollY.value > SCROLL_THRESHOLD
    syncScrollProgress()
    syncFirstSectionZone()
    syncActiveSection()
    syncSectionNavOpen()
    if (openDialog.value === 'mobile-menu') {
      closeDialogs()
    }
    syncBodyNavClasses()
    ticking = false
  }

  function onScroll() {
    if (ticking) return
    ticking = true
    requestAnimationFrame(updateScrollState)
  }

  let observer = null

  function setupSectionObserver(sectionIds) {
    if (typeof IntersectionObserver === 'undefined') return

    observer = new IntersectionObserver(
      () => {
        syncActiveSection()
      },
      {
        root: null,
        rootMargin: '-20% 0px -55% 0px',
        threshold: [0, 0.15, 0.35, 0.6],
      },
    )

    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
  }

  function onKeydown(event) {
    if (event.key === 'Escape') closeDialogs()
  }

  let mediaQuery = null

  function onSystemThemeChange() {
    if (theme.value === 'auto') applyTheme('auto')
  }

  watch(openDialog, (value) => {
    const lockScroll = value === 'global-panel' || value === 'mobile-menu'
    document.body.style.overflow = lockScroll ? 'hidden' : ''
  })

  onMounted(() => {
    applyTheme(getStoredTheme())
    lastScrollY = window.scrollY
    scrollY.value = window.scrollY
    syncFirstSectionZone()
    syncActiveSection()
    syncBodyNavClasses()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', syncFirstSectionZone, { passive: true })
    window.addEventListener('keydown', onKeydown)
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', onSystemThemeChange)
    onScroll()
    setupSectionObserver(['section-chart', 'section-result', 'section-detail'])
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', syncFirstSectionZone)
    window.removeEventListener('keydown', onKeydown)
    mediaQuery?.removeEventListener('change', onSystemThemeChange)
    mediaQuery = null
    document.body.style.overflow = ''
    document.body.classList.remove('nav-style-auto', 'nav-at-top', 'nav-fixed', 'nav-compact', 'nav-hided')
    observer?.disconnect()
    observer = null
  })

  return {
    activeSection,
    showGoTop,
    theme,
    openDialog,
    scrollY,
    scrollProgress,
    isAtTop,
    isNavHided,
    showSectionNav,
    applyTheme,
    scrollToSection,
    toggleDialog,
    closeDialogs,
    scrollToTop,
  }
}
