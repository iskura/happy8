<script setup>
const bgUrl = `${import.meta.env.BASE_URL}background.png`
</script>

<template>
  <div class="page-background" aria-hidden="true">
    <div
      class="page-background-image"
      :style="{ backgroundImage: `url(${bgUrl})` }"
    />
    <div class="page-background-overlay" />
  </div>
</template>

<style scoped>
.page-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.page-background-image {
  position: absolute;
  inset: 0;
  background-color: #081426;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  transform: scale(1.02);
}

.page-background-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(8, 18, 38, 0.38) 0%, rgba(20, 45, 90, 0.22) 45%, rgba(8, 18, 38, 0.48) 100%),
    radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0, 132, 199, 0.16), transparent 70%);
}
</style>
