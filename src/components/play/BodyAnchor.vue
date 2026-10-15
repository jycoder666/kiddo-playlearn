<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { BODY_LABEL } from '../../data/directions'
import HeroSprite, { type Pose } from '../shared/HeroSprite.vue'

const props = defineProps<{
  correct: string
  highlight: boolean
  revealed: boolean
  disabled: boolean
  wrongTick: number
}>()
const emit = defineEmits<{ answer: [code: string] }>()

/** 背对：小兔右手/右耳在画面左，左手/左耳在画面右（硬约束，禁止镜像） */
const SPOTS = [
  { code: 'ear_R', left: 75, top: 24 },
  { code: 'ear_L', left: 173, top: 24 },
  { code: 'hand_R', left: 69, top: 188 },
  { code: 'hand_L', left: 179, top: 188 },
]

const pose = computed<Pose>(() => {
  if (!props.revealed) return 'idle'
  if (props.correct === 'hand_L') return 'hand_left'
  if (props.correct === 'hand_R') return 'hand_right'
  return 'idle'
})
const wiggle = computed(() => {
  if (!props.revealed) return null
  if (props.correct === 'ear_L') return 'L'
  if (props.correct === 'ear_R') return 'R'
  return null
})

const shaking = ref<string | null>(null)
let last = ''
watch(
  () => props.wrongTick,
  () => {
    shaking.value = last
    window.setTimeout(() => (shaking.value = null), 450)
  },
)

function tap(code: string) {
  if (props.disabled) return
  last = code
  emit('answer', code)
}
</script>

<template>
  <div class="body-anchor">
    <div class="stage">
      <div class="hero-wrap"><HeroSprite :pose="pose" :wiggle="wiggle" :width="240" /></div>
      <button
        v-for="s in SPOTS"
        :key="s.code"
        class="spot"
        :style="{ left: s.left + 'px', top: s.top + 'px' }"
        :class="{
          'is-hl': highlight && s.code === correct,
          'is-dim': highlight && s.code !== correct,
          'is-ok': revealed && s.code === correct,
          'is-shake': shaking === s.code,
        }"
        :aria-label="BODY_LABEL[s.code]"
        @click="tap(s.code)"
      />
    </div>
    <p class="tip">🐰 小兔背对你，和你一样朝前看</p>
  </div>
</template>

<style scoped>
.body-anchor { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.stage { position: relative; width: 324px; height: 300px; }
.hero-wrap { position: absolute; left: 42px; top: 0; }
.spot {
  position: absolute;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  border: 3px dashed rgba(95, 169, 198, 0.55);
  background: rgba(168, 213, 229, 0.18);
  transition: opacity 0.2s;
}
.spot:active { background: rgba(168, 213, 229, 0.45); }
.spot.is-ok { background: rgba(184, 224, 210, 0.55) !important; }
.tip { margin: 0; font-size: 16px; color: var(--ink-soft); font-weight: 700; }
</style>
