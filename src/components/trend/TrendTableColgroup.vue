<script setup>
defineProps({
  columnCount: { type: Number, required: true },
  colKeyPrefix: { type: String, default: 'col' },
})
</script>

<template>
  <colgroup>
    <col class="col-issue-def" />
    <col
      v-for="index in columnCount"
      :key="`${colKeyPrefix}-${index}`"
      class="col-num-def"
    />
  </colgroup>
</template>
