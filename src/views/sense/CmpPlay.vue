<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import { CMP_MODES, CMP_UNLOCK_ORDER, type CmpModeId } from '../../data/sense/meta'
import { pick, randInt, shuffle } from '../../data/sense/util'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { noteWrongAnswer } from '../../composables/useWrongRest'
import { useSpeech } from '../../composables/useSpeech'

type Dim = 'size' | 'length' | 'height'
type Ask = 'max' | 'min' | 'same'

interface Opt {
  id: number
  /** 相对量级 1～3，越大表示更大/更长/更高 */
  rank: number
  color: string
  /** 比大小：实际边长 px（随题序缩小差距） */
  px?: number
}

const COLORS = ['#ff8a7a', '#7bc47f', '#6bb3e0', '#f0c14a', '#c9a0dc']

const route = useRoute()
const router = useRouter()
const { completeCmp, isCmpUnlocked } = useSenseProgress()
const { speak } = useSpeech()

const mode = computed(() => route.params.mode as CmpModeId)
const meta = computed(() => CMP_MODES.find((m) => m.id === mode.value))

const prompt = ref('')
const celebrate = ref(false)
const wrongStreak = ref(0)
const missedOnce = ref(false)
const qIndex = ref(0)
const qTotal = computed(() => (mode.value === 'challenge' ? 5 : 4))
const dim = ref<Dim>('size')
const ask = ref<Ask>('max')
const opts = ref<Opt[]>([])
const flashId = ref<number | null>(null)
const hintId = ref<number | null>(null)
const locked = ref(false)

const playDim = computed<Dim>(() => (mode.value === 'challenge' ? dim.value : (mode.value as Dim)))

function markMiss() {
  if (missedOnce.value) return
  missedOnce.value = true
  noteWrongAnswer()
}

function correctIds(): number[] {
  const ranks = opts.value.map((o) => o.rank)
  if (ask.value === 'same') {
    const counts = new Map<number, number>()
    for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1)
    let twin = -1
    for (const [r, c] of counts) {
      if (c >= 2) twin = r
    }
    return opts.value.filter((o) => o.rank === twin).map((o) => o.id)
  }
  const target =
    ask.value === 'max' ? Math.max(...ranks) : Math.min(...ranks)
  return opts.value.filter((o) => o.rank === target).map((o) => o.id)
}

/** 比大小：第 0 题差距最大，之后逐步收窄 */
function sizePairByStep(step: number): { lo: number; hi: number } {
  const table = [
    { lo: 48, hi: 150 },
    { lo: 60, hi: 130 },
    { lo: 74, hi: 118 },
    { lo: 86, hi: 108 },
    { lo: 90, hi: 104 },
  ]
  return table[Math.min(Math.max(0, step), table.length - 1)]
}

function buildRound(force?: Dim) {
  wrongStreak.value = 0
  missedOnce.value = false
  flashId.value = null
  hintId.value = null
  locked.value = false

  const d: Dim =
    force ??
    (mode.value === 'challenge' ? pick(['size', 'length', 'height'] as Dim[]) : (mode.value as Dim))
  dim.value = d

  // 比大小前两题尽量不做「一样大」，先练明显差距
  const wantSame =
    d === 'size' ? qIndex.value >= 2 && Math.random() < 0.35 : Math.random() < 0.28

  if (wantSame) {
    ask.value = 'same'
    const r = randInt(1, 2)
    const n = d === 'length' && Math.random() < 0.5 ? 3 : 2
    const list: Opt[] = []
    for (let i = 0; i < n; i++) {
      list.push({
        id: i + 1,
        rank: i === n - 1 && n === 3 ? (r === 1 ? 2 : 1) : r,
        color: COLORS[(i + randInt(0, 4)) % COLORS.length],
      })
    }
    list[0].rank = r
    list[1].rank = r
    if (n === 3) list[2].rank = r === 1 ? 3 : 1
    if (d === 'size') {
      const { lo, hi } = sizePairByStep(qIndex.value)
      const mid = Math.round((lo + hi) / 2)
      // 一样大：两枚同尺寸；若有第三者则略偏一档（仍比「比大小」主线更易辨）
      const odd = Math.round(mid + (hi - lo) * 0.35)
      list.forEach((o) => {
        o.px = o.rank === r ? mid : odd
      })
    }
    opts.value = shuffle(list)
    const word = d === 'size' ? '大' : d === 'length' ? '长' : '高'
    prompt.value = d === 'height' ? '找出一样高的' : `找出一样${word}的`
  } else {
    ask.value = d === 'height' && Math.random() < 0.45 ? 'min' : 'max'
    if (d === 'size') {
      ask.value = Math.random() < 0.35 ? 'min' : 'max'
      const { lo, hi } = sizePairByStep(qIndex.value)
      const pair = shuffle([
        { rank: 1, px: lo },
        { rank: 3, px: hi },
      ])
      opts.value = pair.map((p, i) => ({
        id: i + 1,
        rank: p.rank,
        px: p.px,
        color: COLORS[(i + randInt(0, 4)) % COLORS.length],
      }))
      prompt.value = ask.value === 'max' ? '哪个更大？' : '哪个更小？'
    } else {
      const n = d === 'length' && Math.random() < 0.55 ? 3 : 2
      const ranks = n === 2 ? shuffle([1, 3]) : shuffle([1, 2, 3])
      opts.value = ranks.map((rank, i) => ({
        id: i + 1,
        rank,
        color: COLORS[(i + randInt(0, 4)) % COLORS.length],
      }))
      if (d === 'length') prompt.value = ask.value === 'max' ? '哪根更长？' : '哪根更短？'
      else prompt.value = ask.value === 'max' ? '谁更高？' : '谁更矮？'
    }
  }
  speak(prompt.value)
}

