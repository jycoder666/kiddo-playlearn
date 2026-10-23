<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import { CALC_MODES } from '../../data/sense/meta'
import { makeEqPickQuiz, type EqPickQ } from '../../data/sense/eqPick'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { useCalcPrefs } from '../../composables/useCalcPrefs'
import { unlockSenseSticker } from '../../composables/useSenseStickers'
import { noteWrongAnswer } from '../../composables/useWrongRest'
import { recordAnswer } from '../../composables/useStats'
import { useSpeech } from '../../composables/useSpeech'

const NEED = 8
const router = useRouter()
const { completeCalc } = useSenseProgress()
const { prefs } = useCalcPrefs()
const { speak } = useSpeech()

const meta = CALC_MODES.find((m) => m.id === 'eqPick')!
const quiz = ref<EqPickQ[]>([])
const qIndex = ref(0)
const celebrate = ref(false)
const locked = ref(false)
const flash = ref<number | null>(null)
const hint = ref<number | null>(null)
const missedOnce = ref(false)

const current = computed(() => quiz.value[qIndex.value] ?? null)
const qTotal = computed(() => quiz.value.length)

function start() {
  quiz.value = makeEqPickQuiz(NEED, prefs.max)
  qIndex.value = 0
  celebrate.value = false
  locked.value = false
  flash.value = null
  hint.value = null
  missedOnce.value = false
  speak(`看算式，点出得数。数字到 ${prefs.max}`)
}

function markMiss() {
  if (missedOnce.value) return
  missedOnce.value = true
  noteWrongAnswer()
}

function onPick(n: number) {
  const q = current.value
  if (!q || locked.value || celebrate.value) return
  if (n === q.answer) {
    recordAnswer({ id: 'eqPick', name: '口算接龙', group: 'calc', ok: true })
    locked.value = true
    flash.value = n
    speak('对啦')
    window.setTimeout(() => {
      flash.value = null
      missedOnce.value = false
      if (qIndex.value >= qTotal.value - 1) {
        completeCalc('eqPick', 2)
        unlockSenseSticker('eqPick')
        celebrate.value = true
        locked.value = false
        return
      }
      qIndex.value++
      locked.value = false
      hint.value = null
      const next = quiz.value[qIndex.value]
      if (next) speak(next.label)
    }, 480)
    return
  }
  recordAnswer({ id: 'eqPick', name: '口算接龙', group: 'calc', ok: false, label: String(n) })
  markMiss()
  hint.value = q.answer
  speak('再看一看')
}

onMounted(start)
</script>

<template>
  <SenseChrome
    :title="meta.name"
    :prompt="current ? `${current.label} = ？` : '看算式，点出得数'"
    :hint="current ? `${qIndex + 1} / ${qTotal} · 到 ${prefs.max}` : undefined"
    back-to="/sense/calc"
  >
    <div v-if="current && !celebrate" class="stage">
      <div class="eq">{{ current.label }} = ？</div>
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
      title="口算真棒！"
      again-label="再练一轮"
      :sticker="true"
      @again="start"
      @next="router.push('/sense/calc')"
      @home="router.push('/sense/calc')"
    />
  </SenseChrome>
</template>

<style scoped>
.stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 12px 14px 20px;
}
.eq {
  font-size: 42px;
  font-weight: 900;
  padding: 24px 28px;
  border-radius: 28px;
  background: #fff;
  box-shadow: var(--shadow);
}
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: min(320px, 92vw);
}
.choice {
  min-height: 64px;
  font-size: 28px;
  font-weight: 900;
  border-radius: 20px;
  background: var(--card);
  box-shadow: var(--shadow);
}
.choice.ok {
  background: #d8f3e8;
  color: #2f7a5f;
}
.choice.hint {
  box-shadow: 0 0 0 4px rgba(240, 168, 106, 0.45), var(--shadow);
}
</style>
