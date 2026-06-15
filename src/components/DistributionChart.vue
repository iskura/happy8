<script setup>
/**
 * @deprecated 请使用 TrendTable.vue；保留此文件以兼容旧引用
 */
import TrendTable from './trend/TrendTable.vue'

defineProps({
  chart: { type: Object, required: true },
  marks: { type: Object, default: () => ({}) },
  rowOrder: { type: String, default: 'asc' },
})

defineEmits(['update:rowOrder'])
</script>

<template>
  <TrendTable :chart="chart" :marks="marks" :row-order="rowOrder" @update:row-order="$emit('update:rowOrder', $event)" />
</template>
