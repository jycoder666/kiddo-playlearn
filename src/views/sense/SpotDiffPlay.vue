<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import CountItem from '../../components/sense/CountItem.vue'
import { EXTRA_MODES } from '../../data/sense/meta'
import { makeSpotDiffQuiz, type SpotDiffQ } from '../../data/sense/extra'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { unlockSenseSticker } from '../../composables/useSenseStickers'
import { noteWrongAnswer } from '../../composables/useWrongRest'
import { recordAnswer } from '../../composables/useStats'
import { useSpeech } from '../../composables/useSpeech'

const router = useRouter()
const { completeExtra } = useSenseProgress()
const { speak } = useSpeech()

const meta = EXTRA_MODES.find((m) => m.id === 'spotDiff')!
const quiz = ref<SpotDiffQ[]>([])
const qIndex = ref(0)
const celebrate = ref(false)
const locked = ref(false)
const flash = ref<'left' | 'right' | null>(null)
const hint = ref<'left' | 'right' | null>(null)
const missedOnce = ref(false)

const current = computed(() => quiz.value[qIndex.value] ?? null)
const qTotal = computed(() => quiz.value.length)

function start() {
  quiz.value = makeSpotDiffQuiz(5)
  qIndex.value = 0
  celebrate.value = false
  locked.value = false
  flash.value = null
  hint.value = null
  missedOnce.value = false
  speak('哪一边不一样多？点出来')
}

function markMiss() {
  if (missedOnce.value) return
  missedOnce.value = true
  noteWrongAnswer()
}

function onPick(side: 'left' | 'right') {
  const q = current.value
  if (!q || locked.value || celebrate.value) return
  if (side === q.answer) {
    recordAnswer({ id: 'spotDiff', name: '找不同', group: 'rec', ok: true })
    locked.value = true
    flash.value = side
    speak('对啦')
    window.setTimeout(() => {
      flash.value = null
      missedOnce.value = false
      if (qIndex.value >= qTotal.value - 1) {
        completeExtra('spotDiff', 2)
        unlockSenseSticker('spotDiff')
        celebrate.value = true
        locked.value = false
        return
      }
      qIndex.value++
      locked.value = false
      hint.value = null
      speak('再找一找')
    }, 500)
    return
  }
  recordAnswer({ id: 'spotDiff', name: '找不同', group: 'rec', ok: false, label: side })
  markMiss()
  hint.value = q.answer
  speak('再看一看')
}

onMounted(start)
</script>

<template>
  <SenseChrome
    :title="meta.name"
    prompt="哪一边不一样多？"
    :hint="current ? `${qIndex + 1} / ${qTotal}` : undefined"
    back-to="/sense/recognize"
  >
    <div v-if="current && !celebrate" class="board">
      <button
        type="button"
        class="side"
        :class="{ ok: flash === 'left', hint: hint === 'left' }"
        :disabled="locked"
        aria-label="左边"
        @click="onPick('left')"
      >
        <span class="label">左边</span>
        <div class="apples">
          <CountItem v-for="i in current.left" :key="'L' + i" skin="apple" :size="44" :interactive="false" />
        </div>
      </button>
      <button
        type="button"
        class="side"
        :class="{ ok: flash === 'right', hint: hint === 'right' }"
        :disabled="locked"
        aria-label="右边"
        @click="onPick('right')"
      >
        <span class="label">右边</span>
        <div class="apples">
          <CountItem v-for="i in current.right" :key="'R' + i" skin="apple" :size="44" :interactive="false" />
        </div>
      </button>
    </div>
    <Celebrate
      :show="celebrate"
      title="火眼金睛！"
      again-label="再找一轮"
      @again="start"
      @next="router.push('/sense/recognize')"
      @home="router.push('/sense/recognize')"
    />
  </SenseChrome>
</template>

<style scoped>
.board {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 12px 14px 20px;
  align-content: center;
}
.side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-height: 220px;
  padding: 14px 10px;
  border: 3px solid transparent;
  border-radius: 24px;
  background: var(--card);
  box-shadow: var(--shadow);
}
.side.ok {
  border-color: #3c9a7b;
  background: #e8f7f1;
}
.side.hint {
  border-color: #f0a86a;
  box-shadow: 0 0 0 4px rgba(240, 168, 106, 0.28), var(--shadow);
}
.label {
  font-size: 16px;
  font-weight: 900;
  color: var(--ink-soft);
}
.apples {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  align-content: center;
  flex: 1;
}
</style>
