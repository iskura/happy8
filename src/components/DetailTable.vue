<script setup>
import { formatBall } from '../utils/format.js'

defineProps({
  steps: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <section class="panel detail-panel">
    <header class="panel-header">
      <div>
        <h2>分析明细</h2>
        <p class="panel-desc">每个源号码在历史命中后，下一期的邻号与反向选号过程</p>
      </div>
      <span class="panel-count">共 {{ steps.length }} 条记录</span>
    </header>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>源号码</th>
            <th>命中期号</th>
            <th>下一期</th>
            <th>最近邻号</th>
            <th>跨度</th>
            <th>反向号码</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(step, index) in steps" :key="`${step.sourceNumber}-${step.hitPeriod}-${index}`">
            <td><span class="ball ball-source">{{ formatBall(step.sourceNumber) }}</span></td>
            <td>{{ step.hitPeriod }}</td>
            <td>{{ step.nextPeriod }}</td>
            <td><span class="ball ball-adjacent">{{ formatBall(step.adjacent) }}</span></td>
            <td class="span-cell">{{ step.span }}</td>
            <td><span class="ball ball-reverse">{{ formatBall(step.reverse) }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
