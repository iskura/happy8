<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../utils/auth.js'
import PageBackground from './PageBackground.vue'

const router = useRouter()
const faviconUrl = `${import.meta.env.BASE_URL}favicon.png`

const password = ref('')
const error = ref('')
const submitting = ref(false)
const showPassword = ref(false)

function submit() {
  if (submitting.value) return
  error.value = ''

  if (!password.value) {
    error.value = '请输入密码'
    return
  }

  submitting.value = true
  const ok = login(password.value)
  submitting.value = false

  if (!ok) {
    error.value = '密码错误，请重试'
    password.value = ''
    return
  }

  const redirect = typeof router.currentRoute.value.query.redirect === 'string'
    ? router.currentRoute.value.query.redirect
    : '/home'
  router.replace(redirect)
}
</script>

<template>
  <div class="login-page">
    <PageBackground />
    <div class="login-overlay" aria-hidden="true" />

    <div class="login-shell">
      <div class="login-card">
        <div class="login-brand">
          <img class="login-logo" :src="faviconUrl" alt="" width="56" height="56" />
          <div class="login-brand-text">
            <p class="login-eyebrow">Happy 8 Analysis</p>
            <h1>快乐8选号分析</h1>
          </div>
        </div>

        <form class="login-form" @submit.prevent="submit">
          <label class="login-label" for="login-password">访问密码</label>
          <div class="login-input-wrap" :class="{ 'has-error': !!error }">
            <svg class="login-input-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect
                x="5"
                y="11"
                width="14"
                height="10"
                rx="2"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              />
              <path
                d="M8 11V8a4 4 0 1 1 8 0v3"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
            <input
              id="login-password"
              v-model="password"
              class="login-input"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="请输入密码"
              :disabled="submitting"
              autofocus
            />
            <button
              type="button"
              class="login-toggle"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              :disabled="submitting"
              @click="showPassword = !showPassword"
            >
              <svg v-if="showPassword" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M3 3l18 18"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
                <path
                  d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-1.2M6.7 6.7C4.6 8.1 3 10 2 12c2.5 4.5 6.8 7 10 7 1.6 0 3.1-.4 4.5-1.1M17.3 17.3C19.4 15.9 21 14 22 12c-2.5-4.5-6.8-7-10-7-1.2 0-2.4.2-3.5.6"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                />
              </svg>
            </button>
          </div>

          <p v-if="error" class="login-error" role="alert">{{ error }}</p>

          <button class="login-btn" type="submit" :disabled="submitting">
            <span>{{ submitting ? '验证中...' : '进入系统' }}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}

.login-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(135deg, rgba(6, 14, 30, 0.55) 0%, rgba(10, 28, 58, 0.28) 42%, rgba(6, 14, 30, 0.62) 100%),
    radial-gradient(circle at 78% 72%, rgba(252, 211, 77, 0.14), transparent 28%),
    radial-gradient(circle at 22% 18%, rgba(56, 189, 248, 0.14), transparent 32%);
}

.login-shell {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 32px 18px;
}

.login-card {
  width: min(100%, 420px);
  padding: 34px 30px 30px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(22px) saturate(140%);
  -webkit-backdrop-filter: blur(22px) saturate(140%);
  box-shadow:
    0 24px 60px rgba(2, 8, 23, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
}

.login-logo {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  box-shadow: 0 10px 24px rgba(2, 8, 23, 0.28);
  object-fit: cover;
}

.login-brand-text {
  min-width: 0;
}

.login-eyebrow {
  margin: 0 0 4px;
  font-size: var(--font-size-hint);
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(186, 230, 253, 0.92);
}

.login-brand h1 {
  margin: 0;
  font-size: clamp(24px, 5vw, 28px);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-surface);
  text-shadow: 0 2px 18px rgba(15, 23, 42, 0.35);
}


.login-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.login-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(241, 245, 249, 0.88);
}

.login-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 50px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.34);
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

.login-input-wrap:focus-within {
  border-color: rgba(125, 211, 252, 0.85);
  background: rgba(15, 23, 42, 0.48);
  box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.16);
}

.login-input-wrap.has-error {
  border-color: rgba(248, 113, 113, 0.85);
  box-shadow: 0 0 0 4px rgba(248, 113, 113, 0.12);
}

.login-input-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: rgba(186, 230, 253, 0.9);
}

.login-input {
  flex: 1;
  min-width: 0;
  height: 48px;
  border: none;
  background: transparent;
  font-size: 15px;
  color: var(--color-surface);
  outline: none;
}

.login-input::placeholder {
  color: rgba(148, 163, 184, 0.82);
}

.login-input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: rgba(226, 232, 240, 0.78);
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.login-toggle svg {
  width: 18px;
  height: 18px;
}

.login-toggle:hover:not(:disabled) {
  color: var(--color-surface);
  background: rgba(255, 255, 255, 0.08);
}

.login-toggle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-error {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--chart-legend-bose-red);
}

.login-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  margin-top: 8px;
  height: 50px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--color-login-accent) 0%, var(--color-login-accent-end) 52%, var(--color-login-accent-dark) 100%);
  color: var(--color-surface);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow:
    0 12px 28px rgba(2, 132, 199, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
  transition: transform 0.15s, filter 0.15s, opacity 0.15s;
}

.login-btn svg {
  width: 18px;
  height: 18px;
}

.login-btn:hover:not(:disabled) {
  filter: brightness(1.06);
  transform: translateY(-1px);
}

.login-btn:disabled {
  opacity: 0.72;
  cursor: not-allowed;
  transform: none;
}


@media (max-width: 520px) {
  .login-card {
    padding: 28px 22px 24px;
    border-radius: 20px;
  }

  .login-brand {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
