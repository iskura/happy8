<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="main about-page">
    <section class="about-card">
      <h1>规则说明</h1>
      <p>
        对每个开奖号，在之前 N 期内找到曾开出该号的期次，取其次一期开奖号中与该号跨度最小的邻号入选，再按相同跨度反向选号。
      </p>
      <p>重复入选为 A 类，仅 1 次为 B 类。</p>
      <p class="disclaimer">开奖数据仅供参考，请以官方公告为准。</p>
      <RouterLink class="about-back" to="/home">返回选号分析</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.about-page {
  max-width: 720px;
  margin-inline: auto;
  min-height: auto;
}

.about-card {
  padding: 1.5rem;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: 0 8px 32px var(--shadow-card);
}

.about-card h1 {
  margin: 0 0 1rem;
  font-size: 1.5rem;
}

.about-card p {
  margin: 0 0 0.75rem;
  line-height: 1.7;
  color: var(--text-soft);
}

.disclaimer {
  font-size: 13px;
}

.about-back {
  display: inline-flex;
  margin-top: 1.25rem;
  color: hsl(239deg 29% 54%);
  font-weight: 600;
  text-decoration: none;
}

.about-back:hover {
  text-decoration: underline;
}
</style>
