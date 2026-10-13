<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { formatBall, copyText, parseBallInput } from '../utils/format.js'
import { notifyError, notifySuccess } from '../utils/uiMessage.js'
import {
  appendPredictionRow,
  createPredictionRow,
  loadCClassRowIndex,
  loadPredictionRows,
  PREDICTION_CHART_ID,
  PREDICTION_UPDATE_EVENT,
  saveCClassRowIndex,
  setFirstPredictionRowNumbers,
} from '../utils/predictionStorage.js'
import IssueSelect from './IssueSelect.vue'
import LookbackSelect from './LookbackSelect.vue'
import SearchSelect from './SearchSelect.vue'
import CopyButton from './CopyButton.vue'
import PredictionRowButton from './PredictionRowButton.vue'
import StatHelpPopover from './common/StatHelpPopover.vue'
import { useActionFeedback } from '../composables/useActionFeedback.js'
import { useStatTip } from '../composables/trend/useStatTip.js'

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
const classBText = computed(() => props.result.classBFormatted.join(' '))

const COLD_HELP_TEXT = '冷号：选中开奖期数之前30期内，出现次数少于5次的号码'
const COLD_HELP_STAT = { key: 'cold', help: COLD_HELP_TEXT }

const { statTip, statTipRef, showStatTip, hideStatTip } = useStatTip()

const coldNumberSet = computed(
  () => new Set((props.result.classBCold || []).map((item) => item.num)),
)

function isColdNumber(num) {
  return coldNumberSet.value.has(num)
}

const { trigger: triggerCopied, isActive: isCopied } = useActionFeedback()
const { trigger: triggerAdded, isActive: isAdded } = useActionFeedback()
const summaryInput = ref('')
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

// C 内合并：与A重复 + 与B重复
const overlapAB = computed(() => {
  const set = new Set([...overlapA.value, ...overlapB.value])
  return [...set].sort((a, b) => a - b)
})
// C 内合并：与A不重复 + 与B不重复
const nonOverlapAB = computed(() => {
  const set = new Set([...nonOverlapA.value, ...nonOverlapB.value])
  return [...set].sort((a, b) => a - b)
})
const overlapABText = computed(() => overlapAB.value.map((num) => formatBall(num)).join(' '))
const nonOverlapABText = computed(() => nonOverlapAB.value.map((num) => formatBall(num)).join(' '))

// D类：80 - A - B - C
const classD = computed(() => {
  const all80 = Array.from({ length: 80 }, (_, i) => i + 1)
  const setA = new Set(props.result.classA.map((item) => item.num))
  const setB = new Set(props.result.classB.map((item) => item.num))
  const setC = new Set(selectedPredictionNumbers.value)
  return all80.filter((num) => !setA.has(num) && !setB.has(num) && !setC.has(num))
})
const classDText = computed(() => classD.value.map((num) => formatBall(num)).join(' '))

async function copyNumbers(key, text) {
  const ok = await copyText(text)
  if (!ok) {
    notifyError('复制失败')
    return
  }
  triggerCopied(key)
  notifySuccess('复制成功')
}

function addNumbersToPrediction(key, numbers) {
  if (props.disabled || !numbers.length) return

  const result = appendPredictionRow(PREDICTION_CHART_ID, numbers)
  if (!result) return

  reloadPredictionRows()

  triggerAdded(key)
  notifySuccess(`已生成预测第 ${result.index} 行（${numbers.length} 个号码）`)
}

function addSummaryToFirstRow() {
  if (props.disabled) return

  const numbers = parseBallInput(summaryInput.value)
  if (!numbers.length) {
    notifyError('请输入有效号码（01–80）')
    return
  }

  const result = setFirstPredictionRowNumbers(PREDICTION_CHART_ID, numbers)
  if (!result) return

  reloadPredictionRows()
  triggerAdded('summary-pred')
  notifySuccess(`已填入预测第 1 行（${numbers.length} 个号码）`)
}

