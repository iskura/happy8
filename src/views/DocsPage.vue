<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { loadLotteryDataLocalFirst } from '../api/lottery.js'
import CopyButton from '../components/CopyButton.vue'
import IssueSelect from '../components/IssueSelect.vue'
import LookbackSelect from '../components/LookbackSelect.vue'
import { buildAnalysisDocument, buildSectionPlainText } from '../utils/buildAnalysisDocument.js'
import { copyText } from '../utils/format.js'
import { notifyError, notifySuccess } from '../utils/uiMessage.js'

const loading = ref(true)
const error = ref('')
const records = ref([])
const selectedIssue = ref('')
const lookback = ref(9)
const copiedSectionId = ref('')

function getMaxLookback(issue = selectedIssue.value) {
  if (!records.value.length) return 0
  const index = issue
    ? records.value.findIndex((record) => record.issue === issue)
    : 0
  if (index < 0) return 0
  return records.value.length - index - 1
}

const documentData = computed(() => {
  if (!records.value.length) return null
  return buildAnalysisDocument(records.value, {
    issue: selectedIssue.value,
    lookback: lookback.value,
  })
})

const sections = computed(() => documentData.value?.sections ?? [])
const plainText = computed(() => documentData.value?.plainText ?? '')

watch(selectedIssue, () => {
  const max = getMaxLookback()
  if (max > 0 && lookback.value > max) lookback.value = max
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const data = await loadLotteryDataLocalFirst()
    records.value = data.records
    selectedIssue.value = data.records[0]?.issue || ''
  } catch (err) {
    error.value = err.message || '加载失败'
    records.value = []
  } finally {
    loading.value = false
  }
}

async function copySection(section) {
  const ok = await copyText(buildSectionPlainText(section))
  if (!ok) {
    notifyError('复制失败，请手动选中复制')
    return
  }
  copiedSectionId.value = section.id
  notifySuccess(`已复制「${section.title}」`)
  window.setTimeout(() => {
    if (copiedSectionId.value === section.id) copiedSectionId.value = ''
  }, 1600)
}

async function copyAll() {
  if (!plainText.value) return
  const ok = await copyText(plainText.value)
  if (!ok) {
    notifyError('复制失败，请手动选中复制')
    return
  }
  notifySuccess('已复制')
}

onMounted(loadData)
</script>

<template>
  <main class="main docs-page">
    <header class="docs-toolbar panel">
      <div class="docs-toolbar__intro">
        <h1 class="docs-toolbar__title">文档生成</h1>
        <p class="docs-toolbar__desc">
          根据当前开奖数据自动生成分析报告，可在线阅读、手动选中或一键复制。
        </p>
      </div>

      <div
        v-if="!loading && !error"
        class="docs-toolbar__controls"
      >
        <IssueSelect
          v-model="selectedIssue"
          :records="records"
        />
        <LookbackSelect
          v-model="lookback"
          :max="Math.max(getMaxLookback(), 1)"
          inline
        />
        <button
          type="button"
          class="btn docs-toolbar__copy"
          :disabled="!plainText"
          @click="copyAll"
        >
          复制
        </button>
      </div>
    </header>

    <div
      v-if="loading"
      class="state-card docs-state"
    >
      <div class="spinner" />
      <span>正在加载数据并生成文档…</span>
    </div>

    <div
      v-else-if="error"
      class="state-card error-card docs-state"
    >
      <p>{{ error }}</p>
      <button
        class="btn"
        type="button"
        @click="loadData"
      >
        重试
      </button>
    </div>

    <article
      v-else
      class="docs-document panel"
    >
      <pre class="docs-document__paper">{{ plainText }}</pre>

      <div class="docs-document__sections">
        <section
          v-for="section in sections"
          :id="section.id"
          :key="section.id"
          class="docs-section"
        >
          <div class="docs-section__head">
            <h2 class="docs-section__title">{{ section.title }}</h2>
            <CopyButton
              :copied="copiedSectionId === section.id"
              :title="`复制「${section.title}」`"
              size="sm"
              @click="copySection(section)"
            />
          </div>
          <ul class="docs-section__list">
            <li
              v-for="(line, index) in section.lines"
              :key="index"
            >
              {{ line }}
            </li>
          </ul>
        </section>
      </div>
    </article>
  </main>
</template>

<style scoped>
.main.docs-page {
  display: flex;
  flex-direction: column;
  gap: var(--gap-section);
  width: 100%;
  padding-bottom: var(--spacing-3xl);
}

.docs-toolbar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.docs-toolbar__title {
  margin: 0 0 var(--spacing-xs);
  font-size: var(--font-size-title-lg);
  font-weight: 800;
  color: var(--text);
}

.docs-toolbar__desc {
  margin: 0;
  font-size: var(--font-size-body);
  line-height: 1.6;
  color: var(--text-soft);
}

.docs-toolbar__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--spacing-md);
}

.docs-toolbar__copy {
  margin-left: auto;
  padding: 10px 18px;
  font-size: var(--font-size-small);
}

.docs-state {
  min-height: 200px;
}

.docs-document {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.docs-document__paper {
  margin: 0;
  padding: var(--spacing-xl);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
  border: var(--border-width) solid var(--border);
  font-family: inherit;
  font-size: var(--font-size-body);
  line-height: 1.6;
  color: var(--text-soft);
  white-space: pre-wrap;
  word-break: break-word;
  user-select: text;
}

.docs-document__sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.docs-section {
  padding: var(--spacing-lg) var(--spacing-xl);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-md);
  background: var(--card);
}

.docs-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.docs-section__title {
  margin: 0;
  font-size: var(--font-size-body);
  line-height: 1.6;
  color: var(--text-soft);
}

.docs-section__list {
  margin: 0;
  padding: 0;
  list-style: none;
  user-select: text;
}

.docs-section__list li {
  padding: 6px 0;
  font-size: var(--font-size-body);
  line-height: 1.6;
  color: var(--text-soft);
  border-bottom: 1px dashed var(--border);
}

.docs-section__list li:last-child {
  border-bottom: none;
}

@media (max-width: 640px) {
  .docs-toolbar__copy {
    margin-left: 0;
    width: 100%;
  }
}
</style>
