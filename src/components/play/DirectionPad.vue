<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DIR_ANGLE, DIR_LABEL, cellOf } from '../../data/directions'

const props = withDefaults(
  defineProps<{
    mode?: 4 | 8
    correct: string
    highlight?: boolean
    revealed?: boolean
    disabled?: boolean
    wrongTick?: number
    compact?: boolean
  }>(),
  { mode: 4, highlight: false, revealed: false, disabled: false, wrongTick: 0, compact: false },
)
const emit = defineEmits<{ press: [dir: string] }>()

const dirs = computed(() => (props.mode === 8 ? ['LU', 'U', 'RU', 'L', 'R', 'LD', 'D', 'RD'] : ['U', 'L', 'R', 'D']))

const shaking = ref<string | null>(null)
let last = ''
watch(
  () => props.wrongTick,
  () => {
    shaking.value = last
    window.setTimeout(() => (shaking.value = null), 450)
  },
)

function press(d: string) {
  if (props.disabled) return
  last = d
  emit('press', d)
}
</script>

<template>
  <div class="pad" :class="{ compact }">
    <button
      v-for="d in dirs"
      :key="d"
      class="pad-btn"
      :style="{ gridColumn: cellOf(d)[0] + 1, gridRow: cellOf(d)[1] + 1 }"
      :class="{
        'is-hl': highlight && d === correct,
        'is-dim': highlight && d !== correct,
        'is-ok': revealed && d === correct,
        'is-shake': shaking === d,
      }"
      :aria-label="DIR_LABEL[d]"
      @click="press(d)"
    >
      <svg viewBox="0 0 48 48" :style="{ transform: `rotate(${DIR_ANGLE[d]}deg)` }" aria-hidden="true">
        <path d="M24 5 L42 24 H31 V43 H17 V24 H6 Z" fill="var(--ink)" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round" />
      </svg>
    </button>
    <div class="pad-center"><slot /></div>
  </div>
</template>

<style scoped>
.pad {
  --side: 92px;
  --mid: 172px;
  display: grid;
  grid-template-columns: var(--side) var(--mid) var(--side);
  grid-template-rows: var(--side) var(--mid) var(--side);
  gap: 8px;
  justify-content: center;
}
.pad.compact { --side: 76px; --mid: 76px; }
.pad-btn {
  width: 100%;
  height: 100%;
  min-width: var(--hit);
  min-height: var(--hit);
  border-radius: 24px;
  background: var(--card);
  border: 3px solid var(--mint);
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.12s ease, opacity 0.2s;
}
.pad-btn:active { transform: scale(0.94); }
.pad-btn svg { width: 46%; height: 46%; }
.pad-center {
  grid-column: 2;
  grid-row: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
</style>
