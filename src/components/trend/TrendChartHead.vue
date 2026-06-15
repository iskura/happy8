<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { isZoneBoundaryCol } from '../../utils/chartZone.js'

const props = defineProps({
  chart: { type: Object, required: true },
  columnHeaders: { type: Array, required: true },
  issueColMode: { type: String, default: 'issue' },
  frozen: { type: Boolean, default: false },
  headerGroups: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:issueColMode'])

const theadRef = ref(null)
let headResizeObserver = null

function setIssueMode(mode) {
  emit('update:issueColMode', mode)
}

function colHeadClass(index) {
  const colNum = index + 1
  return {
    'zone-head': isZoneBoundaryCol(colNum, props.chart),
    'group-separator': props.chart.groupSeparators?.includes(colNum),
  }
}

function syncGroupHeadRowHeight() {
  const thead = theadRef.value
  if (!thead || !props.headerGroups.length) return
  const groupRow = thead.querySelector('.header-group-row')
  if (!groupRow) return
  const height = groupRow.offsetHeight
  thead.style.setProperty('--group-head-row-h', `${height}px`)
}

watch(
  () => [props.headerGroups.length, props.columnHeaders.length, props.frozen, props.chart.id],
  () => nextTick(syncGroupHeadRowHeight),
)

onMounted(() => {
  nextTick(() => {
    syncGroupHeadRowHeight()
    if (typeof ResizeObserver !== 'undefined' && theadRef.value) {
      headResizeObserver = new ResizeObserver(() => syncGroupHeadRowHeight())
      headResizeObserver.observe(theadRef.value)
    }
  })
  window.addEventListener('resize', syncGroupHeadRowHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncGroupHeadRowHeight)
  headResizeObserver?.disconnect()
})
</script>

<template>
  <thead
    ref="theadRef"
    :class="{ 'is-frozen': frozen, 'has-group-head': headerGroups.length }"
  >
    <tr v-if="headerGroups.length" class="header-group-row">
      <th rowspan="2" class="sticky-col col-issue">
        <div class="issue-head-toggle">
          <button
            type="button"
            class="issue-toggle-btn"
            :class="{ active: issueColMode === 'issue' }"
            @click="setIssueMode('issue')"
          >
            期号
          </button>
          <span class="issue-toggle-sep">/</span>
          <button
            type="button"
            class="issue-toggle-btn"
            :class="{ active: issueColMode === 'date' }"
            @click="setIssueMode('date')"
          >
            日期
          </button>
        </div>
      </th>
      <th
        v-for="(group, index) in headerGroups"
        :key="`group-${group.label}`"
        :colspan="group.colspan"
        class="col-group-head"
        :class="{ 'group-separator': index > 0 && group.separatorBefore !== false }"
      >
        {{ group.label }}
      </th>
    </tr>
    <tr class="header-col-row">
      <th v-if="!headerGroups.length" class="sticky-col col-issue">
        <div class="issue-head-toggle">
          <button
            type="button"
            class="issue-toggle-btn"
            :class="{ active: issueColMode === 'issue' }"
            @click="setIssueMode('issue')"
          >
            期号
          </button>
          <span class="issue-toggle-sep">/</span>
          <button
            type="button"
            class="issue-toggle-btn"
            :class="{ active: issueColMode === 'date' }"
            @click="setIssueMode('date')"
          >
            日期
          </button>
        </div>
      </th>
      <th
        v-for="(header, index) in columnHeaders"
        :key="`col-head-${index}`"
        class="col-num"
        :class="colHeadClass(index)"
      >
        {{ header }}
      </th>
    </tr>
  </thead>
</template>
