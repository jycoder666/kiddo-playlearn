<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { DIR_VEC, cellOf } from '../../data/directions'
import type { WalkChain, WalkHop } from '../../data/walkChain'
import DirectionPad from './DirectionPad.vue'
import HeroSprite from '../shared/HeroSprite.vue'

const props = withDefaults(
  defineProps<{
    start: string
    correct: string
    /** 本跳格数，1～3 */
    steps?: number
    padMode: 4 | 8
    chain?: WalkChain | null
    highlight: boolean
    revealed: boolean
    disabled: boolean
    wrongTick: number
  }>(),
  { steps: 1, chain: null },
)
const emit = defineEmits<{ answer: [dir: string]; blocked: [] }>()

const CELL = 74
const GAP = 6
const STEP = CELL + GAP
const VIEW_W = 330
const VIEW_H = 282
const DECO = ['🥕', '🌼', '🌷', '🍄', '🥕', '🌱']

type Pos = [number, number]
const stepN = (p: Pos, d: string, n: number): Pos => {
  const [dx, dy] = DIR_VEC[d] ?? [0, 0]
  return [p[0] + dx * n, p[1] + dy * n]
}
/** 途经格（不含起点，含终点） */
const along = (p: Pos, d: string, n: number): Pos[] => {
  const out: Pos[] = []
  for (let i = 1; i <= n; i++) out.push(stepN(p, d, i))
  return out
}
const keyOf = (p: Pos) => `${p[0]},${p[1]}`

const hopLen = computed(() => Math.max(1, Math.min(3, props.steps || 1)))

/** 连跳路线上走过的点（含当前起点）与脚印 */
const path = computed(() => {
  if (!props.chain) {
    return { pts: [cellOf(props.start)] as Pos[], trail: new Set<string>() }
  }
  const pts: Pos[] = [cellOf(props.chain.start)]
  const trail = new Set<string>()
  for (const hop of props.chain.hops as WalkHop[]) {
    const from = pts[pts.length - 1]
    for (const p of along(from, hop.dir, hop.steps)) {
      trail.add(keyOf(p))
      pts.push(p)
    }
  }
  return { pts, trail }
})
const startPos = computed(() => path.value.pts[path.value.pts.length - 1])
const targetPos = computed(() => stepN(startPos.value, props.correct, hopLen.value))
const heroPos = computed<Pos>(() => (props.revealed ? targetPos.value : startPos.value))
const visited = computed(() => {
  const s = new Set(path.value.trail)
  s.add(keyOf(startPos.value))
  if (props.revealed) {
    for (const p of along(startPos.value, props.correct, hopLen.value)) s.add(keyOf(p))
  }
  return s
})

const cam = ref<Pos>([...startPos.value] as Pos)
let panTimer: number | undefined
watch(
  startPos,
  (p) => {
    if (!props.revealed) cam.value = [...p] as Pos
  },
  { immediate: true },
)
watch(
  () => props.revealed,
  (r) => {
    if (!r || !props.chain) return
    panTimer = window.setTimeout(() => (cam.value = [...targetPos.value] as Pos), 420)
  },
)
onBeforeUnmount(() => window.clearTimeout(panTimer))

function decoAt(x: number, y: number): string {
  const h = (Math.imul(x + 101, 73856093) ^ Math.imul(y + 211, 19349663)) >>> 0
  return h % 100 < 40 ? DECO[(h >>> 7) % DECO.length] : ''
}

const tiles = computed(() => {
  const [cx, cy] = startPos.value
  const span = 3 + hopLen.value
  const list: { key: string; x: number; y: number; deco: string; trail: boolean }[] = []
  for (let y = cy - span; y <= cy + span; y++) {
    for (let x = cx - span; x <= cx + span; x++) {
      const k = keyOf([x, y])
      const trail = visited.value.has(k) && k !== keyOf(heroPos.value)
      const landed = props.revealed && x === targetPos.value[0] && y === targetPos.value[1]
      list.push({ key: k, x, y, trail, deco: trail || landed ? '' : decoAt(x, y) })
    }
  }
  return list
})

const boardStyle = computed(() => ({
  transform: `translate(${VIEW_W / 2 - CELL / 2 - cam.value[0] * STEP}px, ${VIEW_H / 2 - CELL / 2 - cam.value[1] * STEP}px)`,
}))
const at = (p: Pos) => ({ transform: `translate(${p[0] * STEP}px, ${p[1] * STEP}px)`, width: CELL + 'px', height: CELL + 'px' })

