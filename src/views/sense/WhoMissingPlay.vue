<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import CountItem from '../../components/sense/CountItem.vue'
import { EXTRA_MODES } from '../../data/sense/meta'
import { getSkin } from '../../data/sense/items'
import { makeWhoMissingQuiz, type WhoMissingQ } from '../../data/sense/extra'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { unlockSenseSticker } from '../../composables/useSenseStickers'
import { noteWrongAnswer } from '../../composables/useWrongRest'
import { useSpeech } from '../../composables/useSpeech'
import type { ItemSkin } from '../../data/sense/items'

const NEED = 5
const router = useRouter()
const { completeExtra } = useSenseProgress()
const { speak } = useSpeech()
const meta = EXTRA_MODES.find((m) => m.id === 'whoMissing')!

const quiz = ref<WhoMissingQ[]>([])
const qIndex = ref(0)
const phase = ref<'show' | 'ask'>('show')
const celebrate = ref(false)
const locked = ref(false)
const missedOnce = ref(false)

const current = computed(() => quiz.value[qIndex.value] ?? null)
const prompt = computed(() =>
  phase.value === 'show' ? '看清楚都有谁' : '谁不见了？',
)

function start() {
  quiz.value = makeWhoMissingQuiz(NEED)
  qIndex.value = 0
  celebrate.value = false
  missedOnce.value = false
  beginShow()
}

function beginShow() {
  phase.value = 'show'
  locked.value = true
  speak('看清楚都有谁')
  window.setTimeout(() => {
    if (celebrate.value) return
    phase.value = 'ask'
    locked.value = false
    speak('谁不见了？')
  }, 2200)
}

function onPick(skin: ItemSkin) {
  if (phase.value !== 'ask' || locked.value || !current.value) return
  if (skin !== current.value.missing) {
    if (!missedOnce.value) {
      missedOnce.value = true
      noteWrongAnswer()
    }
    speak('再看一看')
    return
  }
  locked.value = true
  speak(getSkin(skin).label)
  window.setTimeout(() => {
    if (qIndex.value >= NEED - 1) {
      completeExtra('whoMissing', 2)
      unlockSenseSticker('whoMissing')
      celebrate.value = true
      speak('太棒了')
      return
    }
    qIndex.value++
    missedOnce.value = false
    beginShow()
  }, 450)
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
      <div v-if="phase === 'show'" class="party">
        <CountItem
          v-for="(s, i) in current.party"
          :key="s + i"
          :skin="s"
          :size="64"
          :interactive="false"
        />
      </div>
      <div v-else class="choices">
        <button
          v-for="s in current.choices"
          :key="s"
          type="button"
          class="hot choice"
          @click="onPick(s)"
        >
          <CountItem :skin="s" :size="72" :interactive="false" />
          <span>{{ getSkin(s).label }}</span>
        </button>
      </div>
    </div>
    <Celebrate
      :show="celebrate"
      title="找对啦！"
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
  align-items: center;
  justify-content: center;
  padding: 12px;
}
.party, .choices {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: center;
  max-width: 360px;
}
.choice {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  border: none;
  border-radius: 18px;
  background: var(--card);
  box-shadow: var(--shadow);
  font-weight: 900;
}
</style>
