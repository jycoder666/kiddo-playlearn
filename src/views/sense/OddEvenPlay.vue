<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import { EXTRA_MODES } from '../../data/sense/meta'
import { shuffle } from '../../data/sense/util'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { unlockSenseSticker } from '../../composables/useSenseStickers'
import { noteWrongAnswer } from '../../composables/useWrongRest'
import { useSpeech } from '../../composables/useSpeech'

const NEED = 8
const router = useRouter()
const { completeExtra } = useSenseProgress()
const { speak } = useSpeech()
const meta = EXTRA_MODES.find((m) => m.id === 'oddEven')!

const queue = ref<number[]>([])
const idx = ref(0)
const done = ref(0)
const celebrate = ref(false)
const missedOnce = ref(false)
const flash = ref<'odd' | 'even' | null>(null)

const current = computed(() => queue.value[idx.value] ?? null)
const prompt = computed(() =>
  current.value == null ? '单数还是双数？' : `${current.value} 是单数还是双数？`,
)

function start() {
  queue.value = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, NEED)
  idx.value = 0
  done.value = 0
  celebrate.value = false
  missedOnce.value = false
  speak(prompt.value)
}

function onBin(bin: 'odd' | 'even') {
  if (current.value == null || celebrate.value) return
  const isOdd = current.value % 2 === 1
  const ok = (bin === 'odd' && isOdd) || (bin === 'even' && !isOdd)
  if (!ok) {
    if (!missedOnce.value) {
      missedOnce.value = true
      noteWrongAnswer()
    }
    flash.value = bin
    speak('再想想')
    window.setTimeout(() => {
      flash.value = null
    }, 350)
    return
  }
  speak(isOdd ? '单数' : '双数')
  done.value++
  if (idx.value >= NEED - 1) {
    completeExtra('oddEven', 2)
    unlockSenseSticker('oddEven')
    celebrate.value = true
    speak('太棒了')
    return
  }
  idx.value++
  missedOnce.value = false
  speak(prompt.value)
}

onMounted(start)
</script>

<template>
  <SenseChrome
    :title="meta.name"
    :prompt="prompt"
    :hint="`${done} / ${NEED}`"
    back-to="/sense/recognize"
  >
    <div v-if="!celebrate && current != null" class="stage">
      <div class="num">{{ current }}</div>
      <div class="bins">
        <button
          type="button"
          class="hot bin odd"
          :class="{ flash: flash === 'odd' }"
          @click="onBin('odd')"
        >
          单数
        </button>
        <button
          type="button"
          class="hot bin even"
          :class="{ flash: flash === 'even' }"
          @click="onBin('even')"
        >
          双数
        </button>
      </div>
    </div>
    <Celebrate
      :show="celebrate"
      title="分好啦！"
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
  gap: 28px;
}
.num {
  width: 120px;
  height: 120px;
  border-radius: 28px;
  background: var(--card);
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
  font-weight: 900;
}
.bins { display: flex; gap: 16px; }
.bin {
  min-width: 120px;
  padding: 18px 22px;
  border: none;
  border-radius: 18px;
  font-size: 22px;
  font-weight: 900;
}
.odd { background: #ffd6e0; }
.even { background: #d6e8ff; }
.flash { animation: shake 0.35s; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  30% { transform: translateX(-5px); }
  70% { transform: translateX(5px); }
}
</style>
