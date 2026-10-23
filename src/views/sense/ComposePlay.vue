<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import { COMPOSE_MODES, COMPOSE_UNLOCK_ORDER, type ComposeModeId } from '../../data/sense/meta'
import {
  COMPOSE_PAIRS,
  angleMatch,
  makeDissectRound,
  normAngle,
  outlineClip,
  pairById,
  pieceClip,
  type ComposePair,
  type ComposePairId,
  type DissectQ,
  type PieceKind,
} from '../../data/sense/compose'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { noteWrongAnswer } from '../../composables/useWrongRest'
import { useSpeech } from '../../composables/useSpeech'

interface BoardPiece {
  id: string
  kind: PieceKind
  color: string
  angle: number
  /** pool | slotId */
  place: string
  x: number
  y: number
}

const route = useRoute()
const router = useRouter()
const { completeCompose, isComposeUnlocked } = useSenseProgress()
const { speak } = useSpeech()

const mode = computed(() => route.params.mode as ComposeModeId)
const meta = computed(() => COMPOSE_MODES.find((m) => m.id === mode.value))

const celebrate = ref(false)
const prompt = ref('')

/* —— 图鉴 —— */
const atlasIndex = ref(0)
const splitOn = ref(true)
const demoAngle = ref(0)
const atlasPair = computed(() => COMPOSE_PAIRS[atlasIndex.value])

/* —— 拆一拆 —— */
const dissectQs = ref<DissectQ[]>([])
const qIndex = ref(0)
const wrongStreak = ref(0)
const missedOnce = ref(false)
const locked = ref(false)
const flashChoice = ref<string | null>(null)
const hintChoice = ref<string | null>(null)
const showSplitHint = ref(false)
const currentDissect = computed(() => dissectQs.value[qIndex.value] ?? null)
const dissectPair = computed(() =>
  currentDissect.value ? pairById(currentDissect.value.pairId) : null,
)

/* —— 拼一拼 —— */
const assembleOrder = ref<ComposePairId[]>([])
const assembleIndex = ref(0)
const assemblePair = computed(() =>
  assembleOrder.value[assembleIndex.value]
    ? pairById(assembleOrder.value[assembleIndex.value])
    : null,
)
const pieces = reactive<BoardPiece[]>([])
const selectedId = ref<string | null>(null)
const missedAssemble = ref(false)
const boardEl = ref<HTMLElement | null>(null)
let dragId: string | null = null
let dragOffX = 0
let dragOffY = 0

function markMiss() {
  if (missedOnce.value) return
  missedOnce.value = true
  noteWrongAnswer()
}

function markAssembleMiss() {
  if (missedAssemble.value) return
  missedAssemble.value = true
  noteWrongAnswer()
}

/* —— 图鉴 —— */
function startAtlas() {
  celebrate.value = false
  atlasIndex.value = 0
  splitOn.value = true
  demoAngle.value = 0
  presentAtlas()
}

function presentAtlas() {
  const p = atlasPair.value
  if (!p) return
  prompt.value = p.blurb
  speak(p.speak)
}

function nextAtlas() {
  if (atlasIndex.value >= COMPOSE_PAIRS.length - 1) {
    completeCompose('atlas', 2)
    celebrate.value = true
    speak('太棒了，都看过啦')
    return
  }
  atlasIndex.value++
  splitOn.value = true
  demoAngle.value = 0
  presentAtlas()
}

function rotateDemo(delta: number) {
  demoAngle.value = normAngle(demoAngle.value + delta)
}

/* —— 拆一拆 —— */
function startDissect() {
  celebrate.value = false
  qIndex.value = 0
  dissectQs.value = makeDissectRound()
  presentDissect()
}

function presentDissect() {
  wrongStreak.value = 0
  missedOnce.value = false
  locked.value = false
  flashChoice.value = null
  hintChoice.value = null
  showSplitHint.value = false
  const q = currentDissect.value
  const p = dissectPair.value
  if (!q || !p) return
  prompt.value = `${p.title}能分成什么？`
  speak(prompt.value)
}

