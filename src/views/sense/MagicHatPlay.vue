<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import CountItem from '../../components/sense/CountItem.vue'
import { EXTRA_MODES } from '../../data/sense/meta'
import { makeMagicHatQuiz, type MagicHatQ } from '../../data/sense/extra'
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
const meta = EXTRA_MODES.find((m) => m.id === 'magicHat')!

const quiz = ref<MagicHatQ[]>([])
const qIndex = ref(0)
const celebrate = ref(false)
const missedOnce = ref(false)
const phase = ref<'story' | 'ask'>('story')

const current = computed(() => quiz.value[qIndex.value] ?? null)
const prompt = computed(() => {
  if (!current.value) return '帽子里有几颗？'
  if (phase.value === 'story') {
    return current.value.op === '+'
      ? `帽子里有 ${current.value.start} 颗，再放进 ${current.value.delta} 颗`
      : `帽子里有 ${current.value.start} 颗，拿走 ${current.value.delta} 颗`
  }
  return current.value.op === '+' ? '一共几颗？' : '还剩几颗？'
})

function start() {
  quiz.value = makeMagicHatQuiz(NEED, prefs.max)
  qIndex.value = 0
  celebrate.value = false
  beginStory()
}

function beginStory() {
  phase.value = 'story'
  missedOnce.value = false
  speak(prompt.value)
  window.setTimeout(() => {
    if (celebrate.value) return
    phase.value = 'ask'
    speak(prompt.value)
  }, 1800)
}

function onPick(n: number) {
  if (phase.value !== 'ask' || !current.value || celebrate.value) return
  if (n !== current.value.answer) {
    if (!missedOnce.value) {
      missedOnce.value = true
      noteWrongAnswer()
    }
    speak('再数一数')
    return
  }
  speak(String(n))
  window.setTimeout(() => {
    if (qIndex.value >= NEED - 1) {
      completeExtra('magicHat', 2)
      unlockSenseSticker('magicHat')
      celebrate.value = true
      speak('太棒了')
      return
    }
    qIndex.value++
    beginStory()
  }, 400)
}

onMounted(start)
</script>

<template>
  <SenseChrome
    :title="meta.name"
    :prompt="prompt"
    :hint="`${qIndex + 1} / ${NEED}`"
    back-to="/sense/recognize"
  >
    <div v-if="!celebrate && current" class="stage">
      <div class="hat">🎩</div>
      <div v-if="phase === 'story'" class="stars">
        <CountItem
          v-for="i in current.start"
          :key="'a' + i"
          skin="apple"
          :size="36"
          :interactive="false"
        />
      </div>
      <div v-else class="choices">
        <button
          v-for="n in current.choices"
          :key="n"
          type="button"
          class="hot chip"
          @click="onPick(n)"
        >
          {{ n }}
        </button>
      </div>
    </div>
    <Celebrate
      :show="celebrate"
      title="猜对啦！"
      again-label="再玩一轮"
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
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px;
}
.hat { font-size: 72px; }
.stars {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  max-width: 280px;
  min-height: 48px;
}
.choices { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
.chip {
  width: 72px;
  height: 72px;
  border: none;
  border-radius: 18px;
  font-size: 32px;
  font-weight: 900;
  background: var(--card);
  box-shadow: var(--shadow);
}
</style>
