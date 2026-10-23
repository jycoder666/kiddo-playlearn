<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import { EXTRA_MODES } from '../../data/sense/meta'
import { pick, randInt } from '../../data/sense/util'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { unlockSenseSticker } from '../../composables/useSenseStickers'
import { useSpeech } from '../../composables/useSpeech'

const NEED = 8
const HUES = ['#e85d4c', '#f08a3a', '#f0c14a', '#5cb85c', '#4a90d9', '#8e6cc9', '#f0a0c0']

const router = useRouter()
const { completeExtra } = useSenseProgress()
const { speak } = useSpeech()

const meta = EXTRA_MODES.find((m) => m.id === 'digitTap')!
const n = ref(1)
const taps = ref(0)
const pulse = ref(false)
const hue = ref(HUES[0])
const celebrate = ref(false)

function roll() {
  n.value = randInt(1, 10)
  hue.value = pick(HUES)
  pulse.value = true
  window.setTimeout(() => (pulse.value = false), 280)
  speak(String(n.value))
}

function onTap() {
  if (celebrate.value) return
  roll()
  taps.value++
  if (taps.value >= NEED) {
    completeExtra('digitTap', 2)
    unlockSenseSticker('digitTap')
    celebrate.value = true
  }
}

function replay() {
  taps.value = 0
  celebrate.value = false
  roll()
}

onMounted(() => {
  speak('点大钮，数字会蹦出来')
  roll()
})
</script>

<template>
  <SenseChrome
    :title="meta.name"
    prompt="点大钮，听数字"
    :hint="`${taps} / ${NEED}`"
    back-to="/sense/recognize"
  >
    <div v-if="!celebrate" class="stage">
      <button
        type="button"
        class="smash"
        :class="{ pulse }"
        :style="{ background: hue }"
        aria-label="点出数字"
        @click="onTap"
      >
        <span class="digit">{{ n }}</span>
      </button>
      <p class="tip">再点会换一个数字哦</p>
    </div>
    <Celebrate
      :show="celebrate"
      title="热身完成！"
      again-label="再点一轮"
      @again="replay"
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
.smash {
  width: min(280px, 78vw);
  height: min(280px, 78vw);
  border: none;
  border-radius: 50%;
  box-shadow: 0 10px 0 rgba(92, 75, 81, 0.18);
  color: #fff;
  display: grid;
  place-items: center;
  touch-action: manipulation;
}
.smash:active {
  transform: scale(0.96);
}
.smash.pulse {
  animation: pop 0.28s ease;
}
.digit {
  font-size: 120px;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 4px 0 rgba(0, 0, 0, 0.12);
}
.tip {
  margin: 0;
  font-weight: 800;
  color: var(--ink-soft);
}
@keyframes pop {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.06);
  }
  100% {
    transform: scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .smash.pulse {
    animation: none;
  }
}
</style>