function startMode() {
  if (!isCmpUnlocked(mode.value)) {
    router.replace('/sense/compare')
    return
  }
  qIndex.value = 0
  celebrate.value = false
  buildRound()
}

onMounted(startMode)
watch(mode, startMode)

function onPick(id: number) {
  if (locked.value || celebrate.value) return
  const ok = correctIds().includes(id)
  if (!ok) {
    markMiss()
    wrongStreak.value++
    speak(ask.value === 'same' ? '再找找哪两个一样' : '再看一看')
    if (wrongStreak.value >= 2) {
      hintId.value = correctIds()[0] ?? null
    }
    return
  }
  locked.value = true
  flashId.value = id
  speak('对啦')
  window.setTimeout(() => {
    qIndex.value++
    if (qIndex.value >= qTotal.value) {
      completeCmp(mode.value, mode.value === 'challenge' ? 3 : 2)
      celebrate.value = true
      return
    }
    buildRound()
  }, 550)
}

function nextMode() {
  celebrate.value = false
  const i = CMP_UNLOCK_ORDER.indexOf(mode.value)
  if (i >= 0 && i < CMP_UNLOCK_ORDER.length - 1) {
    router.push(`/sense/compare/${CMP_UNLOCK_ORDER[i + 1]}`)
  } else {
    router.push('/sense/compare')
  }
}

function sizePx(o: Opt) {
  if (o.px != null) return o.px
  return 48 + o.rank * 28
}

function barWidth(rank: number) {
  return 28 + rank * 22
}

function colHeight(rank: number) {
  return 56 + rank * 36
}
</script>

<template>
  <SenseChrome
    :title="meta?.name || '比一比'"
    :prompt="prompt"
    back-to="/sense/compare"
  >
    <!-- 比大小：圆点 / 方块 -->
    <div v-if="playDim === 'size'" class="stage size">
      <button
        v-for="o in opts"
        :key="o.id"
        type="button"
        class="hot choice blob"
        :class="{ flash: flashId === o.id, hint: hintId === o.id }"
        :style="{
          width: sizePx(o) + 'px',
          height: sizePx(o) + 'px',
          background: o.color,
        }"
        :aria-label="`选项${o.id}`"
        @click="onPick(o.id)"
      />
    </div>

    <!-- 比长短：横条 -->
    <div v-else-if="playDim === 'length'" class="stage length">
      <button
        v-for="o in opts"
        :key="o.id"
        type="button"
        class="hot choice bar"
        :class="{ flash: flashId === o.id, hint: hintId === o.id }"
        :style="{ width: barWidth(o.rank) + '%', background: o.color }"
        :aria-label="`选项${o.id}`"
        @click="onPick(o.id)"
      />
    </div>

    <!-- 比高低：立柱 -->
    <div v-else class="stage height">
      <div class="floor">
        <button
          v-for="o in opts"
          :key="o.id"
          type="button"
          class="hot choice col"
          :class="{ flash: flashId === o.id, hint: hintId === o.id }"
          :style="{ height: colHeight(o.rank) + 'px', background: o.color }"
          :aria-label="`选项${o.id}`"
          @click="onPick(o.id)"
        />
      </div>
    </div>

    <p class="prog">第 {{ Math.min(qIndex + 1, qTotal) }} / {{ qTotal }} 题</p>

    <Celebrate
      :show="celebrate"
      :sticker="mode === 'challenge'"
      @next="nextMode"
      @again="startMode"
      @home="router.push('/sense/compare')"
    />
  </SenseChrome>
</template>

<style scoped>
.stage {
  margin: 16px 12px;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 20px 12px;
  background: rgba(255, 255, 255, 0.55);
  border-radius: 24px;
}
.stage.length {
  flex-direction: column;
  align-items: flex-start;
  gap: 18px;
  padding: 28px 16px;
}
.stage.height {
  align-items: flex-end;
}
.floor {
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 28px;
  min-height: 200px;
  border-bottom: 4px solid rgba(92, 75, 81, 0.15);
  padding-bottom: 4px;
}
.choice {
  border: 4px solid transparent;
  box-shadow: var(--shadow);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}
.blob { border-radius: 50%; }
.bar {
  height: 36px;
  border-radius: 18px;
  min-width: 48px;
}
.col {
  width: 64px;
  border-radius: 16px 16px 8px 8px;
  min-height: 48px;
}
.choice.flash {
  animation: pop 0.45s ease;
  border-color: #7bc47f;
  box-shadow: 0 0 0 6px rgba(123, 196, 127, 0.35);
}
.choice.hint {
  border-color: #f0a86a;
  box-shadow: 0 0 0 6px rgba(240, 168, 106, 0.4);
}
.prog {
  text-align: center;
  font-weight: 800;
  color: var(--ink-soft);
  margin: 8px 0 0;
}
@keyframes pop {
  40% { transform: scale(1.12); }
}
</style>
