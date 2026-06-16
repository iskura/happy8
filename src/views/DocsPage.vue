<script setup>
const plannedFeatures = [
  '选号结果一键导出 PDF / Word',
  '走势图截图与标注归档',
  '分析明细按期号生成报告',
  '自定义模板与页眉页脚',
]
</script>

<template>
  <main class="main docs-page">
    <section class="docs-placeholder">
      <div
        class="docs-placeholder__glow"
        aria-hidden="true"
      />

      <div class="docs-placeholder__hero">
        <div class="docs-placeholder__icon-wrap">
          <svg
            class="docs-placeholder__icon"
            viewBox="0 0 64 64"
            aria-hidden="true"
          >
            <rect
              x="14"
              y="8"
              width="36"
              height="46"
              rx="5"
              fill="var(--color-surface)"
              stroke="var(--link)"
              stroke-width="2"
            />
            <path
              d="M22 22h28M22 30h20M22 38h24"
              stroke="var(--text-dim)"
              stroke-width="2"
              stroke-linecap="round"
            />
            <circle
              cx="46"
              cy="46"
              r="11"
              fill="var(--link-bg)"
              stroke="var(--link)"
              stroke-width="2"
            />
            <path
              d="M41 46h10M46 41v10"
              stroke="var(--link)"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <span class="docs-placeholder__badge">开发中</span>
      </div>

      <h1 class="docs-placeholder__title">文档生成</h1>
      <p class="docs-placeholder__desc">
        正在搭建报告导出能力，完成后可在此将选号分析、走势图与明细整理成可分享的文档。
      </p>

      <ul class="docs-placeholder__list">
        <li
          v-for="item in plannedFeatures"
          :key="item"
        >
          {{ item }}
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.main.docs-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  width: 100%;
  min-height: 50vh;
}

.docs-placeholder {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(100%, 520px);
  padding: var(--spacing-3xl) var(--spacing-2xl);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.docs-placeholder__glow {
  position: absolute;
  top: 0;
  left: 50%;
  width: 120%;
  height: 200px;
  transform: translateX(-50%);
  background: radial-gradient(ellipse 60% 100% at 50% 0%, rgba(22, 119, 255, 0.14), transparent 70%);
  pointer-events: none;
}

.docs-placeholder__hero {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.docs-placeholder__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
}

.docs-placeholder__icon {
  display: block;
  width: 64px;
  height: 64px;
  filter: drop-shadow(0 8px 20px rgba(22, 119, 255, 0.15));
}

.docs-placeholder__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  background: var(--link-bg);
  border: var(--border-width) solid var(--link-border);
  color: var(--link);
  font-size: var(--font-size-hint);
  font-weight: 700;
  letter-spacing: 0.06em;
  line-height: 1.4;
}

.docs-placeholder__title {
  position: relative;
  margin: 0 0 var(--spacing-sm);
  font-size: var(--font-size-title-lg);
  font-weight: 800;
  color: var(--text);
  text-align: center;
}

.docs-placeholder__desc {
  position: relative;
  margin: 0 0 var(--spacing-xl);
  max-width: 380px;
  font-size: var(--font-size-body);
  line-height: 1.7;
  color: var(--text-soft);
  text-align: center;
}

.docs-placeholder__list {
  position: relative;
  align-self: stretch;
  margin: 0;
  padding: var(--spacing-lg) var(--spacing-xl);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
  border: var(--border-width) solid var(--border);
  list-style: none;
  text-align: left;
}

.docs-placeholder__list li {
  position: relative;
  padding-left: 18px;
  font-size: var(--font-size-small);
  line-height: 1.8;
  color: var(--text-soft);
}

.docs-placeholder__list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.72em;
  width: 6px;
  height: 6px;
  border-radius: var(--radius-circle);
  background: var(--link);
}

.docs-placeholder__list li + li {
  margin-top: var(--spacing-xs);
}
</style>
