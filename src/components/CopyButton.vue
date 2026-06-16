<script setup>
import IconActionButton from './common/IconActionButton.vue'

defineProps({
  copied: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '复制',
  },
  size: {
    type: String,
    default: 'md',
  },
})

defineEmits(['click'])
</script>

<template>
  <IconActionButton
    variant="info"
    :active="copied"
    :disabled="disabled"
    :title="title"
    active-title="已复制"
    :size="size"
    @click="$emit('click')"
  >
    <template #icon>
      <svg class="icon-action-btn__svg" viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="9"
          y="9"
          width="13"
          height="13"
          rx="2"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        />
        <path
          d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </template>
    <template #active-icon>
      <svg class="icon-action-btn__svg" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M20 6 9 17l-5-5"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </template>
  </IconActionButton>
</template>
