<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import { EXTRA_MODES } from '../../data/sense/meta'
import { colorById, type ColorId } from '../../data/sense/attr'
import { shuffle } from '../../data/sense/util'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { unlockSenseSticker } from '../../composables/useSenseStickers'
import { noteWrongAnswer } from '../../composables/useWrongRest'
import { useSpeech } from '../../composables/useSpeech'

interface MixRule {
  a: ColorId
  b: ColorId
  result: ColorId
}

const RULES: MixRule[] = [
  { a: 'red', b: 'yellow', result: 'orange' },
  { a: 'yellow', b: 'blue', result: 'green' },
  { a: 'red', b: 'blue', result: 'purple' },
  { a: 'red', b: 'white', result: 'pink' },
  { a: 'black', b: 'white', result: 'gray' },
]

const PRIMARIES: ColorId[] = ['red', 'yellow', 'blue', 'white', 'black']

const router = useRouter()
const { completeExtra } = useSenseProgress()
const { speak } = useSpeech()
const meta = EXTRA_MODES.find((m) => m.id === 'colorMix')!

const deck = ref<MixRule[]>([])
const qIndex = ref(0)
const picked = ref<ColorId[]>([])
const celebrate = ref(false)
const flashOk = ref(false)
const missedOnce = ref(false)

const current = computed(() => deck.value[qIndex.value] ?? null)
const target = computed(() => (current.value ? colorById(current.value.result) : null))
const qTotal = computed(() => deck.value.length)

function start() {
  deck.value = shuffle([...RULES, ...RULES]).slice(0, 5)
  qIndex.value = 0
  picked.value = []
  celebrate.value = false
  flashOk.value = false
  missedOnce.value = false
  const t = target.value
  if (t) speak(`调出${t.name}色，点两种颜色`)
}

function onPick(id: ColorId) {
  if (!current.value || celebrate.value || flashOk.value) return
  if (picked.value.includes(id)) return
  if (picked.value.length >= 2) return
  picked.value = [...picked.value, id]
  if (picked.value.length < 2) {
    speak(colorById(id).name)
    return
  }
  const [x, y] = picked.value
  const r = current.value
  const ok =
    (x === r.a && y === r.b) ||
    (x === r.b && y === r.a)
  if (ok) {
    flashOk.value = true
    speak(`变成${colorById(r.result).name}啦`)
    window.setTimeout(() => {
      flashOk.value = false
      missedOnce.value = false
      picked.value = []
      if (qIndex.value >= qTotal.value - 1) {
        completeExtra('colorMix', 2)
        unlockSenseSticker('colorMix')
        celebrate.value = true
        return
      }
      qIndex.value++
      const t = target.value
      if (t) speak(`调出${t.name}色`)
    }, 700)
    return
  }
  if (!missedOnce.value) {
    missedOnce.value = true
    noteWrongAnswer()
  }
  speak('再看一看')
  picked.value = []
}

onMounted(start)
</script>

<template>
  <SenseChrome
    :title="meta.name"
    :prompt="target ? `调出${target.name}色` : '点两种颜色'"
    :hint="current ? `${qIndex + 1} / ${qTotal}` : undefined"
    back-to="/sense/recognize"
  >
    <div v-if="current && !celebrate" class="stage">
      <div
        class="target"
        :class="{ light: current.result === 'white', ok: flashOk }"
        :style="{ background: colorById(current.result).hex }"
      >
        <span>{{ target?.name }}</span>
      </div>
      <p class="tip">已点：{{ picked.map((id) => colorById(id).name).join(' + ') || '还没点' }}</p>
      <div class="palette">
        <button
          v-for="id in PRIMARIES"
          :key="id"
          type="button"
          class="swatch"
          :class="{ on: picked.includes(id), light: id === 'white' }"
          :style="{ background: colorById(id).hex }"
          :aria-label="colorById(id).name"
          @click="onPick(id)"
        >
          {{ colorById(id).name }}
        </button>
      </div>
    </div>
    <Celebrate
      :show="celebrate"
      title="调色成功！"
      again-label="再调一轮"
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
  gap: 14px;
  padding: 12px;
}
.target {
  width: min(200px, 50vw);
  height: min(200px, 50vw);
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 28px;
  font-weight: 900;
  box-shadow: var(--shadow);
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.15);
}
.target.light {
  color: #5c4b51;
  border: 3px solid #ddd;
  text-shadow: none;
}
.target.ok {
  transform: scale(1.06);
}
.tip {
  margin: 0;
  font-weight: 800;
  color: var(--ink-soft);
}
.palette {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  max-width: 340px;
}
.swatch {
  width: 72px;
  height: 72px;
  border: none;
  border-radius: 50%;
  color: #fff;
  font-weight: 900;
  font-size: 16px;
  box-shadow: var(--shadow);
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
}
.swatch.light {
  color: #5c4b51;
  border: 3px solid #ccc;
  text-shadow: none;
}
.swatch.on {
  outline: 4px solid #f0a86a;
}
</style>
