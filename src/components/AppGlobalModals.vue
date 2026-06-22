<script setup>
// import { onMounted } from 'vue'
// import BaseModal from './common/BaseModal.vue'
// import { useLoveModal, useRestReminder } from '../composables/useAppModals.js'

// const { showLoveModal, loveModalShake, setupLoveModal, answerLove } = useLoveModal()
// const { showRestReminder, setupRestReminder, dismissRestReminder } = useRestReminder()

// onMounted(() => {
//   setupLoveModal()
//   setupRestReminder()
// })
</script>

<template>
  <!--
  <Teleport to="body">
    <BaseModal
      :show="showLoveModal"
      :shake="loveModalShake"
      aria-labelledby="love-modal-title"
    >
      <p
        id="love-modal-title"
        class="modal-text"
      >
        老婆，你爱我吗？
      </p>
      <div class="modal-actions">
        <button
          type="button"
          class="btn modal-btn modal-btn--love-yes"
          @click="answerLove('yes')"
        >
          <svg
            class="modal-btn-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
          </svg>
          爱
        </button>
        <button
          type="button"
          class="btn modal-btn modal-btn--love-no"
          @click="answerLove('no')"
        >
          <svg
            class="modal-btn-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              opacity="0.4"
            />
            <path
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              d="M5 5l14 14"
            />
          </svg>
          不爱
        </button>
      </div>
    </BaseModal>

    <BaseModal
      :show="showRestReminder"
      variant="secondary"
      dismiss-on-backdrop
      aria-labelledby="rest-modal-title"
      @dismiss="dismissRestReminder"
    >
      <p
        id="rest-modal-title"
        class="modal-text modal-text--sm"
      >
        老婆别看了，休息下。给我发消息了！
      </p>
      <button
        type="button"
        class="btn modal-btn modal-btn--wide modal-btn--rest-ok"
        @click="dismissRestReminder"
      >
        <svg
          class="modal-btn-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
          />
        </svg>
        好的
      </button>
    </BaseModal>
  </Teleport>
  -->
</template>
