<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { formatBall, copyText } from '../utils/format.js'
import {
  createPredictionRow,
  loadCClassRowIndex,
  loadPredictionRows,
  PREDICTION_CHART_ID,
  PREDICTION_UPDATE_EVENT,
  saveCClassRowIndex,
} from '../utils/predictionStorage.js'
import IssueSelect from './IssueSelect.vue'
import LookbackSelect from './LookbackSelect.vue'
import SearchSelect from './SearchSelect.vue'
import CopyButton from './CopyButton.vue'

const props = defineProps({
  result: {
    type: Object,
    required: true,
  },
  records: {
    type: Array,
    default: () => [],
  },
  selectedIssue: {
    type: String,
    default: '',
  },
  lookback: {
    type: Number,
    default: 9,
  },
  maxLookback: {
    type: Number,
    default: 50,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:selectedIssue',
  'update:lookback',
  'issue-change',
  'lookback-change',
])

const selectedRecord = computed(() => {
  const issue = props.selectedIssue || props.result?.current?.issue
  return props.records.find((record) => record.issue === issue) || props.result?.current || null
})

function onIssueChange(value) {
  emit('update:selectedIssue', value)
  emit('issue-change', value)
}

function onLookbackChange(value) {
  emit('update:lookback', value)
  emit('lookback-change', value)
}

const classAText = computed(() => props.result.classAFormatted.join(' '))
const classBColdText = computed(() => (props.result.classBColdFormatted || []).join(' '))

const COLD_HELP_TEXT = '冷号：选中开奖期数之前30期内，出现次数少于5次的号码'

const copiedKey = ref('')
const predictionRows = ref([createPredictionRow()])
const selectedPredIndex = ref(loadCClassRowIndex())

function reloadPredictionRows() {
  const saved = loadPredictionRows(PREDICTION_CHART_ID)
  predictionRows.value = saved?.length ? saved : [createPredictionRow()]
  if (selectedPredIndex.value > predictionRows.value.length) {
    selectedPredIndex.value = Math.max(1, predictionRows.value.length)
  }
}

function handlePredictionUpdate(event) {
  if (!event.detail?.chartId || event.detail.chartId === PREDICTION_CHART_ID) {
    reloadPredictionRows()
  }
}

onMounted(() => {
  reloadPredictionRows()
  window.addEventListener(PREDICTION_UPDATE_EVENT, handlePredictionUpdate)
})

onBeforeUnmount(() => {
  window.removeEventListener(PREDICTION_UPDATE_EVENT, handlePredictionUpdate)
})

watch(selectedPredIndex, (value) => {
  saveCClassRowIndex(value)
})

watch(
  predictionRows,
  () => {
    if (selectedPredIndex.value > predictionRows.value.length) {
      selectedPredIndex.value = Math.max(1, predictionRows.value.length)
    }
  },
  { deep: true },
)

const predictionOptions = computed(() =>
  predictionRows.value.map((row, index) => {
    const preview = row.numbers.length
      ? row.numbers.map((num) => formatBall(num)).join(' ')
      : '空'
    return {
      value: index + 1,
      label: `第 ${index + 1} 行 · ${preview}`,
    }
  }),
)

const selectedPredictionNumbers = computed(() => {
  const row = predictionRows.value[selectedPredIndex.value - 1]
  return [...(row?.numbers || [])].sort((a, b) => a - b)
})

const selectedPredictionText = computed(() =>
  selectedPredictionNumbers.value.map((num) => formatBall(num)).join(' '),
)

function getOverlap(classItems) {
  const set = new Set(classItems.map((item) => item.num))
  return selectedPredictionNumbers.value.filter((num) => set.has(num))
}

function getNonOverlap(classItems) {
  const set = new Set(classItems.map((item) => item.num))
  return selectedPredictionNumbers.value.filter((num) => !set.has(num))
}

const overlapA = computed(() => getOverlap(props.result.classA))
const overlapB = computed(() => getOverlap(props.result.classB))
const nonOverlapA = computed(() => getNonOverlap(props.result.classA))
const nonOverlapB = computed(() => getNonOverlap(props.result.classB))

const overlapAText = computed(() => overlapA.value.map((num) => formatBall(num)).join(' '))
const overlapBText = computed(() => overlapB.value.map((num) => formatBall(num)).join(' '))
const nonOverlapAText = computed(() => nonOverlapA.value.map((num) => formatBall(num)).join(' '))
const nonOverlapBText = computed(() => nonOverlapB.value.map((num) => formatBall(num)).join(' '))

async function copyNumbers(key, text) {
  const ok = await copyText(text)
  if (!ok) return
  copiedKey.value = key
  window.setTimeout(() => {
    if (copiedKey.value === key) copiedKey.value = ''
  }, 1500)
}
</script>

<template>
  <section class="panel result-panel">
    <header class="panel-header">
      <div class="panel-heading">
        <h2>选号结果</h2>
        <p class="panel-desc">
          基于第
          <IssueSelect
            embedded
            :model-value="selectedIssue"
            :records="records"
            :disabled="disabled"
            @update:model-value="onIssueChange"
          />
          期（<strong>{{ selectedRecord?.date || '—' }}</strong>）开奖号，往前追溯
          <LookbackSelect
            embedded
            :model-value="lookback"
            :max="maxLookback"
            option-suffix=""
            placeholder="期数"
            :disabled="disabled"
            @update:model-value="onLookbackChange"
          />
          期分析
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
      <div class="stat-card stat-c">
        <div class="stat-label">C 类 · 预测对比</div>
        <div class="stat-value">{{ overlapA.length + overlapB.length }}</div>
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
          <div class="class-title-meta">
            <CopyButton
              v-if="result.classA.length"
              :copied="copiedKey === 'a'"
              title="复制 A 类号码"
              @click="copyNumbers('a', classAText)"
            />
            <span class="badge">{{ result.classA.length }} 个</span>
          </div>
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
      </article>

      <article class="class-card class-b">
        <div class="class-title">
          <div class="class-title-left">
            <h3>B 类号码</h3>
            <span class="help-wrap">
              <button
                type="button"
                class="help-btn"
                aria-label="冷号说明"
              >
                ?
              </button>
              <span class="help-tip" role="tooltip">{{ COLD_HELP_TEXT }}</span>
            </span>
          </div>
          <div class="class-title-meta">
            <CopyButton
              v-if="result.classBCold?.length"
              :copied="copiedKey === 'b-cold'"
              title="复制 B 类冷号"
              @click="copyNumbers('b-cold', classBColdText)"
            />
            <span class="badge">{{ result.classBCold?.length || 0 }} 个冷号</span>
          </div>
        </div>
        <p class="class-tip">在分析过程中仅被选中 1 次；冷号为基准期前 30 期内出现少于 5 次的号码</p>
        <div v-if="result.classB.length" class="ball-row">
          <span v-for="item in result.classB" :key="item.num" class="ball ball-b">
            {{ formatBall(item.num) }}
          </span>
        </div>
        <p v-else class="empty">暂无 B 类号码</p>
      </article>

      <article class="class-card class-c">
        <div class="class-title">
          <h3>C 类对比</h3>
          <div class="class-title-meta">
            <CopyButton
              v-if="selectedPredictionNumbers.length"
              :copied="copiedKey === 'c-pred'"
              title="复制预测号码"
              @click="copyNumbers('c-pred', selectedPredictionText)"
            />
            <span class="badge">预测区 vs A/B</span>
          </div>
        </div>
        <div class="class-c-select">
          <span class="class-c-label">选择预测行</span>
          <SearchSelect
            v-model="selectedPredIndex"
            class="class-c-picker"
            placeholder="选择预测区第几行"
            search-placeholder="搜索行号或号码..."
            :options="predictionOptions"
            :disabled="disabled || !predictionOptions.length"
          />
        </div>
        <p class="class-tip">对比所选预测行与 A/B 类的重复号码</p>

        <div v-if="selectedPredictionNumbers.length" class="ball-row">
          <span
            v-for="num in selectedPredictionNumbers"
            :key="`pred-${num}`"
            class="ball ball-c"
          >
            {{ formatBall(num) }}
          </span>
        </div>
        <p v-else class="empty">所选预测行暂无号码，请先在走势图预测区选号</p>

        <div class="overlap-grid">
          <div class="overlap-section">
            <div class="overlap-head">
              <h4>与 A 类重复</h4>
              <div class="overlap-head-meta">
                <CopyButton
                  v-if="overlapA.length"
                  :copied="copiedKey === 'c-a'"
                  title="复制与 A 类重复号码"
                  @click="copyNumbers('c-a', overlapAText)"
                />
                <span class="overlap-count">{{ overlapA.length }} 个</span>
              </div>
            </div>
            <div v-if="overlapA.length" class="ball-row">
              <span v-for="num in overlapA" :key="`ca-${num}`" class="ball ball-a">
                {{ formatBall(num) }}
              </span>
            </div>
            <p v-else class="empty overlap-empty">无重复号码</p>
          </div>

          <div class="overlap-section">
            <div class="overlap-head">
              <h4>与 A 类不重复</h4>
              <div class="overlap-head-meta">
                <CopyButton
                  v-if="nonOverlapA.length"
                  :copied="copiedKey === 'c-not-a'"
                  title="复制与 A 类不重复号码"
                  @click="copyNumbers('c-not-a', nonOverlapAText)"
                />
                <span class="overlap-count">{{ nonOverlapA.length }} 个</span>
              </div>
            </div>
            <div v-if="nonOverlapA.length" class="ball-row">
              <span v-for="num in nonOverlapA" :key="`cna-${num}`" class="ball ball-a">
                {{ formatBall(num) }}
              </span>
            </div>
            <p v-else class="empty overlap-empty">无不重复号码</p>
          </div>

          <div class="overlap-section">
            <div class="overlap-head">
              <h4>与 B 类重复</h4>
              <div class="overlap-head-meta">
                <CopyButton
                  v-if="overlapB.length"
                  :copied="copiedKey === 'c-b'"
                  title="复制与 B 类重复号码"
                  @click="copyNumbers('c-b', overlapBText)"
                />
                <span class="overlap-count">{{ overlapB.length }} 个</span>
              </div>
            </div>
            <div v-if="overlapB.length" class="ball-row">
              <span v-for="num in overlapB" :key="`cb-${num}`" class="ball ball-b">
                {{ formatBall(num) }}
              </span>
            </div>
            <p v-else class="empty overlap-empty">无重复号码</p>
          </div>

          <div class="overlap-section">
            <div class="overlap-head">
              <h4>与 B 类不重复</h4>
              <div class="overlap-head-meta">
                <CopyButton
                  v-if="nonOverlapB.length"
                  :copied="copiedKey === 'c-not-b'"
                  title="复制与 B 类不重复号码"
                  @click="copyNumbers('c-not-b', nonOverlapBText)"
                />
                <span class="overlap-count">{{ nonOverlapB.length }} 个</span>
              </div>
            </div>
            <div v-if="nonOverlapB.length" class="ball-row">
              <span v-for="num in nonOverlapB" :key="`cnb-${num}`" class="ball ball-b">
                {{ formatBall(num) }}
              </span>
            </div>
            <p v-else class="empty overlap-empty">无不重复号码</p>
          </div>
        </div>
      </article>
    </div>

    <div class="summary">
      共产生 <strong>{{ result.totalPicks }}</strong> 个候选号码，
      A 类 <strong>{{ result.classA.length }}</strong> 个，
      B 类 <strong>{{ result.classB.length }}</strong> 个，
      C 类重复合计 <strong>{{ overlapA.length + overlapB.length }}</strong> 个
    </div>
  </section>
</template>

<style scoped>
.panel-heading {
  width: 100%;
}

.panel-desc {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  line-height: 2;
}

.panel-desc strong {
  color: var(--primary);
  font-weight: 600;
}

.class-c-select {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin: 8px 0 4px;
}

.class-c-label {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-soft);
}

.class-c-picker {
  flex: 1;
  min-width: 220px;
}

.class-title-meta,
.overlap-head-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.class-title-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.help-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 1px solid #cbd5e1;
  border-radius: 50%;
  background: #fff;
  color: var(--text-dim);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  cursor: help;
}

.help-btn:hover,
.help-wrap:focus-within .help-btn {
  border-color: #16a34a;
  color: #16a34a;
  background: #f0fdf4;
}

.help-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.help-tip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  z-index: 20;
  width: max-content;
  max-width: 260px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #1e293b;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.45;
  text-align: left;
  white-space: normal;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.22);
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transform: translateX(-50%) translateY(4px);
}

.help-tip::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #1e293b;
}

.help-wrap:hover .help-tip,
.help-wrap:focus-within .help-tip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

.overlap-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 36px;
  margin-top: 16px;
}

.overlap-section {
  padding-top: 14px;
  border-top: 1px dashed var(--border);
}

@media (max-width: 720px) {
  .overlap-grid {
    grid-template-columns: 1fr;
  }
}

.overlap-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.overlap-head h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}

.overlap-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-dim);
}

.overlap-empty {
  margin: 0;
}
</style>
