<script setup>
import { formatBall } from '../../utils/format.js'

defineProps({
  tip: {
    type: Object,
    default: null,
  },
  tipRef: {
    type: Object,
    default: null,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <Teleport to="body">
    <Transition name="stat-tip">
      <div
        v-if="tip"
        :ref="(el) => { if (tipRef) tipRef.value = el }"
        class="stat-help-popover-anchor"
        :class="{ 'is-bottom': tip.placement === 'bottom' }"
        :style="{
          left: `${tip.x}px`,
          top: `${tip.y}px`,
          '--arrow-offset': `${tip.arrowOffset}px`,
        }"
      >
        <div
          class="stat-help-popover"
          :class="{
            'stat-help-popover--compact': compact,
            'stat-help-popover--balls': tip.groups?.length || tip.balls?.length,
            'is-bottom': tip.placement === 'bottom',
          }"
          role="tooltip"
        >
          <p
            v-if="tip.text"
            class="stat-help-popover__text"
          >
            {{ tip.text }}
          </p>

          <div
            v-if="tip.groups?.length"
            class="stat-help-popover__ball-row stat-help-popover__ball-row--nowrap"
          >
            <template
              v-for="(group, groupIndex) in tip.groups"
              :key="`group-${groupIndex}`"
            >
              <span
                v-if="groupIndex > 0"
                class="stat-help-popover__group-gap"
                aria-hidden="true"
              />
              <span
                v-for="num in group"
                :key="`${groupIndex}-${num}`"
                class="ball ball-draw stat-help-popover__ball"
              >
                {{ formatBall(num) }}
              </span>
            </template>
          </div>

          <div
            v-else-if="tip.balls?.length"
            class="stat-help-popover__ball-row stat-help-popover__ball-row--nowrap"
          >
            <span
              v-for="num in tip.balls"
              :key="num"
              class="ball ball-cold stat-help-popover__ball"
            >
              {{ formatBall(num) }}
            </span>
          </div>

          <p
            v-else-if="tip.empty"
            class="stat-help-popover__empty"
          >
            {{ tip.empty }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