function onDissectPick(choice: string) {
  if (locked.value || celebrate.value || !currentDissect.value) return
  const ok = choice === currentDissect.value.answer
  if (!ok) {
    markMiss()
    wrongStreak.value++
    speak('再看一看')
    if (wrongStreak.value >= 1) showSplitHint.value = true
    if (wrongStreak.value >= 2) hintChoice.value = currentDissect.value.answer
    return
  }
  locked.value = true
  flashChoice.value = choice
  speak('对啦')
  window.setTimeout(() => {
    qIndex.value++
    if (qIndex.value >= dissectQs.value.length) {
      completeCompose('dissect', 2)
      celebrate.value = true
      return
    }
    presentDissect()
  }, 550)
}

/* —— 拼一拼 —— */
function buildPieces(pair: ComposePair) {
  pieces.splice(0, pieces.length)
  pair.slots.forEach((s, i) => {
    pieces.push({
      id: `p-${s.id}`,
      kind: s.kind,
      color: pair.pieceColors[i % pair.pieceColors.length],
      angle: 0,
      place: 'pool',
      x: 12 + (i % 4) * 22,
      y: 78 + Math.floor(i / 4) * 12,
    })
  })
}

function startAssemble() {
  celebrate.value = false
  assembleOrder.value = COMPOSE_PAIRS.map((p) => p.id)
  assembleIndex.value = 0
  presentAssemble()
}

function presentAssemble() {
  const pair = assemblePair.value
  if (!pair) return
  missedAssemble.value = false
  selectedId.value = null
  buildPieces(pair)
  prompt.value = `把小块拼成${pair.title}`
  speak(`转一转，拖进轮廓，拼成${pair.title}`)
}

function selectedPiece() {
  return pieces.find((p) => p.id === selectedId.value) ?? null
}

function rotateSelected(delta: number) {
  const p = selectedPiece()
  if (!p) return
  p.angle = normAngle(p.angle + delta)
}

function occupiedSlots(): Set<string> {
  return new Set(pieces.filter((p) => p.place !== 'pool').map((p) => p.place))
}

function trySnap(piece: BoardPiece, clientX: number, clientY: number) {
  const pair = assemblePair.value
  const board = boardEl.value
  if (!pair || !board) return
  const rect = board.getBoundingClientRect()
  const px = ((clientX - rect.left) / rect.width) * 100
  const py = ((clientY - rect.top) / rect.height) * 100
  const thresh = 18
  const taken = occupiedSlots()
  if (piece.place !== 'pool') taken.delete(piece.place)

  let best: { id: string; d: number; x: number; y: number } | null = null
  for (const slot of pair.slots) {
    if (taken.has(slot.id)) continue
    if (slot.kind !== piece.kind) continue
    if (!angleMatch(piece.angle, slot.angles)) continue
    const d = Math.hypot(px - slot.x, py - slot.y)
    if (d < thresh && (!best || d < best.d)) {
      best = { id: slot.id, d, x: slot.x, y: slot.y }
    }
  }

  if (best) {
    piece.place = best.id
    piece.x = best.x
    piece.y = best.y
    speak('放好啦')
    checkAssembleWin()
    return
  }

  // 靠近槽但角度/种类不对 → 记错并回池
  let nearWrong = false
  for (const slot of pair.slots) {
    if (taken.has(slot.id)) continue
    const d = Math.hypot(px - slot.x, py - slot.y)
    if (d < thresh) nearWrong = true
  }
  if (nearWrong) {
    markAssembleMiss()
    speak('再转一转或换个位置')
  }
  piece.place = 'pool'
  piece.x = 12 + (pieces.indexOf(piece) % 4) * 22
  piece.y = 78
}

function checkAssembleWin() {
  const pair = assemblePair.value
  if (!pair) return
  const done = pair.slots.every((s) => pieces.some((p) => p.place === s.id))
  if (!done) return
  speak('拼好啦')
  window.setTimeout(() => {
    assembleIndex.value++
    if (assembleIndex.value >= assembleOrder.value.length) {
      completeCompose('assemble', 2)
      celebrate.value = true
      return
    }
    presentAssemble()
  }, 700)
}

