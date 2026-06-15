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
  background: rgba(15, 23, 42, 0.28);
}

.pred-merge-dialog {
  width: min(320px, 100%);
  padding: 18px 20px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.2);
}

.pred-merge-dialog-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

.pred-merge-dialog-title strong {
  color: #ca8a04;
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
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.pred-merge-action.merge {
  background: #fef9c3;
  border-color: #facc15;
  color: #a16207;
}

.pred-merge-action.delete-merge {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #1d4ed8;
}

.pred-merge-action.cancel {
  background: #f8fafc;
  border-color: #e2e8f0;
  color: var(--text-soft);
}

.pred-merge-action:hover {
  filter: brightness(0.98);
}
</style>
