<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import CountItem from '../../components/sense/CountItem.vue'
import { EXTRA_MODES } from '../../data/sense/meta'
import { COLORS, SHAPES, type ColorId, type ShapeId } from '../../data/sense/attr'
import { shapeClip } from '../../data/sense/extra'
import { pick, randInt, shuffle } from '../../data/sense/util'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { unlockSenseSticker } from '../../composables/useSenseStickers'
import { noteWrongAnswer } from '../../composables/useWrongRest'
import { useSpeech } from '../../composables/useSpeech'

type Kind = 'qty' | 'color' | 'shape'

interface Cell {
  id: number
  odd: boolean
  qty?: number
  color?: ColorId
  shape?: ShapeId
}

interface Q {
  kind: Kind
  cells: Cell[]
  answer: number
}

const NEED = 6
const router = useRouter()
const { completeExtra } = useSenseProgress()
const { speak } = useSpeech()
const meta = EXTRA_MODES.find((m) => m.id === 'oddOne')!

const quiz = ref<Q[]>([])
const qIndex = ref(0)
const celebrate = ref(false)
const locked = ref(false)
const flash = ref<number | null>(null)
const hint = ref<number | null>(null)
const missedOnce = ref(false)

const current = computed(() => quiz.value[qIndex.value] ?? null)

function makeQty(): Q {
  const same = randInt(2, 4)
  let odd = same + (Math.random() < 0.5 ? 1 : -1)
  if (odd < 1) odd = same + 1
  if (odd > 6) odd = same - 1
  const oddPos = randInt(0, 3)
  const cells: Cell[] = [0, 1, 2, 3].map((i) => ({
    id: i,
    odd: i === oddPos,
    qty: i === oddPos ? odd : same,
  }))
  return { kind: 'qty', cells: shuffle(cells), answer: oddPos }
}

function makeColor(): Q {
  const base = pick(COLORS).id
  let oddC = pick(COLORS).id
  while (oddC === base) oddC = pick(COLORS).id
  const oddPos = randInt(0, 3)
  const cells: Cell[] = [0, 1, 2, 3].map((i) => ({
    id: i,
    odd: i === oddPos,
    color: i === oddPos ? oddC : base,
    shape: 'circle' as ShapeId,
  }))
  return { kind: 'color', cells: shuffle(cells), answer: oddPos }
}

function makeShape(): Q {
  const base = pick(SHAPES).id
  let oddS = pick(SHAPES).id
  while (oddS === base) oddS = pick(SHAPES).id
  const oddPos = randInt(0, 3)
  const fill = '#6b8cae'
  const cells: Cell[] = [0, 1, 2, 3].map((i) => ({
    id: i,
    odd: i === oddPos,
    shape: i === oddPos ? oddS : base,
    color: undefined,
    qty: undefined,
  }))
  void fill
  return { kind: 'shape', cells: shuffle(cells), answer: oddPos }
}

function start() {
  const makers = [makeQty, makeColor, makeShape]
  quiz.value = shuffle([0, 1, 2, 3, 4, 5]).map((i) => makers[i % 3]())
  // fix answer indices after shuffle of cells — recompute by odd flag
  quiz.value = quiz.value.map((q) => ({
    ...q,
    answer: q.cells.findIndex((c) => c.odd),
  }))
  qIndex.value = 0
  celebrate.value = false
  locked.value = false
  flash.value = null
  hint.value = null
  missedOnce.value = false
  speak('谁不一样？点出来')
}

function onPick(i: number) {
  const q = current.value
  if (!q || locked.value || celebrate.value) return
  if (q.cells[i]?.odd) {
    locked.value = true
    flash.value = i
    speak('对啦')
    window.setTimeout(() => {
      flash.value = null
      missedOnce.value = false
      if (qIndex.value >= NEED - 1) {
        completeExtra('oddOne', 2)
        unlockSenseSticker('oddOne')
        celebrate.value = true
        locked.value = false
        return
      }
      qIndex.value++
      locked.value = false
      hint.value = null
      speak('再找一个')
    }, 480)
    return
  }
  if (!missedOnce.value) {
    missedOnce.value = true
    noteWrongAnswer()
  }
  hint.value = q.answer
  speak('再看一看')
}

onMounted(start)
</script>

<template>
  <SenseChrome
    :title="meta.name"
    prompt="谁不一样？"
    :hint="current ? `${qIndex + 1} / ${NEED}` : undefined"
    back-to="/sense/recognize"
  >
    <div v-if="current && !celebrate" class="grid">
      <button
        v-for="(c, i) in current.cells"
        :key="c.id + '-' + i"
        type="button"
        class="cell"
        :class="{ ok: flash === i, hint: hint === i }"
        :disabled="locked"
        @click="onPick(i)"
      >
        <div v-if="current.kind === 'qty'" class="apples">
          <CountItem v-for="n in c.qty" :key="n" skin="apple" :size="36" :interactive="false" />
        </div>
        <div
          v-else-if="current.kind === 'color'"
          class="swatch"
          :class="{ light: c.color === 'white' }"
          :style="{ background: COLORS.find((x) => x.id === c.color)?.hex }"
        />
        <div
          v-else
          class="glyph"
          :style="{ background: '#6b8cae', clipPath: shapeClip(c.shape!) }"
        />
      </button>
    </div>
    <Celebrate
      :show="celebrate"
      title="火眼金睛！"
      again-label="再玩一轮"
      @again="start"
      @next="router.push('/sense/recognize')"
      @home="router.push('/sense/recognize')"
    />
  </SenseChrome>
</template>

<style scoped>
.grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 12px 14px 20px;
  align-content: center;
}
.cell {
  min-height: 140px;
  border: 3px solid transparent;
  border-radius: 22px;
  background: var(--card);
  box-shadow: var(--shadow);
  display: grid;
  place-items: center;
  padding: 10px;
}
.cell.ok { border-color: #3c9a7b; background: #e8f7f1; }
.cell.hint { border-color: #f0a86a; box-shadow: 0 0 0 4px rgba(240, 168, 106, 0.3), var(--shadow); }
.apples { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; }
.swatch { width: 72px; height: 72px; border-radius: 50%; }
.swatch.light { border: 3px solid #ccc; }
.glyph { width: 80px; height: 80px; }
</style>
