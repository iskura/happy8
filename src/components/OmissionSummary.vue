<script setup>
import { formatBall } from '../utils/format.js'

defineProps({
  data: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="summary-wrap">
    <p class="summary-desc">统计 {{ data.periodCount }} 期内各号码出现次数与遗漏情况</p>
    <div class="summary-scroll">
      <table class="summary-table">
        <thead>
          <tr>
            <th>号码</th>
            <th>出现次数</th>
            <th>当前遗漏</th>
            <th>平均遗漏</th>
            <th>最大遗漏</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in data.items" :key="item.num">
            <td><span class="num-ball">{{ formatBall(item.num) }}</span></td>
            <td>{{ item.appearCount }}</td>
            <td :class="{ hot: item.currentOmission >= 10 }">{{ item.currentOmission }}</td>
            <td>{{ item.avgOmission }}</td>
            <td>{{ item.maxOmission }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.summary-desc {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--text-dim);
}

.summary-scroll {
  overflow: auto;
  max-height: 70vh;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.summary-table th,
.summary-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  text-align: center;
}

.summary-table th {
  background: var(--color-surface-alt);
  color: var(--text-dim);
  font-size: var(--font-size-small);
  position: sticky;
  top: 0;
}

.summary-table tbody tr:hover {
  background: var(--color-surface-alt);
}

.num-ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  border-radius: var(--radius-circle);
  background: var(--primary-bg);
  color: var(--primary);
  font-weight: 700;
  font-size: var(--font-size-small);
}

.hot {
  color: var(--danger);
  font-weight: 700;
}
</style>
