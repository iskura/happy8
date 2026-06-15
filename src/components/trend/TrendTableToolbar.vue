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
  font-size: 12px;
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
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.toolbar-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-dim);
}

.toolbar-btn {
  border: 1px solid #d8dee9;
  background: #fff;
  color: var(--text-soft);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.toolbar-btn:hover {
  border-color: #1677ff;
  color: #1677ff;
}

.toolbar-btn.active {
  background: #e6f4ff;
  border-color: #1677ff;
  color: #1677ff;
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
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.legend-order-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-dim);
}

.legend-order-btn {
  border: 1px solid #d8dee9;
  background: #fff;
  color: var(--text-soft);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.legend-order-btn:hover {
  border-color: #1677ff;
  color: #1677ff;
}

.legend-order-btn.active {
  background: #e6f4ff;
  border-color: #1677ff;
  color: #1677ff;
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
  border-radius: 4px;
}

.legend-dot.hit { background: linear-gradient(135deg, #fb7185, #e11d48); }
.legend-dot.miss { background: #f1f5f9; border: 1px solid var(--border); }
.legend-dot.mark-repeat { background: #dbeafe; border: 2px solid #2563eb; }
.legend-dot.mark-edge { background: #fef9c3; border: 2px solid #ca8a04; }
.legend-dot.bose-red { background: #fecaca; }
.legend-dot.bose-blue { background: #bfdbfe; }
.legend-dot.bose-green { background: #bbf7d0; }
</style>
