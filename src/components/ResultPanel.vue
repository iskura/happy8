<script setup>
import { formatBall } from '../utils/format.js'

defineProps({
  result: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <section class="panel result-panel">
    <header class="panel-header">
      <div>
        <h2>选号结果</h2>
        <p class="panel-desc">
          基于第 <strong>{{ result.current.issue }}</strong> 期（{{ result.current.date }}）开奖号，
          往前追溯 <strong>{{ result.lookback }}</strong> 期分析
        </p>
      </div>
    </header>

    <div class="result-stats">
      <div class="stat-card stat-total">
        <div class="stat-label">候选总数</div>
        <div class="stat-value">{{ result.totalPicks }}</div>
      </div>
      <div class="stat-card stat-a">
        <div class="stat-label">A 类 · 重复选中</div>
        <div class="stat-value">{{ result.classA.length }}</div>
      </div>
      <div class="stat-card stat-b">
        <div class="stat-label">B 类 · 仅选 1 次</div>
        <div class="stat-value">{{ result.classB.length }}</div>
      </div>
    </div>

    <div class="current-draw">
      <span class="label">当期开奖号</span>
      <div class="ball-row">
        <span v-for="num in result.current.numbers" :key="num" class="ball ball-draw">
          {{ formatBall(num) }}
        </span>
      </div>
    </div>

    <div class="class-grid">
      <article class="class-card class-a">
        <div class="class-title">
          <h3>A 类号码</h3>
          <span class="badge">{{ result.classA.length }} 个</span>
        </div>
        <p class="class-tip">在分析过程中被选中 2 次及以上</p>
        <div v-if="result.classA.length" class="ball-row">
          <span
            v-for="item in result.classA"
            :key="item.num"
            class="ball-item"
            :title="`选中 ${item.count} 次`"
          >
            <span class="ball ball-a">{{ formatBall(item.num) }}</span>
            <span class="ball-count">×{{ item.count }}</span>
          </span>
        </div>
        <p v-else class="empty">暂无 A 类号码</p>
        <p v-if="result.classA.length" class="number-text">{{ result.classAFormatted.join(', ') }}</p>
      </article>

      <article class="class-card class-b">
        <div class="class-title">
          <h3>B 类号码</h3>
          <span class="badge">{{ result.classB.length }} 个</span>
        </div>
        <p class="class-tip">在分析过程中仅被选中 1 次</p>
        <div v-if="result.classB.length" class="ball-row">
          <span v-for="item in result.classB" :key="item.num" class="ball ball-b">
            {{ formatBall(item.num) }}
          </span>
        </div>
        <p v-else class="empty">暂无 B 类号码</p>
        <p v-if="result.classB.length" class="number-text">{{ result.classBFormatted.join(', ') }}</p>
      </article>
    </div>

    <div class="summary">
      共产生 <strong>{{ result.totalPicks }}</strong> 个候选号码，
      A 类 <strong>{{ result.classA.length }}</strong> 个，
      B 类 <strong>{{ result.classB.length }}</strong> 个
    </div>
  </section>
</template>
