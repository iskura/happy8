<script setup>
import { ref } from 'vue'
import { useActionFeedback } from '../composables/useActionFeedback.js'
import { parseBallInput } from '../utils/format.js'
import { PREDICTION_CHART_ID, setFirstPredictionRowNumbers } from '../utils/predictionStorage.js'
import { notifyError, notifySuccess } from '../utils/uiMessage.js'
import PredictionRowButton from './PredictionRowButton.vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})

const { trigger: triggerAdded, isActive: isAdded } = useActionFeedback()
const summaryInput = ref('')

function addSummaryToFirstRow() {
  if (props.disabled) return

  const numbers = parseBallInput(summaryInput.value)
  if (!numbers.length) {
    notifyError('请输入有效号码（01–80）')
    return
  }

  const result = setFirstPredictionRowNumbers(PREDICTION_CHART_ID, numbers)
  if (!result) return

  triggerAdded('summary-pred')
  notifySuccess(`已填入预测第 1 行（${numbers.length} 个号码）`)
}
</script>

<template>
  <div class="summary-input summary-input-bar">
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
</template>

<style scoped>
.summary-input-bar {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-soft, var(--color-surface));
}

.summary-input {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
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
