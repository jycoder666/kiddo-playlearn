<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import { COLORS, SHAPES, type ShapeId } from '../../data/sense/attr'
import { MEMORY_MODES, type MemoryModeId } from '../../data/sense/meta'
import { pick, shuffle } from '../../data/sense/util'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { useSpeech } from '../../composables/useSpeech'

interface Card {
  id: string
  pairId: string | number
  kind: 'digit' | 'qty' | 'color' | 'shape'
  n?: number
  hex?: string
  name?: string
  faceUp: boolean
  matched: boolean
  pulse: boolean
}

const POOL = [1, 2, 3, 4, 5] as const
const MISMATCH_MS = 700
const LIGHT_COLORS = new Set(['white', 'yellow', 'pink', 'gray', 'cyan'])
const LIGHT_HEX = new Set(['#f7f4ef', '#f0c14a', '#f0a0c0', '#9aa0a6', '#3db8b0'])

const route = useRoute()
const router = useRouter()
const { completeMemory } = useSenseProgress()
const { speak } = useSpeech()

const modeId = computed<MemoryModeId>(() => {
  const s = String(route.params.slug)
  if (s === 'color-pair') return 'colorPair'
  if (s === 'shape-pair') return 'shapePair'
  return 'numPair'
})
const isColor = computed(() => modeId.value === 'colorPair')
const isShape = computed(() => modeId.value === 'shapePair')
const meta = computed(() => MEMORY_MODES.find((m) => m.id === modeId.value)!)

const round = ref(1)
const cards = ref<Card[]>([])
const openIds = ref<string[]>([])
const busy = ref(false)
const celebrate = ref(false)
const bridge = ref(false)
const prompt = ref('')

let flipTimer: ReturnType<typeof setTimeout> | null = null
let bridgeTimer: ReturnType<typeof setTimeout> | null = null

const hint = computed(() =>
  round.value === 1 ? '第一局 · 3 对' : '第二局 · 4 对',
)

function shapeClip(id: ShapeId): string {
  switch (id) {
    case 'circle':
      return 'circle(50% at 50% 50%)'
    case 'ellipse':
      return 'ellipse(50% 38% at 50% 50%)'
    case 'square':
      return 'inset(12% 12% 12% 12%)'
    case 'rect':
      return 'inset(22% 6% 22% 6%)'
    case 'triangle':
      return 'polygon(50% 8%, 92% 88%, 8% 88%)'
    case 'diamond':
      return 'polygon(50% 6%, 92% 50%, 50% 94%, 8% 50%)'
    case 'trapezoid':
      return 'polygon(22% 18%, 78% 18%, 94% 82%, 6% 82%)'
    case 'star':
      return 'polygon(50% 4%, 61% 38%, 96% 38%, 68% 58%, 79% 92%, 50% 72%, 21% 92%, 32% 58%, 4% 38%, 39% 38%)'
    default:
      return 'circle(50% at 50% 50%)'
  }
}

function clearTimers() {
  if (flipTimer) {
    clearTimeout(flipTimer)
    flipTimer = null
  }
  if (bridgeTimer) {
    clearTimeout(bridgeTimer)
    bridgeTimer = null
  }
}

function pickNs(count: number): number[] {
  return shuffle([...POOL]).slice(0, count)
}

function deal(pairCount: number) {
  clearTimers()
  busy.value = false
  openIds.value = []
  bridge.value = false
  const list: Card[] = []

  if (isShape.value) {
    const sameColor = round.value === 1
    const picked = shuffle([...SHAPES]).slice(0, pairCount)
    for (const sh of picked) {
      const hexA = pick(COLORS).hex
      const hexB = sameColor
        ? hexA
        : pick(COLORS.filter((c) => c.hex !== hexA)).hex
      ;[hexA, hexB].forEach((hex, i) => {
        list.push({
          id: `s-${sh.id}-${i}-${pairCount}`,
          pairId: sh.id,
          kind: 'shape',
          hex,
          name: sh.name,
          faceUp: false,
          matched: false,
          pulse: false,
        })
      })
    }
    prompt.value = sameColor
      ? '翻两张，找出一样的图形'
      : '再来难一点：颜色不同也要找同形'
  } else if (isColor.value) {
    const picked = shuffle([...COLORS]).slice(0, pairCount)
    for (const c of picked) {
      for (const copy of [0, 1] as const) {
        list.push({
          id: `c-${c.id}-${copy}-${pairCount}`,
          pairId: c.id,
          kind: 'color',
          hex: c.hex,
          name: c.name,
          faceUp: false,
          matched: false,
          pulse: false,
        })
      }
    }
    prompt.value =
      pairCount === 3
        ? '翻两张，找出一样的颜色'
        : '再来难一点：找相同颜色'
  } else {
    const ns = pickNs(pairCount)
    for (const n of ns) {
      list.push({
        id: `d-${n}-${pairCount}`,
        pairId: n,
        kind: 'digit',
        n,
        faceUp: false,
        matched: false,
        pulse: false,
      })
      list.push({
        id: `q-${n}-${pairCount}`,
        pairId: n,
        kind: 'qty',
        n,
        faceUp: false,
        matched: false,
        pulse: false,
      })
    }
    prompt.value =
      pairCount === 3
        ? '翻两张，让数字和苹果一样多'
        : '再来难一点：翻两张配对'
  }

  cards.value = shuffle(list)
  speak(prompt.value)
}

