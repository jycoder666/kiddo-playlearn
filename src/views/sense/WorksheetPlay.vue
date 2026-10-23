<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import { makeEqPickQuiz, type EqPickQ } from '../../data/sense/eqPick'
import { useCalcPrefs } from '../../composables/useCalcPrefs'
import { unlockSenseSticker } from '../../composables/useSenseStickers'
import { noteWrongAnswer } from '../../composables/useWrongRest'
import { recordAnswer } from '../../composables/useStats'
import { useSpeech } from '../../composables/useSpeech'

const NEED = 8
const router = useRouter()
const { prefs } = useCalcPrefs()
const { speak } = useSpeech()

const quiz = ref<EqPickQ[]>([])
const qIndex = ref(0)
const celebrate = ref(false)
const locked = ref(false)
const flash = ref<number | null>(null)
const hint = ref<number | null>(null)
const missedOnce = ref(false)
const correctCount = ref(0)

const current = computed(() => quiz.value[qIndex.value] ?? null)

function start() {
  quiz.value = makeEqPickQuiz(NEED, prefs.max)
  qIndex.value = 0
  celebrate.value = false
  locked.value = false
  flash.value = null
  hint.value = null
  missedOnce.value = false
  correctCount.value = 0
  speak('像纸笔练习一样，点出得数')
}

function onPick(n: number) {
  const q = current.value
  if (!q || locked.value || celebrate.value) return
  if (n === q.answer) {
    recordAnswer({ id: 'worksheet', name: '加减练习', group: 'calc', ok: true })
    locked.value = true
    flash.value = n
    correctCount.value++
    speak('对啦')
    window.setTimeout(() => {
      flash.value = null
      missedOnce.value = false
      if (qIndex.value >= NEED - 1) {
        unlockSenseSticker('worksheet')
        celebrate.value = true
        locked.value = false
        return
      }
      qIndex.value++
      locked.value = false
      hint.value = null
    }, 450)
    return
  }
  recordAnswer({ id: 'worksheet', name: '加减练习', group: 'calc', ok: false, label: String(n) })
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
    title="加减练习"
    :prompt="current ? `${current.label} = ？` : '点出得数'"
    :hint="current ? `第 ${qIndex + 1} / ${NEED} 题 · 到 ${prefs.max}` : undefined"
    back-to="/settings"
  >
    <div v-if="current && !celebrate" class="stage">
      <p class="paper-label">屏幕练习卷</p>
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
      title="练完啦！"
      again-label="再练 8 道"
      @again="start"
      @next="router.push('/settings')"
      @home="router.push('/')"
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
  gap: 16px;
  padding: 12px;
}
.paper-label {
  margin: 0;
  font-weight: 800;
  color: var(--ink-soft);
}
.eq {
  font-size: 40px;
  font-weight: 900;
  padding: 22px 26px;
  border-radius: 20px;
  background: #fffdf6;
  border: 2px dashed #e0d4c8;
  box-shadow: var(--shadow);
}
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: min(320px, 92vw);
}
.choice {
  min-height: 60px;
  font-size: 26px;
  font-weight: 900;
  border-radius: 18px;
  background: var(--card);
  box-shadow: var(--shadow);
}
.choice.ok {
  background: #d8f3e8;
}
.choice.hint {
  box-shadow: 0 0 0 4px rgba(240, 168, 106, 0.45), var(--shadow);
}
</style>
