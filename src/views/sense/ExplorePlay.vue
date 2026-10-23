<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import CountItem from '../../components/sense/CountItem.vue'
import { EXTRA_MODES } from '../../data/sense/meta'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { unlockSenseSticker } from '../../composables/useSenseStickers'
import { useSpeech } from '../../composables/useSpeech'

const DECK = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const
const NOTES: Record<number, string> = {
  1: '就一个，单独站着。',
  2: '两个好朋友并排。',
  3: '三个可以排成小三角。',
  4: '四个能摆成小方阵。',
  5: '一只手有五根手指。',
  6: '六是两个三。',
  7: '七比六多一个。',
  8: '八像两只手少两根。',
  9: '九快到十啦。',
  10: '十是两只手。',
}

const router = useRouter()
const { completeExtra } = useSenseProgress()
const { speak } = useSpeech()

const meta = EXTRA_MODES.find((m) => m.id === 'explore')!
const idx = ref(0)
const celebrate = ref(false)

const n = computed(() => DECK[idx.value])
const note = computed(() => NOTES[n.value])
const prompt = computed(() => `这是 ${n.value}`)

function speakNow() {
  speak(`${n.value}。${note.value}`)
}

function next() {
  if (celebrate.value) return
  if (idx.value >= DECK.length - 1) {
    completeExtra('explore', 2)
    unlockSenseSticker('explore')
    celebrate.value = true
    return
  }
  idx.value++
  /* 不自动播：只换卡 */
}

function prev() {
  if (idx.value <= 0) return
  idx.value--
}

function replay() {
  idx.value = 0
  celebrate.value = false
}
</script>

<template>
  <SenseChrome
    :title="meta.name"
    :prompt="prompt"
    :hint="`${idx + 1} / ${DECK.length} · 想听再点读`"
    back-to="/sense/recognize"
  >
    <div v-if="!celebrate" class="stage">
      <div class="card">
        <p class="digit">{{ n }}</p>
        <div class="apples">
          <CountItem v-for="i in n" :key="i" skin="apple" :size="40" :interactive="false" />
        </div>
        <p class="note">{{ note }}</p>
      </div>
      <button type="button" class="hot btn-secondary speak" @click="speakNow">读给我听</button>
      <div class="nav">
        <button type="button" class="hot btn-secondary" :disabled="idx === 0" @click="prev">上一张</button>
        <button type="button" class="hot btn-primary" @click="next">
          {{ idx >= DECK.length - 1 ? '看完啦 ▶' : '下一张 ▶' }}
        </button>
      </div>
    </div>
    <Celebrate
      :show="celebrate"
      title="慢慢看完啦"
      again-label="再看一遍"
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
  gap: 12px;
  padding: 8px 14px 16px;
}
.card {
  width: min(320px, 90vw);
  min-height: 260px;
  border-radius: 28px;
  background: #fff;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 16px;
}
.digit {
  margin: 0;
  font-size: 72px;
  font-weight: 900;
  line-height: 1;
}
.apples {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  min-height: 48px;
}
.note {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--ink-soft);
  text-align: center;
}
.speak,
.nav {
  width: min(320px, 90vw);
}
.nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.speak,
.nav .hot {
  min-height: 48px;
  font-weight: 800;
}
</style>
