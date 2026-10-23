<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { DIR_LABEL, DIR_ANGLE, GRID_ORDER } from '../../data/directions'
import { useSpeech } from '../../composables/useSpeech'
import ArtImg from '../shared/ArtImg.vue'

const props = defineProps<{
  mode: 'tap' | 'compose' | 'place'
  correct: string
  items?: string[]
  highlight: boolean
  revealed: boolean
  disabled: boolean
  wrongTick: number
}>()
const emit = defineEmits<{ answer: [cell: string]; ready: [] }>()

const { speak } = useSpeech()

// 合成引导：先亮「左」再亮「上」，合成「左上」后再出题
const introCell = ref<string | null>(null)
const introText = ref('')
const introDone = ref(props.mode !== 'compose')
const timers: number[] = []
const resolvers: Array<() => void> = []
let cancelled = false

const wait = (ms: number) =>
  new Promise<void>((r) => {
    resolvers.push(r)
    timers.push(window.setTimeout(r, ms))
  })

function finishIntro() {
  introCell.value = null
  if (!introDone.value) {
    introDone.value = true
    emit('ready')
  }
}

function skipIntro() {
  cancelled = true
  timers.forEach((t) => window.clearTimeout(t))
  timers.length = 0
  resolvers.splice(0).forEach((r) => r())
  finishIntro()
}

onMounted(async () => {
  if (props.mode !== 'compose') return
  try {
    const parts = [props.correct[0], props.correct[1]].filter(Boolean)
    for (const p of parts) {
      if (cancelled) return
      introCell.value = p
      introText.value = DIR_LABEL[p] ?? p
      speak(DIR_LABEL[p] ?? p)
      await wait(1100)
    }
    if (cancelled) return
    introCell.value = props.correct
    introText.value = DIR_LABEL[props.correct] ?? props.correct
    if (parts.length >= 2) {
      speak(`${DIR_LABEL[parts[0]]}加${DIR_LABEL[parts[1]]}，就是${DIR_LABEL[props.correct]}`)
    }
    await wait(2200)
  } finally {
    if (!cancelled) finishIntro()
  }
})

onBeforeUnmount(() => {
  cancelled = true
  timers.forEach((t) => window.clearTimeout(t))
  timers.length = 0
  resolvers.splice(0).forEach((r) => r())
})

const locked = computed(() => props.disabled || !introDone.value)

const shaking = ref<string | null>(null)
let last = ''
watch(
  () => props.wrongTick,
  () => {
    shaking.value = last
    window.setTimeout(() => (shaking.value = null), 450)
  },
)

function choose(cell: string) {
  // 合成演示中点一下即可跳过，避免像卡死
  if (!introDone.value && props.mode === 'compose') {
    skipIntro()
    return
  }
  if (locked.value) return
  last = cell
  emit('answer', cell)
}

const drag = reactive({ active: false, x: 0, y: 0 })
function onDown(e: PointerEvent) {
  if (locked.value || props.revealed) return
  drag.active = true
  drag.x = e.clientX
  drag.y = e.clientY
  ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
}
function onMove(e: PointerEvent) {
  if (!drag.active) return
  drag.x = e.clientX
  drag.y = e.clientY
}
function onUp(e: PointerEvent) {
  if (!drag.active) return
  drag.active = false
  const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-cell]')
  if (el?.dataset.cell) choose(el.dataset.cell)
}

const arrowAngle = (code: string) => DIR_ANGLE[code] ?? 0
</script>

<template>
  <div class="grid9-wrap">
    <p v-if="mode === 'compose' && !introDone" class="compose-tip">看一看 · 点一下可跳过</p>
    <div class="grid9">
      <button
        v-for="(cell, i) in GRID_ORDER"
        :key="cell"
        class="cell"
        :data-cell="cell"
        :class="{
          center: cell === 'C',
          'is-hl': highlight && cell === correct,
          'is-dim': highlight && cell !== correct,
          'is-ok': revealed && cell === correct,
          'is-shake': shaking === cell,
          intro: introCell === cell,
        }"
        :aria-label="DIR_LABEL[cell]"
        @click="choose(cell)"
      >
        <span v-if="items?.[i]" class="item">{{ items[i] }}</span>
        <span v-if="introCell === cell" class="intro-label">
          <svg v-if="cell.length === 2" viewBox="0 0 48 48" class="intro-arrow" :style="{ transform: `rotate(${arrowAngle(cell)}deg)` }">
            <path d="M24 5 L42 24 H31 V43 H17 V24 H6 Z" fill="var(--accent-strong)" />
          </svg>
          <b>{{ introText }}</b>
        </span>
        <span v-if="mode === 'place' && revealed && cell === correct" class="placed">
          <ArtImg name="sticker_l4.png" alt="星星贴纸">⭐</ArtImg>
        </span>
      </button>
    </div>

    <div v-if="mode === 'place'" class="tray">
      <div
        v-if="!revealed"
        class="sticker hot"
        :class="{ dragging: drag.active }"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="drag.active = false"
      >
        <ArtImg name="sticker_l4.png" alt="星星贴纸">⭐</ArtImg>
      </div>
      <span class="tray-tip">{{ revealed ? '放好啦' : '拖到格子里，或点格子' }}</span>
    </div>

    <div v-if="drag.active" class="ghost" :style="{ left: drag.x + 'px', top: drag.y + 'px' }">
      <ArtImg name="sticker_l4.png" alt="">⭐</ArtImg>
    </div>
  </div>
</template>

<style scoped>
.grid9-wrap { display: flex; flex-direction: column; align-items: center; gap: 18px; }
.compose-tip { margin: 0; font-size: 18px; font-weight: 800; color: var(--ink-soft); }
.grid9 {
  display: grid;
  grid-template-columns: repeat(3, minmax(var(--cell), 100px));
  grid-template-rows: repeat(3, minmax(var(--cell), 100px));
  gap: 12px;
}
.cell {
  position: relative;
  min-width: var(--cell);
  min-height: var(--cell);
  border-radius: 22px;
  background: var(--card);
  border: 3px solid #F3D9DF;
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.12s ease, opacity 0.2s, background 0.2s;
}
.cell:active { transform: scale(0.94); }
.cell.center { background: #FFF9EC; border-color: var(--warn); }
.cell.intro { background: var(--accent); border-color: var(--accent-strong); }
.item { font-size: 44px; line-height: 1; }
.intro-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; animation: pop 0.4s ease both; }
.intro-label b { font-size: 24px; }
.intro-arrow { width: 40px; height: 40px; }
.placed { position: absolute; inset: 12px; font-size: 48px; display: flex; align-items: center; justify-content: center; animation: pop 0.45s ease both; }
.tray { display: flex; align-items: center; gap: 14px; min-height: 84px; }
.sticker {
  width: 84px;
  height: 84px;
  font-size: 52px;
  background: #FFF4D6;
  border: 3px dashed var(--gold);
  touch-action: none;
  cursor: grab;
  animation: float 1.4s ease-in-out infinite;
}
.sticker.dragging { opacity: 0.35; }
.tray-tip { font-size: 18px; color: var(--ink-soft); font-weight: 700; }
.ghost {
  position: fixed;
  width: 80px;
  height: 80px;
  font-size: 56px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
