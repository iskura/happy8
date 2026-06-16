<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useThyuuHeader } from '../composables/useThyuuHeader.js'

const props = defineProps({
  dataUpdatedAt: {
    type: String,
    default: '',
  },
  dataSourceLabel: {
    type: String,
    default: '',
  },
  refreshScheduleLabel: {
    type: String,
    default: '',
  },
  showPageNav: {
    type: Boolean,
    default: false,
  },
})

const route = useRoute()
const faviconUrl = `${import.meta.env.BASE_URL}favicon.png`
const panelSearch = ref('')

const {
  activeSection,
  scrollProgress,
  theme,
  openDialog,
  showSectionNav,
  applyTheme,
  scrollToSection,
  toggleDialog,
  closeDialogs,
  scrollToTop,
} = useThyuuHeader()

const routeMenu = [
  {
    id: 'analyze',
    label: '开始分析',
    children: [
      { id: 'home', label: '选号分析', to: '/home' },
    ],
  },
  {
    id: 'about',
    label: '关于',
    children: [
      { id: 'about-rules', label: '规则说明', to: '/about' },
    ],
  },
]

const sectionNav = [
  { id: 'chart', label: '走势图', target: 'section-chart' },
  { id: 'result', label: '选号结果', target: 'section-result' },
  { id: 'detail', label: '分析明细', target: 'section-detail' },
]

const flatRouteLinks = computed(() =>
  routeMenu.flatMap((group) => group.children.map((item) => ({ ...item, group: group.label }))),
)

function isRouteActive(to) {
  return route.path === to || route.path === `${to}/`
}

function isSectionActive(itemId) {
  return activeSection.value === itemId
}

function goSection(target) {
  scrollToSection(target)
  closeDialogs()
}

function onPanelSearch() {
  const keyword = panelSearch.value.trim()
  if (!keyword) return
  const matched = sectionNav.find((item) => item.label.includes(keyword))
  if (matched) goSection(matched.target)
}

const sectionNavRef = ref(null)
const sectionBtnRefs = ref({})
const sectionNavThumb = ref({
  width: '0px',
  transform: 'translateX(0px)',
})

function setSectionBtnRef(id, el) {
  if (el) sectionBtnRefs.value[id] = el
}

function updateSectionNavThumb() {
  const nav = sectionNavRef.value
  const btn = sectionBtnRefs.value[activeSection.value]
  if (!nav || !btn) return

  sectionNavThumb.value = {
    width: `${btn.offsetWidth}px`,
    transform: `translateX(${btn.offsetLeft}px)`,
  }
}

watch(activeSection, () => nextTick(updateSectionNavThumb))
watch(showSectionNav, (visible) => {
  if (visible) nextTick(updateSectionNavThumb)
})

onMounted(() => {
  nextTick(updateSectionNavThumb)
  window.addEventListener('resize', updateSectionNavThumb, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateSectionNavThumb)
})
</script>