function allMatched(): boolean {
  return cards.value.length > 0 && cards.value.every((c) => c.matched)
}

function isMatch(a: Card, b: Card): boolean {
  if (a.pairId !== b.pairId || a.id === b.id) return false
  if (isShape.value) return a.kind === 'shape' && b.kind === 'shape'
  if (isColor.value) return a.kind === 'color' && b.kind === 'color'
  return a.kind !== b.kind
}

function faceLabel(c: Card): string {
  if (!(c.faceUp || c.matched)) return '牌背面，点开'
  if (c.kind === 'digit') return `数字 ${c.n}`
  if (c.kind === 'qty') return `${c.n} 个苹果`
  if (c.kind === 'shape') return c.name || '图形'
  return c.name || '颜色'
}

function matchSpeak(a: Card): string {
  if (isShape.value || isColor.value) return a.name || ''
  return String(a.n)
}

function onCardClick(card: Card) {
  if (busy.value || celebrate.value || bridge.value) return
  if (card.matched || card.faceUp) return
  if (openIds.value.length >= 2) return

  card.faceUp = true
  openIds.value = [...openIds.value, card.id]

  if (openIds.value.length < 2) return

  busy.value = true
  const [aId, bId] = openIds.value
  const a = cards.value.find((c) => c.id === aId)!
  const b = cards.value.find((c) => c.id === bId)!

  if (isMatch(a, b)) {
    a.matched = true
    b.matched = true
    a.pulse = true
    b.pulse = true
    speak(matchSpeak(a))
    flipTimer = setTimeout(() => {
      a.pulse = false
      b.pulse = false
      openIds.value = []
      busy.value = false
      if (allMatched()) onRoundClear()
    }, 420)
    return
  }

  speak('再试试')
  flipTimer = setTimeout(() => {
    a.faceUp = false
    b.faceUp = false
    openIds.value = []
    busy.value = false
  }, MISMATCH_MS)
}

function onRoundClear() {
  if (round.value === 1) {
    bridge.value = true
    prompt.value = '再来难一点'
    speak('再来难一点')
    bridgeTimer = setTimeout(() => {
      round.value = 2
      deal(4)
    }, 1100)
    return
  }
  completeMemory(modeId.value, 2)
  celebrate.value = true
  speak('太棒了')
}

function playAgain() {
  celebrate.value = false
  round.value = 1
  deal(3)
}

function goHome() {
  router.push('/sense/recognize')
}

function resetForMode() {
  celebrate.value = false
  bridge.value = false
  round.value = 1
  deal(3)
}

function isLightFill(c: Card): boolean {
  if (c.kind === 'color') return LIGHT_COLORS.has(String(c.pairId))
  if (c.kind === 'shape' && c.hex) return LIGHT_HEX.has(c.hex)
  return false
}

watch(modeId, () => resetForMode())

onMounted(() => deal(3))
onUnmounted(() => clearTimers())
</script>

