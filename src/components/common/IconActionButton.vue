<script setup>
defineProps({
  active: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  activeTitle: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['md', 'sm'].includes(v),
  },
  variant: {
    type: String,
    default: 'info',
    validator: (v) => ['info', 'purple'].includes(v),
  },
  mode: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'prediction'].includes(v),
  },
})

defineEmits(['click'])
</script>

<template>
  <button
    type="button"
    class="icon-action-btn"
    :class="[
      `icon-action-btn--${size}`,
      `icon-action-btn--${variant}`,
      { 'icon-action-btn--prediction': mode === 'prediction', 'is-active': active },
    ]"
    :disabled="disabled"
    :title="active ? activeTitle : title"
    :aria-label="active ? activeTitle : title"
    @click="$emit('click')"
  >
    <slot v-if="active" name="active-icon" />
    <slot v-else name="icon" />
  </button>
</template>