function onPiecePointerDown(piece: BoardPiece, e: PointerEvent) {
  if (celebrate.value) return
  selectedId.value = piece.id
  dragId = piece.id
  const board = boardEl.value
  if (!board) return
  const rect = board.getBoundingClientRect()
  dragOffX = e.clientX - rect.left - (piece.x / 100) * rect.width
  dragOffY = e.clientY - rect.top - (piece.y / 100) * rect.height
  ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  if (!dragId || !boardEl.value) return
  const piece = pieces.find((p) => p.id === dragId)
  if (!piece) return
  const rect = boardEl.value.getBoundingClientRect()
  piece.place = 'pool'
  piece.x = Math.min(92, Math.max(8, ((e.clientX - rect.left - dragOffX) / rect.width) * 100))
  piece.y = Math.min(92, Math.max(8, ((e.clientY - rect.top - dragOffY) / rect.height) * 100))
}

function onPointerUp(e: PointerEvent) {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  if (!dragId) return
  const piece = pieces.find((p) => p.id === dragId)
  dragId = null
  if (piece) trySnap(piece, e.clientX, e.clientY)
}

/* —— 生命周期 —— */
function startMode() {
  if (!isComposeUnlocked(mode.value)) {
    router.replace('/sense/compose')
    return
  }
  if (mode.value === 'atlas') startAtlas()
  else if (mode.value === 'dissect') startDissect()
  else startAssemble()
}

function nextMode() {
  celebrate.value = false
  const i = COMPOSE_UNLOCK_ORDER.indexOf(mode.value)
  if (i >= 0 && i < COMPOSE_UNLOCK_ORDER.length - 1) {
    router.push(`/sense/compose/${COMPOSE_UNLOCK_ORDER[i + 1]}`)
  } else {
    router.push('/sense/compose')
  }
}

onMounted(startMode)
watch(mode, startMode)
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
})

const progressHint = computed(() => {
  if (mode.value === 'atlas') return `${atlasIndex.value + 1} / ${COMPOSE_PAIRS.length}`
  if (mode.value === 'dissect') return `${Math.min(qIndex.value + 1, dissectQs.value.length)} / ${dissectQs.value.length || 4}`
  return `${Math.min(assembleIndex.value + 1, assembleOrder.value.length || 4)} / ${assembleOrder.value.length || 4}`
})

/** 大正方形四宫格：四块色画在同一层，避免 grid 亚像素露缝 */
function quadFaceStyle(pair: ComposePair, dimOthers: number, rot: number) {
  const [a, b, c, d] = pair.pieceColors
  const solid = dimOthers >= 0.99
  const a2 = a
  const b2 = solid ? b : fadeHex(b, dimOthers)
  const c2 = solid ? c : fadeHex(c, dimOthers)
  const d2 = solid ? d : fadeHex(d, dimOthers)
  return {
    backgroundImage: [
      `linear-gradient(${a2}, ${a2})`,
      `linear-gradient(${b2}, ${b2})`,
      `linear-gradient(${c2}, ${c2})`,
      `linear-gradient(${d2}, ${d2})`,
    ].join(', '),
    backgroundSize: '51% 51%, 51% 51%, 51% 51%, 51% 51%',
    backgroundPosition: '0 0, 100% 0, 0 100%, 100% 100%',
    backgroundRepeat: 'no-repeat',
    transform: rot ? `rotate(${rot}deg)` : undefined,
  }
}