<template>
  <header id="global-heads" class="thyuu-header-area header-area" role="banner">
    <div class="thyuu-site-logo site-logo">
      <RouterLink class="logo" to="/home">
        <img :src="faviconUrl" alt="" />
        <footer>快乐8选号<br>Analysis</footer>
      </RouterLink>
    </div>

    <div class="thyuu-site-menu site-menu header-menu">
      <nav id="primary-menu" class="thyuu-menu-out menu-out" aria-label="站点菜单">
        <ul class="menu">
          <li
            v-for="group in routeMenu"
            :key="group.id"
            class="has-children"
            :class="{ 'is-open': openDialog === `menu-${group.id}` }"
            @mouseleave="openDialog === `menu-${group.id}` && closeDialogs()"
          >
            <button
              type="button"
              @click="toggleDialog(`menu-${group.id}`)"
              @mouseenter="openDialog = `menu-${group.id}`"
            >
              {{ group.label }}
            </button>
            <ul class="sub-menu">
              <li v-for="item in group.children" :key="item.id">
                <RouterLink
                  :to="item.to"
                  :class="{ 'is-active': isRouteActive(item.to) }"
                  @click="closeDialogs"
                >
                  <span class="item-dot" />
                  {{ item.label }}
                </RouterLink>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </div>

    <div class="thyuu-site-icon site-icon">
      <div class="site-icon-fixed">
        <button
          type="button"
          class="thyuu-icon-btn has-tip"
          data-tip="搜索"
          @click="toggleDialog('global-panel')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2" />
            <path d="M20 20l-3.5-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>

        <div
          class="thyuu-theme-toggle themeToggle"
          :class="{ 'is-open': openDialog === 'theme' }"
          @mouseleave="openDialog === 'theme' && (openDialog = '')"
        >
          <button
            id="themeBtn"
            type="button"
            class="thyuu-icon-btn has-tip"
            data-tip="切换主题"
            aria-label="切换主题"
            @click="toggleDialog('theme')"
          />
          <div id="themeOptions" class="thyuu-theme-options">
            <button
              type="button"
              class="thyuu-theme-opt"
              :class="{ 'is-active': theme === 'auto' }"
              @click="applyTheme('auto')"
            >
              跟随系统
            </button>
            <button
              type="button"
              class="thyuu-theme-opt"
              :class="{ 'is-active': theme === 'dark' }"
              @click="applyTheme('dark')"
            >
              始终深色
            </button>
            <button
              type="button"
              class="thyuu-theme-opt"
              :class="{ 'is-active': theme === 'light' }"
              @click="applyTheme('light')"
            >
              始终浅色
            </button>
          </div>
        </div>

        <button
          type="button"
          class="thyuu-icon-btn thyuu-panel-btn global-panel-btn has-tip"
          data-tip="全站动态"
          @click="toggleDialog('global-panel')"
        >
          <i /><i /><i />
        </button>

        <button
          type="button"
          class="thyuu-iconfont go-top has-tip"
          :class="{ 'is-visible': scrollProgress > 0 }"
          data-tip="回到顶部"
          @click="scrollToTop"
        >
          <i class="num btn" aria-hidden="true" />
          <i class="num">{{ scrollProgress }}</i>
        </button>

        <button
          type="button"
          class="thyuu-icon-btn thyuu-menu-mobile-btn menu-open has-tip"
          data-tip="菜单"
          @click="toggleDialog('mobile-menu')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>
  </header>

  <div class="thyuu-menu-mobile-panel" :class="{ 'is-open': openDialog === 'mobile-menu' }">
    <ul class="menu">
      <li v-for="item in flatRouteLinks" :key="`m-${item.id}`">
        <RouterLink :to="item.to" @click="closeDialogs">
          {{ item.group }} · {{ item.label }}
        </RouterLink>
      </li>
      <template v-if="showPageNav">
        <li v-for="item in sectionNav" :key="`ms-${item.id}`">
          <button type="button" @click="goSection(item.target)">
            当前页 · {{ item.label }}
          </button>
        </li>
      </template>
    </ul>
  </div>

  <Transition name="section-nav">
    <nav
      v-if="showPageNav && showSectionNav"
      id="page-nav"
      class="happy8-switch-nav switch-nav active"
      aria-label="页内导航"
    >
      <div ref="sectionNavRef" class="switch-nav-inner">
        <span
          class="switch-nav-thumb"
          aria-hidden="true"
          :style="sectionNavThumb"
        />
        <button
          v-for="item in sectionNav"
          :key="`pn-${item.id}`"
          :ref="(el) => setSectionBtnRef(item.id, el)"
          type="button"
          class="switch-btn"
          :class="{ 'is-active': isSectionActive(item.id) }"
          @click="goSection(item.target)"
        >
          {{ item.label }}
        </button>
      </div>
    </nav>
  </Transition>

  <aside
    id="global-panel"
    class="thyuu-global-panel global-panel"
    :class="{ 'is-open': openDialog === 'global-panel' }"
    role="complementary"
  >
    <div class="thyuu-global-panel-backdrop" @click="closeDialogs" />
    <div class="thyuu-global-panel-body">
      <p class="thyuu-panel-welcome">
        欢迎来到快乐8选号分析，为您导读全站动态。
      </p>

      <form class="thyuu-panel-search" @submit.prevent="onPanelSearch">
        <input v-model="panelSearch" type="search" placeholder="搜索页面区块…" />
        <button type="submit">搜索</button>
      </form>

      <div class="thyuu-panel-section">
        <h4>站点导航</h4>
        <div class="thyuu-panel-links">
          <RouterLink
            v-for="item in flatRouteLinks"
            :key="`pr-${item.id}`"
            :to="item.to"
            @click="closeDialogs"
          >
            {{ item.label }}
          </RouterLink>
        </div>
      </div>

      <div v-if="showPageNav" class="thyuu-panel-section">
        <h4>当前页导航</h4>
        <div class="thyuu-panel-links">
          <button
            v-for="item in sectionNav"
            :key="`ps-${item.id}`"
            type="button"
            @click="goSection(item.target)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div v-if="dataUpdatedAt" class="thyuu-panel-section">
        <h4>数据状态</h4>
        <p class="thyuu-panel-meta">
          更新于 {{ dataUpdatedAt }}
          <template v-if="dataSourceLabel"> · {{ dataSourceLabel }}</template>
          <template v-if="refreshScheduleLabel"> · {{ refreshScheduleLabel }} 自动更新</template>
        </p>
      </div>
    </div>
  </aside>
</template>
