<script setup>
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
  <button
    type="button"
    class="icon-copy-btn"
    :class="[size, { copied, disabled }]"
    :disabled="disabled"
    :title="copied ? '已复制' : title"
    :aria-label="copied ? '已复制' : title"
    @click="$emit('click')"
  >
    <svg
      v-if="copied"
      class="icon-copy-svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M20 6 9 17l-5-5"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <svg
      v-else
      class="icon-copy-svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
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
  </button>
</template>

<style scoped>
.icon-copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}

.icon-copy-btn.md {
  width: 28px;
  height: 28px;
}

.icon-copy-btn.sm {
  width: 24px;
  height: 24px;
}

.icon-copy-btn .icon-copy-svg {
  width: 15px;
  height: 15px;
}

.icon-copy-btn.sm .icon-copy-svg {
  width: 13px;
  height: 13px;
}

.icon-copy-btn:hover:not(:disabled) {
  color: #2563eb;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.icon-copy-btn.copied {
  color: #16a34a;
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.icon-copy-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
