<script setup>
defineProps({
  tip: {
    type: Object,
    default: null,
  },
  tipRef: {
    type: Object,
    default: null,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="tip"
      :ref="(el) => { if (tipRef) tipRef.value = el }"
      class="stat-help-popover"
      :class="{
        'stat-help-popover--compact': compact,
        'is-bottom': tip.placement === 'bottom',
      }"
      role="tooltip"
      :style="{
        left: `${tip.x}px`,
        top: `${tip.y}px`,
        '--arrow-offset': `${tip.arrowOffset}px`,
      }"
    >
      {{ tip.text }}
    </div>
  </Teleport>
</template>
