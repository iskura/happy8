<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  dismissOnBackdrop: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'secondary', 'subtle'].includes(v),
  },
  shake: {
    type: Boolean,
    default: false,
  },
  compact: {
    type: Boolean,
    default: false,
  },
  ariaLabelledby: {
    type: String,
    default: '',
  },
})

defineEmits(['dismiss'])
</script>

<template>
  <div
    v-if="show"
    class="modal-backdrop"
    :class="{
      'modal-backdrop--secondary': variant === 'secondary',
      'modal-backdrop--subtle': variant === 'subtle',
    }"
    @click.self="dismissOnBackdrop && $emit('dismiss')"
  >
    <div
      class="modal-dialog"
      :class="{ 'modal-dialog--compact': compact, 'modal-shake': shake }"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="ariaLabelledby || undefined"
    >
      <slot />
    </div>
  </div>
</template>
