<script setup>
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
  <button
    type="button"
    class="icon-pred-btn"
    :class="[size, { added, disabled }]"
    :disabled="disabled"
    :title="added ? '已生成' : title"
    :aria-label="added ? '已生成' : title"
    @click="$emit('click')"
  >
    <svg
      v-if="added"
      class="icon-pred-svg"
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
      class="icon-pred-svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
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
  </button>
</template>

<style scoped>
.icon-pred-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  overflow: visible;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}

.icon-pred-btn.md {
  width: 28px;
  height: 28px;
}

.icon-pred-btn.sm {
  width: 24px;
  height: 24px;
}

.icon-pred-btn .icon-pred-svg {
  display: block;
  flex-shrink: 0;
}

.icon-pred-btn.md .icon-pred-svg {
  width: 17px;
  height: 17px;
}

.icon-pred-btn.sm .icon-pred-svg {
  width: 15px;
  height: 15px;
}

.icon-pred-btn:hover:not(:disabled) {
  color: #7c3aed;
  background: #f5f3ff;
  border-color: #ddd6fe;
}

.icon-pred-btn.added {
  color: #16a34a;
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.icon-pred-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
