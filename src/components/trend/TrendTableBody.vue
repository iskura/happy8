<script setup>
defineProps({
  rows: { type: Array, default: () => [] },
  issueColMode: { type: String, default: 'issue' },
  marks: { type: Object, default: () => ({}) },
  cellClasses: { type: Function, required: true },
  displayHit: { type: Function, required: true },
  formatIssueDate: { type: Function, required: true },
  isSegmentLine: { type: Function, required: true },
})
</script>

<template>
  <tbody>
    <tr
      v-for="(row, index) in rows"
      :key="row.issue"
      :class="{ 'segment-line': isSegmentLine(index) }"
    >
      <td class="sticky-col col-issue">
        <div class="issue-cell">
          <span v-if="issueColMode === 'issue'" class="issue-no">
            {{ formatIssueDate(row).issue }}
          </span>
          <span v-else class="issue-date">
            {{ formatIssueDate(row).date }} {{ formatIssueDate(row).weekday }}
          </span>
        </div>
      </td>
      <td
        v-for="cell in row.cells"
        :key="cell.num"
        class="col-num"
        :class="cellClasses(cell, row)"
      >
        <span v-if="cell.type === 'hit'" class="hit-ball">{{ displayHit(cell) }}</span>
        <span v-else-if="marks.omission !== false" class="miss-value">{{ cell.omission }}</span>
      </td>
    </tr>
  </tbody>
</template>
