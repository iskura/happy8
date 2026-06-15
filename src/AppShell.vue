<script setup>
import { ref } from 'vue'
import { isAuthenticated } from './utils/auth.js'
import LoginPage from './components/LoginPage.vue'
import App from './App.vue'

const authed = ref(isAuthenticated())

function handleLoginSuccess() {
  authed.value = true
}
</script>

<template>
  <LoginPage v-if="!authed" @success="handleLoginSuccess" />
  <App v-else />
</template>
