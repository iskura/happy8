<script setup>
import IconActionButton from './common/IconActionButton.vue'

defineProps({
  added: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '生成预测行',
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
    variant="purple"
    mode="prediction"
    :active="added"
    :disabled="disabled"
    :title="title"
    active-title="已生成"
    :size="size"
    @click="$emit('click')"
  >
    <template #icon>
      <svg class="icon-action-btn__svg" viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="5"
          y="5"
          width="14"
          height="14"
          rx="2"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        />
        <path
          d="M12 8.5v7M8.5 12h7"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
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
