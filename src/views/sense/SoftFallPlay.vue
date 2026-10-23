<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import { EXTRA_MODES } from '../../data/sense/meta'
import { makeEqPickQuiz, type EqPickQ } from '../../data/sense/eqPick'
import { useCalcPrefs } from '../../composables/useCalcPrefs'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { unlockSenseSticker } from '../../composables/useSenseStickers'
import { noteWrongAnswer } from '../../composables/useWrongRest'
import { useSpeech } from '../../composables/useSpeech'

const NEED = 6
const router = useRouter()
const { prefs } = useCalcPrefs()
const { completeExtra } = useSenseProgress()
const { speak } = useSpeech()
const meta = EXTRA_MODES.find((m) => m.id === 'softFall')!

const quiz = ref<EqPickQ[]>([])
const qIndex = ref(0)
const y = ref(0)
const celebrate = ref(false)
const locked = ref(false)
const flash = ref<number | null>(null)
const hint = ref<number | null>(null)
const missedOnce = ref(false)
let raf = 0
let last = 0

const current = computed(() => quiz.value[qIndex.value] ?? null)

function stopAnim() {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
}

function tick(ts: number) {
  if (!last) last = ts
  const dt = Math.min(40, ts - last)
  last = ts
  y.value = Math.min(78, y.value + dt * 0.012)
  if (y.value >= 78) {
    // 漏接：不扣命，轻轻提示并重置下落
    if (!missedOnce.value) {
      missedOnce.value = true
      noteWrongAnswer()
    }
    speak('再接一次')
    y.value = 0
    last = 0
  }
  raf = requestAnimationFrame(tick)
}

function startDrop() {
  stopAnim()
  y.value = 0
  last = 0
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    y.value = 36
    return
  }
  raf = requestAnimationFrame(tick)
}

function start() {
  quiz.value = makeEqPickQuiz(NEED, prefs.max)
  qIndex.value = 0
  celebrate.value = false
  locked.value = false
  flash.value = null
  hint.value = null
  missedOnce.value = false
  speak('算式慢慢落下来，点出得数')
  startDrop()
}

function onPick(n: number) {
  const q = current.value
  if (!q || locked.value || celebrate.value) return
  if (n === q.answer) {
    locked.value = true
    stopAnim()
    flash.value = n
    speak('接住啦')
    window.setTimeout(() => {
      flash.value = null
      missedOnce.value = false
      if (qIndex.value >= NEED - 1) {
        completeExtra('softFall', 2)
        unlockSenseSticker('softFall')
        celebrate.value = true
        locked.value = false
        return
      }
      qIndex.value++
      locked.value = false
      hint.value = null
      startDrop()
    }, 450)
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
onUnmounted(stopAnim)
</script>

<template>
  <SenseChrome
    :title="meta.name"
    prompt="点出得数接住它"
    :hint="current ? `${qIndex + 1} / ${NEED}` : undefined"
    back-to="/sense/recognize"
  >
    <div v-if="current && !celebrate" class="stage">
      <div class="sky">
        <div class="meteor" :style="{ top: y + '%' }">{{ current.label }} = ？</div>
      </div>
      <div class="choices">
        <button
          v-for="n in current.choices"
          :key="n"
          type="button"
          class="hot choice"
          :class="{ ok: flash === n, hint: hint === n }"
          :disabled="locked"
          @click="onPick(n)"
        >
          {{ n }}
        </button>
      </div>
    </div>
    <Celebrate
      :show="celebrate"
      title="接得真好！"
      again-label="再接一轮"
      @again="start"
      @next="router.push('/sense/recognize')"
      @home="router.push('/sense/recognize')"
    />
  </SenseChrome>
</template>

<style scoped>
.stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 14px 16px;
}
.sky {
  position: relative;
  height: 220px;
  border-radius: 24px;
  background: linear-gradient(180deg, #d9eef7, #fff);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.meteor {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 18px;
  border-radius: 16px;
  background: #fff;
  font-size: 26px;
  font-weight: 900;
  box-shadow: var(--shadow);
  white-space: nowrap;
}
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.choice {
  min-height: 56px;
  font-size: 24px;
  font-weight: 900;
  border-radius: 18px;
  background: var(--card);
  box-shadow: var(--shadow);
}
.choice.ok { background: #d8f3e8; }
.choice.hint { box-shadow: 0 0 0 4px rgba(240, 168, 106, 0.45), var(--shadow); }
@media (prefers-reduced-motion: reduce) {
  .meteor { top: 40% !important; }
}
</style>