function fadeHex(hex: string, alpha: number) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r},${g},${b},${alpha})`
}
</script>

<template>
  <SenseChrome
    :title="meta?.name || '拼图形'"
    :prompt="prompt"
    :hint="progressHint"
    back-to="/sense/compose"
  >
    <!-- 图鉴 -->
    <div v-if="mode === 'atlas' && !celebrate && atlasPair" class="stage">
      <div class="card">
        <div
          class="outline"
          :class="{ tiled: atlasPair.slots.some((s) => s.fillClip) }"
          :style="{
            width: atlasPair.outlineW + 'px',
            height: atlasPair.outlineH + 'px',
            clipPath: outlineClip(atlasPair.outline),
          }"
        >
          <!-- 2×2：单层四色背景，无拼缝 -->
          <div
            v-if="atlasPair.id === 'square4'"
            class="quad-face"
            :style="quadFaceStyle(atlasPair, splitOn ? 1 : 0.28, demoAngle)"
          />
          <!-- 其它：fillClip 分区铺满 -->
          <template v-else-if="atlasPair.slots.some((s) => s.fillClip)">
            <div
              v-for="(s, i) in atlasPair.slots"
              :key="s.id"
              class="slot-fill"
              :style="{
                clipPath: s.fillClip,
                background: atlasPair.pieceColors[i % atlasPair.pieceColors.length],
                opacity: splitOn ? 1 : i === 0 ? 1 : 0.28,
                transform: i === 0 && demoAngle ? `rotate(${demoAngle}deg)` : undefined,
                transformOrigin: `${s.x}% ${s.y}%`,
              }"
            />
          </template>
          <template v-else>
            <div
              v-for="(s, i) in atlasPair.slots"
              :key="s.id"
              class="slot-piece"
              :style="{
                left: s.x + '%',
                top: s.y + '%',
                width: s.w + 'px',
                height: s.h + 'px',
                background: atlasPair.pieceColors[i % atlasPair.pieceColors.length],
                clipPath: pieceClip(s.kind, i === 0 ? demoAngle : s.angles[0]),
                transform: `translate(-50%, -50%) rotate(${s.kind === 'eqtri' ? 0 : i === 0 ? demoAngle : s.angles[0]}deg)`,
                opacity: splitOn ? 1 : i === 0 ? 1 : 0.35,
              }"
            />
          </template>
        </div>
        <p class="big-name">{{ atlasPair.title }}</p>
        <p class="sub">{{ atlasPair.blurb }}</p>
      </div>
      <div class="toolbar">
        <button type="button" class="hot tool" @click="splitOn = !splitOn">
          {{ splitOn ? '合上' : '拆开' }}
        </button>
        <button type="button" class="hot tool" @click="rotateDemo(45)">45°</button>
        <button type="button" class="hot tool" @click="rotateDemo(90)">90°</button>
        <button type="button" class="hot tool" @click="rotateDemo(180)">180°</button>
      </div>
      <button type="button" class="hot btn-primary next" @click="nextAtlas">
        {{ atlasIndex >= COMPOSE_PAIRS.length - 1 ? '看完啦 ▶' : '下一张 ▶' }}
      </button>
    </div>

    <!-- 拆一拆 -->
    <div v-else-if="mode === 'dissect' && !celebrate && dissectPair && currentDissect" class="stage">
      <div class="card quiz">
        <div
          class="outline"
          :class="{ tiled: showSplitHint && dissectPair.slots.some((s) => s.fillClip) }"
          :style="{
            width: dissectPair.outlineW + 'px',
            height: dissectPair.outlineH + 'px',
            clipPath: outlineClip(dissectPair.outline),
            background: showSplitHint ? 'transparent' : '#b8c4d0',
          }"
        >
          <template v-if="showSplitHint">
            <div
              v-if="dissectPair.id === 'square4'"
              class="quad-face"
              :style="quadFaceStyle(dissectPair, 1, 0)"
            />
            <template v-else-if="dissectPair.slots.some((s) => s.fillClip)">
              <div
                v-for="(s, i) in dissectPair.slots"
                :key="s.id"
                class="slot-fill"
                :style="{
                  clipPath: s.fillClip,
                  background: dissectPair.pieceColors[i % dissectPair.pieceColors.length],
                }"
              />
            </template>
            <template v-else>
              <div
                v-for="(s, i) in dissectPair.slots"
                :key="s.id"
                class="slot-piece"
                :style="{
                  left: s.x + '%',
                  top: s.y + '%',
                  width: s.w + 'px',
                  height: s.h + 'px',
                  background: dissectPair.pieceColors[i % dissectPair.pieceColors.length],
                  clipPath: pieceClip(s.kind, s.angles[0]),
                  transform: `translate(-50%, -50%) rotate(${s.kind === 'eqtri' ? 0 : s.angles[0]}deg)`,
                }"
              />
            </template>
          </template>
        </div>
      </div>
      <div class="choices">
        <button
          v-for="c in currentDissect.choices"
          :key="c"
          type="button"
          class="hot choice"
          :class="{ ok: flashChoice === c, hint: hintChoice === c }"
          :disabled="locked"
          @click="onDissectPick(c)"
        >
          {{ c }}
        </button>
      </div>
    </div>

    <!-- 拼一拼 -->
    <div v-else-if="mode === 'assemble' && !celebrate && assemblePair" class="stage assemble">
      <div ref="boardEl" class="board">
        <div
          class="target"
          :style="{
            width: assemblePair.outlineW + 'px',
            height: assemblePair.outlineH + 'px',
            clipPath: outlineClip(assemblePair.outline),
          }"
        />
        <div
          v-for="s in assemblePair.slots"
          :key="'slot-' + s.id"
          class="slot-mark"
          :style="{ left: s.x + '%', top: s.y + '%', width: s.w + 'px', height: s.h + 'px' }"
        />
        <div
          v-for="p in pieces"
          :key="p.id"
          class="piece"
          :class="{ sel: selectedId === p.id }"
          :style="{
            left: p.x + '%',
            top: p.y + '%',
            width: '72px',
            height: '72px',
            background: p.color,
            clipPath: pieceClip(p.kind, p.angle),
            transform: `translate(-50%, -50%) rotate(${p.kind === 'eqtri' ? 0 : p.angle}deg)`,
          }"
          @pointerdown="onPiecePointerDown(p, $event)"
        />
      </div>
      <div v-if="selectedId" class="toolbar">
        <button type="button" class="hot tool" @click="rotateSelected(45)">45°</button>
        <button type="button" class="hot tool" @click="rotateSelected(90)">90°</button>
        <button type="button" class="hot tool" @click="rotateSelected(180)">180°</button>
      </div>
      <p v-else class="hint-line">点选小块后可以旋转</p>
    </div>

    <Celebrate
      :show="celebrate"
      @next="nextMode"
      @again="startMode"
      @home="router.push('/sense/compose')"
    />
  </SenseChrome>
</template>

<style scoped>
.stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 8px 12px 16px;
}
.card {
  width: min(320px, 90vw);
  min-height: 260px;
  border-radius: 28px;
  background: #fff;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
}
.card.quiz { min-height: 220px; }
.outline {
  position: relative;
  background: #c5d0dc;
  box-shadow: inset 0 0 0 2px rgba(92, 75, 81, 0.12);
}
.outline.tiled {
  background: transparent;
  box-shadow: none;
  outline: 2px solid rgba(92, 75, 81, 0.18);
  outline-offset: -2px;
}
.quad-face {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.slot-fill {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.slot-piece {
  position: absolute;
  pointer-events: none;
}
.big-name { margin: 0; font-size: 32px; font-weight: 900; }
.sub { margin: 0; font-size: 15px; font-weight: 700; color: var(--ink-soft); text-align: center; }
.toolbar { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.tool {
  background: var(--card);
  box-shadow: var(--shadow);
  font-size: 16px;
  font-weight: 900;
  min-width: 64px;
  min-height: 52px;
  padding: 0 12px;
}
.next { min-width: 180px; }
.choices {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  width: min(360px, 100%);
}
.choice {
  background: var(--card);
  box-shadow: var(--shadow);
  font-size: 17px;
  font-weight: 900;
  min-height: 56px;
  padding: 8px 12px;
}
.choice.ok { background: var(--mint); color: #fff; }
.choice.hint { outline: 3px solid var(--accent); }
.assemble { width: 100%; }
.board {
  position: relative;
  width: min(360px, 92vw);
  height: 360px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: var(--shadow);
  touch-action: none;
  overflow: hidden;
}
.target {
  position: absolute;
  left: 50%;
  top: 42%;
  transform: translate(-50%, -50%);
  background: rgba(168, 184, 200, 0.35);
  box-shadow: inset 0 0 0 3px rgba(92, 75, 81, 0.2);
  pointer-events: none;
}
.slot-mark {
  position: absolute;
  transform: translate(-50%, -50%);
  border: 2px dashed rgba(92, 75, 81, 0.2);
  border-radius: 8px;
  pointer-events: none;
}
.piece {
  position: absolute;
  z-index: 2;
  cursor: grab;
  touch-action: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}
.piece.sel { outline: 3px solid var(--accent); z-index: 3; }
.hint-line {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink-soft);
}
</style>
