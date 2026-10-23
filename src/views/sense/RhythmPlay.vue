<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import { EXTRA_MODES } from '../../data/sense/meta'
import { randInt } from '../../data/sense/util'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { unlockSenseSticker } from '../../composables/useSenseStickers'
import { noteWrongAnswer } from '../../composables/useWrongRest'
import { useSpeech } from '../../composables/useSpeech'

const CELLS = 4
const NEED = 5
const router = useRouter()
const { completeExtra } = useSenseProgress()
const { speak } = useSpeech()
const meta = EXTRA_MODES.find((m) => m.id === 'rhythm')!

const seq = ref<number[]>([])
const lit = ref<number | null>(null)
const input = ref<number[]>([])
const phase = ref<'watch' | 'play'>('watch')
const round = ref(0)
const celebrate = ref(false)
const missedOnce = ref(false)
let timers: ReturnType<typeof setTimeout>[] = []

function beep(i: number) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = 320 + i * 80
    g.gain.value = 0.08
    o.connect(g)
    g.connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + 0.12)
    window.setTimeout(() => ctx.close(), 200)
  } catch {
    /* ignore */
  }
}

function clearTimers() {
  for (const t of timers) clearTimeout(t)
  timers = []
}

function playSeq(list: number[]) {
  clearTimers()
  phase.value = 'watch'
  input.value = []
  lit.value = null
  list.forEach((idx, step) => {
    timers.push(
      setTimeout(() => {
        lit.value = idx
        beep(idx)
      }, 500 + step * 650),
    )
    timers.push(
      setTimeout(() => {
        lit.value = null
        if (step === list.length - 1) {
          phase.value = 'play'
          speak('照着点')
        }
      }, 500 + step * 650 + 400),
    )
  })
}

function nextRound() {
  const len = Math.min(3 + Math.floor(round.value / 2), 5)
  const list: number[] = []
  for (let i = 0; i < len; i++) list.push(randInt(0, CELLS - 1))
  seq.value = list
  missedOnce.value = false
  speak('看好亮起来的顺序')
  playSeq(list)
}

function start() {
  round.value = 0
  celebrate.value = false
  nextRound()
}

function onPad(i: number) {
  if (phase.value !== 'play' || celebrate.value) return
  lit.value = i
  beep(i)
  window.setTimeout(() => {
    if (lit.value === i) lit.value = null
  }, 180)
  const next = [...input.value, i]
  input.value = next
  const expect = seq.value
  const step = next.length - 1
  if (next[step] !== expect[step]) {
    if (!missedOnce.value) {
      missedOnce.value = true
      noteWrongAnswer()
    }
    speak('再看一遍')
    playSeq(expect)
    return
  }
  if (next.length === expect.length) {
    phase.value = 'watch'
    speak('好棒')
    window.setTimeout(() => {
      if (round.value >= NEED - 1) {
        completeExtra('rhythm', 2)
        unlockSenseSticker('rhythm')
        celebrate.value = true
        return
      }
      round.value++
      nextRound()
    }, 500)
  }
}

onMounted(start)
onUnmounted(clearTimers)
</script>

<template>
  <SenseChrome
    :title="meta.name"
    :prompt="phase === 'watch' ? '看好顺序' : '照着点'"
    :hint="`${round + 1} / ${NEED}`"
    back-to="/sense/recognize"
  >
    <div v-if="!celebrate" class="pads">
      <button
        v-for="i in CELLS"
        :key="i"
        type="button"
        class="pad"
        :class="{ on: lit === i - 1 }"
        :disabled="phase === 'watch'"
        @click="onPad(i - 1)"
      >
        {{ i }}
      </button>
    </div>
    <Celebrate
      :show="celebrate"
      title="节奏真棒！"
      again-label="再玩一轮"
      @again="start"
      @next="router.push('/sense/recognize')"
      @home="router.push('/sense/recognize')"
    />
  </SenseChrome>
</template>

<style scoped>
.pads {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding: 24px 20px;
  align-content: center;
  max-width: 360px;
  margin: 0 auto;
  width: 100%;
}
.pad {
  min-height: 120px;
  border: none;
  border-radius: 24px;
  background: var(--card);
  box-shadow: var(--shadow);
  font-size: 36px;
  font-weight: 900;
  transition: background 0.12s, transform 0.12s;
}
.pad.on {
  background: #f0c14a;
  transform: scale(1.04);
}
.pad:disabled {
  opacity: 0.95;
}
</style>
