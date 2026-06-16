<script setup>
defineProps({
  count: {
    type: Number,
    default: 0,
  },
})

defineEmits(['merge', 'delete-merge', 'cancel'])
</script>

<template>
  <Teleport to="body">
    <div class="pred-merge-dialog-overlay" @click.self="$emit('cancel')">
      <div class="pred-merge-dialog" role="dialog" aria-label="预测区合集操作">
        <p class="pred-merge-dialog-title">
          已选择 <strong>{{ count }}</strong> 行预测区
        </p>
        <p class="pred-merge-dialog-desc">请选择合集操作</p>
        <div class="pred-merge-dialog-actions">
          <button type="button" class="pred-merge-action merge" @click="$emit('merge')">
            合并
          </button>
          <button
            type="button"
            class="pred-merge-action delete-merge"
            @click="$emit('delete-merge')"
          >
            删除合并
          </button>
          <button type="button" class="pred-merge-action cancel" @click="$emit('cancel')">
            取消
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.pred-merge-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 10020;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--color-overlay-subtle);
}

.pred-merge-dialog {
  width: min(320px, 100%);
  padding: 18px 20px;
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: 0 16px 40px var(--shadow-modal-sm);
}

.pred-merge-dialog-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

.pred-merge-dialog-title strong {
  color: var(--warning-strong);
}

.pred-merge-dialog-desc {
  margin: 0 0 14px;
  font-size: 13px;
  color: var(--text-soft);
}

.pred-merge-dialog-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pred-merge-action {
  flex: 1;
  min-width: 88px;
  padding: 8px 12px;
  border-radius: var(--radius-xs);
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.pred-merge-action.merge {
  background: var(--warning-surface);
  border-color: var(--warning-surface-border);
  color: var(--warning-text);
}

.pred-merge-action.delete-merge {
  background: var(--info-bg);
  border-color: var(--info-border-light);
  color: var(--info-text);
}

.pred-merge-action.cancel {
  background: var(--color-surface-alt);
  border-color: var(--border);
  color: var(--text-soft);
}

.pred-merge-action:hover {
  filter: brightness(0.98);
}
</style>