const bumping = ref(false)

function onPress(d: string) {
  if (props.chain) {
    emit('answer', d)
    return
  }
  const [c, r] = stepN(startPos.value, d, hopLen.value)
  if (c < 0 || c > 2 || r < 0 || r > 2) {
    bumping.value = true
    window.setTimeout(() => (bumping.value = false), 450)
    emit('blocked')
    return
  }
  emit('answer', d)
}
</script>

<template>
  <div class="walk">
    <div v-if="chain" class="view" :style="{ width: VIEW_W + 'px', height: VIEW_H + 'px' }">
      <div class="board" :style="boardStyle">
        <div
          v-for="t in tiles"
          :key="t.key"
          class="tile chain-tile"
          :class="{ alt: (t.x + t.y) % 2 !== 0, trail: t.trail }"
          :style="at([t.x, t.y])"
        >
          <span v-if="t.trail" class="paw">🐾</span>
          <span v-else-if="t.deco" class="deco">{{ t.deco }}</span>
        </div>
        <div v-if="revealed" class="pop" :style="at(targetPos)"><span>🥕</span></div>
        <div class="walker" :class="{ far: hopLen > 1 }" :style="at(heroPos)">
          <div :class="{ hop: revealed, 'hop-far': revealed && hopLen > 1 }">
            <HeroSprite :pose="revealed ? 'happy' : 'walk'" :width="58" />
          </div>
        </div>
      </div>
    </div>
    <div v-else class="field" :class="{ 'is-shake': bumping }" :style="{ width: CELL * 3 + GAP * 2 + 'px', height: CELL * 3 + GAP * 2 + 'px' }">
      <div v-for="i in 9" :key="i" class="tile" />
      <div class="walker" :style="at(heroPos)">
        <HeroSprite :pose="revealed ? 'happy' : 'walk'" :width="58" />
      </div>
    </div>
    <p v-if="chain && hopLen > 1" class="len-tip">跳 {{ hopLen }} 格</p>
    <DirectionPad
      compact
      :mode="padMode"
      :correct="correct"
      :highlight="highlight"
      :revealed="revealed"
      :disabled="disabled"
      :wrong-tick="wrongTick"
      @press="onPress"
    >
      <span class="pad-dot">🐾</span>
    </DirectionPad>
  </div>
</template>

<style scoped>
.walk { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.len-tip {
  margin: -4px 0 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--ink-soft);
}
.field {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 0;
}
.tile {
  border-radius: 16px;
  background: #E3F3EC;
  border: 2px dashed #A9D8C6;
}
.walker {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.55s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.walker.far { transition-duration: 0.7s; }
.pad-dot { font-size: 28px; opacity: 0.6; }

.view {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 13%, #000 87%, transparent),
    linear-gradient(transparent, #000 8%, #000 92%, transparent);
  -webkit-mask-composite: source-in;
  mask-image: linear-gradient(90deg, transparent, #000 13%, #000 87%, transparent),
    linear-gradient(transparent, #000 8%, #000 92%, transparent);
  mask-composite: intersect;
}
.board {
  position: absolute;
  left: 0;
  top: 0;
  transition: transform 0.45s ease-in-out;
}
.chain-tile {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 4px 6px;
}
.chain-tile.alt { background: #D6EEE3; }
.chain-tile.trail { background: #FBE3D9; border: 2px solid #F3C3B1; justify-content: center; align-items: center; }
.deco { font-size: 20px; line-height: 1; opacity: 0.9; }
.paw { font-size: 22px; opacity: 0.45; }
.hop { animation: hop 0.5s ease-out; }
.hop-far { animation: hopFar 0.7s ease-out; }
.pop {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 3;
  display: flex;
  justify-content: center;
  pointer-events: none;
}
.pop span {
  font-size: 30px;
  opacity: 0;
  animation: collect 0.8s ease-out 0.35s both;
}
@keyframes hop {
  0% { transform: translateY(0); }
  45% { transform: translateY(-22px) scale(1.05); }
  100% { transform: translateY(0); }
}
@keyframes hopFar {
  0% { transform: translateY(0) scale(1); }
  35% { transform: translateY(-36px) scale(1.12); }
  100% { transform: translateY(0) scale(1); }
}
@keyframes collect {
  0% { opacity: 0; transform: translateY(10px) scale(0.4); }
  35% { opacity: 1; transform: translateY(-14px) scale(1.2); }
  100% { opacity: 0; transform: translateY(-40px) scale(1); }
}
</style>
