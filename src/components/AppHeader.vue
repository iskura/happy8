<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useThyuuHeader } from '../composables/useThyuuHeader.js'
import NumberRecordPanel from './NumberRecordPanel.vue'

defineProps({
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
  { id: 'home', label: '选号分析', to: '/home' },
  { id: 'report', label: '数据报表', to: '/report' },
  { id: 'docs', label: '文档生成', to: '/docs' },
]

const showSearchButton = false

const sectionNav = [
  { id: 'chart', label: '走势图', target: 'section-chart' },
  { id: 'result', label: '选号结果', target: 'section-result' },
  { id: 'detail', label: '分析明细', target: 'section-detail' },
]

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
  <header
    id="global-heads"
    class="thyuu-header-area header-area"
    role="banner"
  >
    <div class="thyuu-site-logo site-logo">
      <RouterLink
        class="logo"
        to="/home"
      >
        <img
          :src="faviconUrl"
          alt=""
        />
        <footer>快乐8选号<br>Analysis</footer>
      </RouterLink>
    </div>

    <div class="thyuu-site-menu site-menu header-menu">
      <nav
        id="primary-menu"
        class="thyuu-menu-out menu-out"
        aria-label="站点菜单"
      >
        <ul class="menu">
          <li
            v-for="item in routeMenu"
            :key="item.id"
          >
            <RouterLink
              :to="item.to"
              :class="{ 'is-active': isRouteActive(item.to) }"
              @click="closeDialogs"
            >
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>
    </div>

    <div class="thyuu-site-icon site-icon">
      <div class="site-icon-fixed">
        <button
          v-if="showSearchButton"
          type="button"
          class="thyuu-icon-btn has-tip"
          data-tip="搜索"
          @click="toggleDialog('global-panel')"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            />
            <path
              d="M20 20l-3.5-3.5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
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
          <div
            id="themeOptions"
            class="thyuu-theme-options"
          >
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
          data-tip="号码记录"
          @click="toggleDialog('global-panel')"
        >
          <i /><i /><i />
        </button>

        <button
          type="button"
          class="thyuu-iconfont go-top has-tip is-visible"
          data-tip="回到顶部"
          @click="scrollToTop"
        >
          <i
            class="num go-top-arrow"
            aria-hidden="true"
          />
          <i class="num"><span class="circle-digit-inner">{{ scrollProgress }}</span></i>
        </button>

        <button
          type="button"
          class="thyuu-icon-btn thyuu-menu-mobile-btn menu-open has-tip"
          data-tip="菜单"
          @click="toggleDialog('mobile-menu')"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M4 7h16M4 12h16M4 17h16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  </header>

  <div
    class="thyuu-menu-mobile-panel"
    :class="{ 'is-open': openDialog === 'mobile-menu' }"
  >
    <ul class="menu">
      <li
        v-for="item in routeMenu"
        :key="`m-${item.id}`"
      >
        <RouterLink
          :to="item.to"
          :class="{ 'is-active': isRouteActive(item.to) }"
          @click="closeDialogs"
        >
          {{ item.label }}
        </RouterLink>
      </li>
      <template v-if="showPageNav">
        <li
          v-for="item in sectionNav"
          :key="`ms-${item.id}`"
        >
          <button
            type="button"
            @click="goSection(item.target)"
          >
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
      <div
        ref="sectionNavRef"
        class="switch-nav-inner"
      >
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

  <NumberRecordPanel
    :open="openDialog === 'global-panel'"
    @close="closeDialogs"
  />
</template>