function addClassToPrediction(key, classItems) {
  addNumbersToPrediction(key, classItems.map((item) => item.num))
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
            <PredictionRowButton
              v-if="result.classA.length"
              :added="isAdded('a-pred')"
              :disabled="disabled"
              title="生成预测行并填入 A 类号码"
              @click="addClassToPrediction('a-pred', result.classA)"
            />
            <CopyButton
              v-if="result.classA.length"
              :copied="isCopied('a')"
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
                @mouseenter="showStatTip($event, COLD_HELP_STAT)"
                @mouseleave="hideStatTip"
                @focus="showStatTip($event, COLD_HELP_STAT)"
                @blur="hideStatTip"
              >
                ?
              </button>
            </span>
          </div>
          <div class="class-title-meta">
            <PredictionRowButton
              v-if="result.classB.length"
              :added="isAdded('b-pred')"
              :disabled="disabled"
              title="生成预测行并填入 B 类号码"
              @click="addClassToPrediction('b-pred', result.classB)"
            />
            <CopyButton
              v-if="result.classB.length"
              :copied="isCopied('b')"
              title="复制 B 类号码"
              @click="copyNumbers('b', classBText)"
            />
            <span class="badge">{{ result.classB.length }} 个</span>
          </div>
        </div>
        <p class="class-tip">在分析过程中仅被选中 1 次；冷号为基准期前 30 期内出现少于 5 次的号码</p>
        <div v-if="result.classB.length" class="ball-row">
          <span
            v-for="item in result.classB"
            :key="item.num"
            class="ball"
            :class="isColdNumber(item.num) ? 'ball-cold' : 'ball-b'"
            :title="isColdNumber(item.num) ? '冷号' : undefined"
          >
            {{ formatBall(item.num) }}
          </span>
        </div>
        <p v-else class="empty">暂无 B 类号码</p>
      </article>

      <article class="class-card class-c">
        <div class="class-title">
          <h3>C 类号码</h3>
          <div class="class-title-meta">
            <CopyButton
              v-if="selectedPredictionNumbers.length"
              :copied="isCopied('c-pred')"
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
              <h4>与 A / B 重复</h4>
              <div class="overlap-head-meta">
                <PredictionRowButton
                  v-if="overlapAB.length"
                  :added="isAdded('c-ab-pred')"
                  :disabled="disabled"
                  title="生成预测行并填入与 A/B 类重复号码"
                  @click="addNumbersToPrediction('c-ab-pred', overlapAB)"
                />
                <CopyButton
                  v-if="overlapAB.length"
                  :copied="isCopied('c-ab')"
                  title="复制与 A/B 类重复号码"
                  @click="copyNumbers('c-ab', overlapABText)"
                />
                <span class="overlap-count">{{ overlapAB.length }} 个</span>
              </div>
            </div>
            <div v-if="overlapAB.length" class="ball-row">
              <span v-for="num in overlapAB" :key="`cab-${num}`" class="ball ball-c">
                {{ formatBall(num) }}
              </span>
            </div>
            <p v-else class="empty overlap-empty">无重复号码</p>
          </div>

          <div class="overlap-section">
            <div class="overlap-head">
              <h4>与 A / B 不重复</h4>
              <div class="overlap-head-meta">
                <PredictionRowButton
                  v-if="nonOverlapAB.length"
                  :added="isAdded('c-not-ab-pred')"
                  :disabled="disabled"
                  title="生成预测行并填入与 A/B 类不重复号码"
                  @click="addNumbersToPrediction('c-not-ab-pred', nonOverlapAB)"
                />
                <CopyButton
                  v-if="nonOverlapAB.length"
                  :copied="isCopied('c-not-ab')"
                  title="复制与 A/B 类不重复号码"
                  @click="copyNumbers('c-not-ab', nonOverlapABText)"
                />
                <span class="overlap-count">{{ nonOverlapAB.length }} 个</span>
              </div>
            </div>
            <div v-if="nonOverlapAB.length" class="ball-row">
              <span v-for="num in nonOverlapAB" :key="`cnab-${num}`" class="ball ball-c">
                {{ formatBall(num) }}
              </span>
            </div>
            <p v-else class="empty overlap-empty">无不重复号码</p>
          </div>
        </div>
      </article>

      <article class="class-card class-d">
        <div class="class-title">
          <h3>D 类号码</h3>
          <div class="class-title-meta">
            <PredictionRowButton
              v-if="classD.length"
              :added="isAdded('d-pred')"
              :disabled="disabled"
              title="生成预测行并填入 D 类号码"
              @click="addNumbersToPrediction('d-pred', classD)"
            />
            <CopyButton
              v-if="classD.length"
              :copied="isCopied('d')"
              title="复制 D 类号码"
              @click="copyNumbers('d', classDText)"
            />
            <span class="badge">{{ classD.length }} 个</span>
          </div>
        </div>
        <p class="class-tip">80 个号码减去 A / B / C 类号码</p>
        <div v-if="classD.length" class="ball-row">
          <span v-for="num in classD" :key="`d-${num}`" class="ball ball-d">
            {{ formatBall(num) }}
          </span>
        </div>
        <p v-else class="empty">无剩余号码</p>
      </article>
    </div>

    <div class="summary summary-input">
      <input
        v-model="summaryInput"
        type="text"
        class="summary-input-field"
        placeholder="输入号码，空格分隔"
        :disabled="disabled"
        @keydown.enter.prevent="addSummaryToFirstRow"
      />
      <PredictionRowButton
        :added="isAdded('summary-pred')"
        :disabled="disabled || !summaryInput.trim()"
        title="填入预测行第一行"
        @click="addSummaryToFirstRow"
      />
    </div>

    <StatHelpPopover
      :tip="statTip"
      :tip-ref="statTipRef"
    />

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
  gap: var(--spacing-md);
  margin: var(--spacing-sm) 0 var(--spacing-xs);
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
  border: var(--border-width) solid var(--border-strong);
  border-radius: var(--radius-circle);
  background: var(--color-surface);
  color: var(--text-dim);
  font-size: var(--font-size-small);
  font-weight: 700;
  line-height: 1;
  cursor: help;
}

.help-btn:hover,
.help-wrap:focus-within .help-btn {
  border-color: var(--success);
  color: var(--success);
  background: var(--success-bg);
}

.help-wrap {
  display: inline-flex;
  align-items: center;
}

.overlap-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-xl) 36px;
  margin-top: var(--spacing-lg);
}

.overlap-section {
  padding-top: 14px;
  border-top: var(--border-width) dashed var(--border);
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
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.overlap-head h4 {
  margin: 0;
  font-size: var(--font-size-body);
  font-weight: 700;
  color: var(--text);
}

.overlap-count {
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--text-dim);
}

.overlap-empty {
  margin: 0;
}

.summary-input {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding-top: 10px;
  padding-bottom: 10px;
}

.summary-input-field {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--text);
  font-size: var(--font-size-body);
  line-height: 1.4;
}

.summary-input-field:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
}

.summary-input-field:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