<template>
  <SenseChrome
    :title="meta.name"
    :prompt="prompt"
    :hint="hint"
    back-to="/sense/recognize"
  >
    <div class="board" :class="{ bridge }">
      <p v-if="bridge" class="bridge-msg" aria-live="polite">再来难一点</p>
      <div
        class="grid"
        :class="cards.length <= 6 ? 'cols-3' : 'cols-4'"
      >
        <button
          v-for="(c, i) in cards"
          :key="c.id"
          type="button"
          class="flip hot"
          :class="{
            up: c.faceUp || c.matched,
            matched: c.matched,
            pulse: c.pulse,
          }"
          :style="{ '--i': i }"
          :disabled="c.matched || busy"
          :aria-label="faceLabel(c)"
          @click="onCardClick(c)"
        >
          <span class="inner">
            <span class="face back" aria-hidden="true">★</span>
            <span
              class="face front"
              :class="{ colorFront: c.kind === 'color' }"
            >
              <span v-if="c.kind === 'digit'" class="digit">{{ c.n }}</span>
              <span v-else-if="c.kind === 'qty'" class="qty" :aria-hidden="true">
                <span v-for="k in c.n" :key="k" class="apple">🍎</span>
              </span>
              <span v-else-if="c.kind === 'shape'" class="shape-face">
                <span
                  class="shape-glyph"
                  :class="{ light: isLightFill(c) }"
                  :style="{
                    background: c.hex,
                    clipPath: shapeClip(c.pairId as ShapeId),
                  }"
                  aria-hidden="true"
                />
                <span class="shape-name">{{ c.name }}</span>
              </span>
              <span
                v-else
                class="swatch"
                :class="{ light: isLightFill(c) }"
                :style="{ background: c.hex }"
                aria-hidden="true"
              />
            </span>
          </span>
        </button>
      </div>
    </div>

    <Celebrate
      :show="celebrate"
      title="配对高手！"
      @next="goHome"
      @again="playAgain"
      @home="goHome"
    />
  </SenseChrome>
</template>

<style scoped>
.board {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 10px 16px;
  min-height: 0;
}
.bridge-msg {
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 900;
  color: var(--mint);
  animation: softIn 0.4s ease;
}
.grid {
  display: grid;
  gap: 12px;
  width: 100%;
  max-width: 420px;
}
.grid.cols-3 {
  grid-template-columns: repeat(3, 1fr);
}
.grid.cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

.flip {
  aspect-ratio: 3 / 4;
  padding: 0;
  border: none;
  background: transparent;
  perspective: 800px;
  min-height: 88px;
  animation: dealIn 0.35s ease both;
  animation-delay: calc(var(--i, 0) * 40ms);
}
.inner {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
}
.flip.up .inner {
  transform: rotateY(180deg);
}
.face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow);
}
.back {
  background: linear-gradient(145deg, #7eb8d9, #5a9bc4);
  color: #fff;
  font-size: 28px;
  font-weight: 900;
}
.front {
  background: var(--card);
  transform: rotateY(180deg);
}
.front.colorFront {
  background: transparent;
  padding: 0;
  overflow: hidden;
}
.digit {
  font-size: clamp(32px, 10vw, 48px);
  font-weight: 900;
  color: var(--ink);
  line-height: 1;
}
.qty {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  justify-content: center;
  align-items: center;
  padding: 6px;
  max-width: 100%;
}
.apple {
  font-size: clamp(14px, 4.2vw, 20px);
  line-height: 1;
}
.swatch {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 18px;
}
.swatch.light,
.shape-glyph.light {
  box-shadow: inset 0 0 0 2px rgba(92, 75, 81, 0.28);
}
.shape-face {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 4px;
  width: 100%;
  height: 100%;
}
.shape-glyph {
  display: block;
  width: clamp(40px, 12vw, 56px);
  height: clamp(40px, 12vw, 56px);
  flex-shrink: 0;
}
.shape-name {
  font-size: clamp(12px, 3.2vw, 15px);
  font-weight: 900;
  color: var(--ink);
  line-height: 1.1;
  text-align: center;
}

.flip.matched .front {
  outline: 3px solid var(--mint);
  outline-offset: -3px;
}
.flip.pulse .inner {
  animation: pairPulse 0.4s ease;
}

@keyframes pairPulse {
  0% {
    transform: rotateY(180deg) scale(1);
  }
  45% {
    transform: rotateY(180deg) scale(1.06);
  }
  100% {
    transform: rotateY(180deg) scale(1);
  }
}
@keyframes dealIn {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes softIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .inner {
    transition: opacity 200ms ease;
    transform: none !important;
  }
  .flip.up .inner {
    transform: none !important;
  }
  .back {
    opacity: 1;
  }
  .flip.up .back {
    opacity: 0;
    pointer-events: none;
  }
  .front {
    transform: none;
    opacity: 0;
  }
  .flip.up .front {
    opacity: 1;
  }
  .flip.pulse .inner,
  .flip,
  .bridge-msg {
    animation: none;
  }
}
</style>
