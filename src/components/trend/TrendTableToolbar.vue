<script setup>
defineProps({
  legend: { type: Array, default: () => [] },
  freeze: { type: Object, required: true },
  rowOrder: { type: String, default: 'asc' },
})

const emit = defineEmits(['toggle-freeze', 'update:rowOrder'])

function setRowOrder(order) {
  emit('update:rowOrder', order)
}
</script>

<template>
  <div class="distribution-toolbar">
    <div class="legend-items">
      <span
        v-for="item in legend"
        :key="item.key"
        class="legend-item"
      >
        <i class="legend-dot" :class="item.dotClass" />{{ item.label }}
      </span>
    </div>
    <div class="toolbar-right">
      <div class="legend-freeze">
        <span class="toolbar-label">冻结</span>
        <button
          type="button"
          class="toolbar-btn"
          :class="{ active: freeze.head }"
          title="滚动时固定顶部列头"
          @click="emit('toggle-freeze', 'head')"
        >
          列头
        </button>
        <button
          type="button"
          class="toolbar-btn"
          :class="{ active: freeze.pred }"
          title="滚动时固定预测区"
          @click="emit('toggle-freeze', 'pred')"
        >
          预测区
        </button>
        <button
          type="button"
          class="toolbar-btn"
          :class="{ active: freeze.stats }"
          title="滚动时固定底部统计"
          @click="emit('toggle-freeze', 'stats')"
        >
          统计
        </button>
      </div>
      <div class="legend-order">
        <span class="legend-order-label">排序</span>
        <button
          type="button"
          class="legend-order-btn"
          :class="{ active: rowOrder === 'asc' }"
          @click="setRowOrder('asc')"
        >
          正序
        </button>
        <button
          type="button"
          class="legend-order-btn"
          :class="{ active: rowOrder === 'desc' }"
          @click="setRowOrder('desc')"
        >
          反序
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.distribution-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  font-size: var(--font-size-small);
  color: var(--text-dim);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
}

.legend-freeze {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 4px 8px;
  background: var(--color-surface-alt);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.toolbar-label {
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--text-dim);
}

.toolbar-btn {
  border: 1px solid var(--border-input);
  background: var(--color-surface);
  color: var(--text-soft);
  padding: 4px 8px;
  border-radius: var(--radius-xs);
  font-size: var(--font-size-small);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.toolbar-btn:hover {
  border-color: var(--link);
  color: var(--link);
}

.toolbar-btn.active {
  background: var(--link-bg-active);
  border-color: var(--link);
  color: var(--link);
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.legend-order {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 4px 8px;
  background: var(--color-surface-alt);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.legend-order-label {
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--text-dim);
}

.legend-order-btn {
  border: 1px solid var(--border-input);
  background: var(--color-surface);
  color: var(--text-soft);
  padding: 4px 10px;
  border-radius: var(--radius-xs);
  font-size: var(--font-size-small);
  font-weight: 600;
  cursor: pointer;
}

.legend-order-btn:hover {
  border-color: var(--link);
  color: var(--link);
}

.legend-order-btn.active {
  background: var(--link-bg-active);
  border-color: var(--link);
  color: var(--link);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: var(--radius-xs);
}

.legend-dot.hit { background: linear-gradient(135deg, var(--chart-legend-pink-from), var(--primary)); }
.legend-dot.miss { background: var(--color-surface-muted); border: 1px solid var(--border); }
.legend-dot.mark-repeat { background: var(--ball-source-ring); border: 2px solid var(--info); }
.legend-dot.mark-edge { background: var(--warning-surface); border: 2px solid var(--warning-strong); }
.legend-dot.bose-red { background: var(--chart-legend-bose-red); }
.legend-dot.bose-blue { background: var(--info-border); }
.legend-dot.bose-green { background: var(--success-border); }
</style>
