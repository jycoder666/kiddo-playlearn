<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import CountItem from '../../components/sense/CountItem.vue'
import { EXTRA_MODES } from '../../data/sense/meta'
import { getSkin, type ItemSkin } from '../../data/sense/items'
import { makePeekFindBoard } from '../../data/sense/extra'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { unlockSenseSticker } from '../../composables/useSenseStickers'
import { noteWrongAnswer } from '../../composables/useWrongRest'
import { useSpeech } from '../../composables/useSpeech'

const NEED_ROUNDS = 3
const router = useRouter()
const { completeExtra } = useSenseProgress()
const { speak } = useSpeech()
const meta = EXTRA_MODES.find((m) => m.id === 'peekFind')!

const tiles = ref<ItemSkin[]>([])
const targets = ref<ItemSkin[]>([])
const targetIndex = ref(0)
const found = ref<Set<number>>(new Set())
const phase = ref<'peek' | 'find'>('peek')
const round = ref(0)
const celebrate = ref(false)
const missedOnce = ref(false)
const flashWrong = ref<number | null>(null)

const currentTarget = computed(() => targets.value[targetIndex.value] ?? null)
const prompt = computed(() => {
  if (phase.value === 'peek') return '先看清楚牌面'
  const t = currentTarget.value
  return t ? `找出：${getSkin(t).label}` : '找一找'
})

function deal() {
  const board = makePeekFindBoard()
  tiles.value = board.tiles
  targets.value = board.targets
  targetIndex.value = 0
  found.value = new Set()
  phase.value = 'peek'
  missedOnce.value = false
  speak('先看清楚牌面')
  window.setTimeout(() => {
    if (celebrate.value) return
    phase.value = 'find'
    const t = targets.value[0]
    if (t) speak(`找出${getSkin(t).label}`)
  }, 2000)
}

function start() {
  round.value = 0
  celebrate.value = false
  deal()
}

function onTile(i: number) {
  if (phase.value !== 'find' || celebrate.value || !currentTarget.value) return
  if (found.value.has(i)) return
  if (tiles.value[i] !== currentTarget.value) {
    if (!missedOnce.value) {
      missedOnce.value = true
      noteWrongAnswer()
    }
    flashWrong.value = i
    speak('再看看')
    window.setTimeout(() => {
      flashWrong.value = null
    }, 400)
    return
  }
  const next = new Set(found.value)
  next.add(i)
  found.value = next
  speak(getSkin(currentTarget.value).label)
  if (targetIndex.value >= targets.value.length - 1) {
    window.setTimeout(() => {
      if (round.value >= NEED_ROUNDS - 1) {
        completeExtra('peekFind', 2)
        unlockSenseSticker('peekFind')
        celebrate.value = true
        speak('太棒了')
        return
      }
      round.value++
      deal()
    }, 400)
    return
  }
  targetIndex.value++
  const t = targets.value[targetIndex.value]
  if (t) speak(`找出${getSkin(t).label}`)
}

onMounted(start)
</script>

<template>
  <SenseChrome
    :title="meta.name"
    :prompt="prompt"
    :hint="`${round + 1} / ${NEED_ROUNDS}`"
    back-to="/sense/recognize"
  >
    <div v-if="!celebrate" class="grid">
      <button
        v-for="(skin, i) in tiles"
        :key="i"
        type="button"
        class="hot tile"
        :class="{
          open: phase === 'peek' || found.has(i),
          wrong: flashWrong === i,
        }"
        @click="onTile(i)"
      >
        <CountItem
          v-if="phase === 'peek' || found.has(i)"
          :skin="skin"
          :size="56"
          :interactive="false"
        />
        <span v-else class="back">?</span>
      </button>
    </div>
    <Celebrate
      :show="celebrate"
      title="都找到啦！"
      again-label="再玩一轮"
      @again="start"
      @next="router.push('/sense/recognize')"
      @home="router.push('/sense/recognize')"
    />
  </SenseChrome>
</template>

<style scoped>
.grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px;
  align-content: center;
  max-width: 360px;
  margin: 0 auto;
}
.tile {
  aspect-ratio: 1;
  border: none;
  border-radius: 16px;
  background: #7eb8e8;
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  justify-content: center;
}
.tile.open { background: var(--card); }
.tile.wrong { animation: shake 0.35s; }
.back { font-size: 28px; font-weight: 900; color: #fff; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  30% { transform: translateX(-6px); }
  70% { transform: translateX(6px); }
}
</style>
