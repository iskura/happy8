<script setup>
import { computed, inject } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppGlobalModals from '../components/AppGlobalModals.vue'

const route = useRoute()
const pageMeta = inject('pageMeta', null)

const headerMeta = computed(() => ({
  dataUpdatedAt: pageMeta?.value?.dataUpdatedAt ?? '',
  dataSourceLabel: pageMeta?.value?.dataSourceLabel ?? '',
  refreshScheduleLabel: pageMeta?.value?.refreshScheduleLabel ?? '',
  showPageNav: route.name === 'home',
}))
</script>

<template>
  <div
    class="app-layout has-thyuu-header"
    :class="{ 'has-page-nav': headerMeta.showPageNav }"
  >
    <AppHeader
      :data-updated-at="headerMeta.dataUpdatedAt"
      :data-source-label="headerMeta.dataSourceLabel"
      :refresh-schedule-label="headerMeta.refreshScheduleLabel"
      :show-page-nav="headerMeta.showPageNav"
    />
    <div class="app">
      <RouterView />
    </div>
    <AppGlobalModals />
  </div>
</template>
