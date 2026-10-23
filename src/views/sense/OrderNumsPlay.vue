<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import { EXTRA_MODES } from '../../data/sense/meta'
import { makeOrderNumsQuiz } from '../../data/sense/extra'
import { shuffle } from '../../data/sense/util'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { unlockSenseSticker } from '../../composables/useSenseStickers'
import { noteWrongAnswer } from '../../composables/useWrongRest'
import { useSpeech } from '../../composables/useSpeech'

const NEED = 5
const router = useRouter()
const { completeExtra } = useSenseProgress()
const { speak } = useSpeech()
const meta = EXTRA_MODES.find((m) => m.id === 'orderNums')!

const decks = ref<number[][]>([])
const qIndex = ref(0)
const slots = ref<(number | null)[]>([])
const pool = ref<number[]>([])
const celebrate = ref(false)
const missedOnce = ref(false)

const expected = computed(() => {
  const d = decks.value[qIndex.value]
  if (!d) return []
  return [...d].sort((a, b) => a - b)
})

const prompt = computed(() => '从小到大排好队')

function dealOne() {
  const d = decks.value[qIndex.value] ?? []
  slots.value = d.map(() => null)
  pool.value = shuffle([...d])
  missedOnce.value = false
  speak('从小到大排好队')
}

function start() {
  decks.value = makeOrderNumsQuiz(NEED)
  qIndex.value = 0
  celebrate.value = false
  dealOne()
}

function onPool(n: number) {
  if (celebrate.value) return
  const empty = slots.value.findIndex((x) => x == null)
  if (empty < 0) return
  const next = [...slots.value]
  next[empty] = n
  slots.value = next
  pool.value = pool.value.filter((x) => x !== n)
  check()
}

function onSlot(i: number) {
  const n = slots.value[i]
  if (n == null) return
  const next = [...slots.value]
  next[i] = null
  slots.value = next
  pool.value = [...pool.value, n]
}

function check() {
  if (slots.value.some((x) => x == null)) return
  const ok = slots.value.every((n, i) => n === expected.value[i])
  if (!ok) {
    if (!missedOnce.value) {
      missedOnce.value = true
      noteWrongAnswer()
    }
    speak('再排一排')
    dealOne()
    return
  }
  speak('排好啦')
  window.setTimeout(() => {
    if (qIndex.value >= NEED - 1) {
      completeExtra('orderNums', 2)
      unlockSenseSticker('orderNums')
      celebrate.value = true
      return
    }
    qIndex.value++
    dealOne()
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
    <div v-if="!celebrate" class="stage">
      <div class="slots">
        <button
          v-for="(n, i) in slots"
          :key="'s' + i"
          type="button"
          class="hot slot"
          @click="onSlot(i)"
        >
          {{ n ?? '·' }}
        </button>
      </div>
      <div class="pool">
        <button
          v-for="n in pool"
          :key="'p' + n"
          type="button"
          class="hot chip"
          @click="onPool(n)"
        >
          {{ n }}
        </button>
      </div>
    </div>
    <Celebrate
      :show="celebrate"
      title="排好啦！"
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
  gap: 24px;
  padding: 16px;
}
.slots, .pool {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}
.slot, .chip {
  width: 64px;
  height: 64px;
  border: none;
  border-radius: 16px;
  font-size: 28px;
  font-weight: 900;
  box-shadow: var(--shadow);
}
.slot { background: #fff8e8; }
.chip { background: #d6f0ff; }
</style>
