<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import { ATTR_MODES, type AttrModeId } from '../../data/sense/meta'
import {
  COLORS,
  SHAPES,
  colorById,
  comboLabel,
  makeColorQuiz,
  makeComboQuiz,
  makeShapeQuiz,
  shapeById,
  type AttrQuizQ,
  type ShapeId,
} from '../../data/sense/attr'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { noteWrongAnswer } from '../../composables/useWrongRest'
import { useSpeech } from '../../composables/useSpeech'

const route = useRoute()
const router = useRouter()
const { completeAttr, isAttrUnlocked } = useSenseProgress()
const { speak } = useSpeech()

const mode = computed(() => route.params.mode as AttrModeId)
const meta = computed(() => ATTR_MODES.find((m) => m.id === mode.value))

const celebrate = ref(false)
const prompt = ref('')
const cardIndex = ref(0)
const quiz = ref<AttrQuizQ[]>([])
const qIndex = ref(0)
const wrongStreak = ref(0)
const missedOnce = ref(false)
const locked = ref(false)
const flashKey = ref<string | null>(null)
const hintKey = ref<string | null>(null)

const isIntro = computed(() => mode.value === 'colorIntro' || mode.value === 'shapeIntro')
const introList = computed(() => (mode.value === 'colorIntro' ? COLORS : SHAPES))
const introTotal = computed(() => introList.value.length)
const introItem = computed(() => introList.value[cardIndex.value])

const current = computed(() => quiz.value[qIndex.value] ?? null)
const qTotal = computed(() => quiz.value.length)

function markMiss() {
  if (missedOnce.value) return
  missedOnce.value = true
  noteWrongAnswer()
}

function shapeClip(id: ShapeId): string {
  switch (id) {
    case 'circle':
      return 'circle(50% at 50% 50%)'
    case 'ellipse':
      return 'ellipse(50% 38% at 50% 50%)'
    case 'square':
      return 'inset(12% 12% 12% 12%)'
    case 'rect':
      return 'inset(22% 6% 22% 6%)'
    case 'triangle':
      return 'polygon(50% 8%, 92% 88%, 8% 88%)'
    case 'diamond':
      return 'polygon(50% 6%, 92% 50%, 50% 94%, 8% 50%)'
    case 'trapezoid':
      return 'polygon(22% 18%, 78% 18%, 94% 82%, 6% 82%)'
    case 'star':
      return 'polygon(50% 4%, 61% 38%, 96% 38%, 68% 58%, 79% 92%, 50% 72%, 21% 92%, 32% 58%, 4% 38%, 39% 38%)'
    default:
      return 'circle(50% at 50% 50%)'
  }
}

function choiceKey(q: AttrQuizQ, i: number): string {
  if (q.kind === 'color') return q.choices[i]
  if (q.kind === 'shape') return q.choices[i]
  const c = q.choices[i]
  return `${c.color}:${c.shape}`
}

function choiceLabel(q: AttrQuizQ, i: number): string {
  if (q.kind === 'color') return colorById(q.choices[i]).name
  if (q.kind === 'shape') return shapeById(q.choices[i]).name
  const c = q.choices[i]
  return comboLabel(c.color, c.shape)
}

function answerKey(q: AttrQuizQ): string {
  if (q.kind === 'color') return q.answer
  if (q.kind === 'shape') return q.answer
  return `${q.color}:${q.shape}`
}

function speakIntroCard() {
  const item = introItem.value
  if (!item) return
  const name = item.name
  prompt.value = name
  speak(name)
}

function startIntro() {
  celebrate.value = false
  cardIndex.value = 0
  speakIntroCard()
}

function nextIntroCard() {
  if (cardIndex.value >= introTotal.value - 1) {
    completeAttr(mode.value, 2)
    celebrate.value = true
    speak('太棒了，都认识啦')
    return
  }
  cardIndex.value++
  speakIntroCard()
}

function startQuiz() {
  celebrate.value = false
  qIndex.value = 0
  if (mode.value === 'colorQuiz') quiz.value = makeColorQuiz(9)
  else if (mode.value === 'shapeQuiz') quiz.value = makeShapeQuiz(9)
  else quiz.value = makeComboQuiz(9)
  presentQuiz()
}

function presentQuiz() {
  wrongStreak.value = 0
  missedOnce.value = false
  locked.value = false
  flashKey.value = null
  hintKey.value = null
  const q = current.value
  if (!q) return
  if (q.kind === 'color') {
    prompt.value = '这是什么颜色？'
    speak(`这是什么颜色？点出${colorById(q.answer).name}也可以先自己想`)
  } else if (q.kind === 'shape') {
    prompt.value = '这是什么图形？'
    speak('这是什么图形？')
  } else {
    prompt.value = '这是什么？'
    speak(`看一看，点出${comboLabel(q.color, q.shape)}`)
  }
}

function startMode() {
  if (!isAttrUnlocked(mode.value)) {
    router.replace('/sense/recognize')
    return
  }
  if (isIntro.value) startIntro()
  else startQuiz()
}

onMounted(startMode)
watch(mode, startMode)

function onPick(key: string) {
  if (locked.value || celebrate.value || !current.value) return
  const q = current.value
  const ok = key === answerKey(q)
  if (!ok) {
    markMiss()
    wrongStreak.value++
    speak('再看一看')
    if (wrongStreak.value >= 2) hintKey.value = answerKey(q)
    return
  }
  locked.value = true
  flashKey.value = key
  speak('对啦')
  window.setTimeout(() => {
    qIndex.value++
    if (qIndex.value >= qTotal.value) {
      completeAttr(mode.value, 2)
      celebrate.value = true
      return
    }
    presentQuiz()
  }, 550)
}

function replay() {
  startMode()
}

function backMap() {
  celebrate.value = false
  router.push('/sense/recognize')
}

function nextAfterWin() {
  celebrate.value = false
  if (mode.value === 'colorIntro') {
    router.push('/sense/recognize/colorQuiz')
    return
  }
  if (mode.value === 'shapeIntro') {
    router.push('/sense/recognize/shapeQuiz')
    return
  }
  if (mode.value === 'colorQuiz' || mode.value === 'shapeQuiz') {
    if (isAttrUnlocked('combo')) {
      router.push('/sense/recognize/combo')
      return
    }
  }
  router.push('/sense/recognize')
}

const introColor = computed(() => {
  if (mode.value !== 'colorIntro') return null
  return COLORS[cardIndex.value] ?? null
})

const introShape = computed(() => {
  if (mode.value !== 'shapeIntro') return null
  return SHAPES[cardIndex.value] ?? null
})

const quizFill = computed(() => {
  const q = current.value
  if (!q) return '#7a8a99'
  if (q.kind === 'color') return colorById(q.answer).hex
  if (q.kind === 'shape') return q.fill
  return colorById(q.color).hex
})

const quizShape = computed<ShapeId | null>(() => {
  const q = current.value
  if (!q) return null
  if (q.kind === 'shape') return q.answer
  if (q.kind === 'combo') return q.shape
  return null
})
</script>

<template>
  <SenseChrome
    :title="meta?.name || '认一认'"
    :prompt="prompt"
    :hint="isIntro ? `${cardIndex + 1} / ${introTotal}` : current ? `${qIndex + 1} / ${qTotal}` : undefined"
    back-to="/sense/recognize"
  >
    <!-- 预习滑卡 -->
    <div v-if="isIntro && !celebrate" class="stage">
      <div class="card">
        <div
          v-if="introColor"
          class="swatch"
          :class="{ light: introColor.id === 'white' }"
          :style="{ background: introColor.hex }"
        />
        <div
          v-else-if="introShape"
          class="glyph"
          :style="{ background: '#6b8cae', clipPath: shapeClip(introShape.id) }"
        />
        <p class="big-name">{{ introItem?.name }}</p>
      </div>
      <button type="button" class="hot btn-primary next" @click="nextIntroCard">
        {{ cardIndex >= introTotal - 1 ? '学完啦 ▶' : '下一张 ▶' }}
      </button>
    </div>

    <!-- 看图点名 -->
    <div v-else-if="current && !celebrate" class="stage">
      <div class="card quiz">
        <div
          v-if="current.kind === 'color'"
          class="swatch"
          :class="{ light: current.answer === 'white' }"
          :style="{ background: quizFill }"
        />
        <div
          v-else
          class="glyph"
          :style="{ background: quizFill, clipPath: shapeClip(quizShape!) }"
        />
      </div>
      <div class="choices">
        <button
          v-for="(_, i) in current.choices"
          :key="choiceKey(current, i)"
          type="button"
          class="hot choice"
          :class="{
            ok: flashKey === choiceKey(current, i),
            hint: hintKey === choiceKey(current, i),
          }"
          :disabled="locked"
          @click="onPick(choiceKey(current, i))"
        >
          {{ choiceLabel(current, i) }}
        </button>
      </div>
    </div>

    <Celebrate
      :show="celebrate"
      title="太棒了！"
      again-label="再玩一次"
      @again="replay"
      @next="nextAfterWin"
      @home="backMap"
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
  gap: 18px;
  padding: 8px 14px 16px;
}
.card {
  width: min(300px, 86vw);
  min-height: 260px;
  border-radius: 28px;
  background: #fff;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 22px;
}
.card.quiz { min-height: 220px; }
.swatch {
  width: 160px;
  height: 160px;
  border-radius: 28px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
}
.swatch.light {
  box-shadow: inset 0 0 0 2px rgba(90, 75, 80, 0.22);
}
.glyph {
  width: 168px;
  height: 168px;
}
.big-name {
  margin: 0;
  font-size: 42px;
  font-weight: 900;
}
.next { min-width: 180px; }
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: min(360px, 100%);
}
.choice {
  background: var(--card);
  box-shadow: var(--shadow);
  font-size: 20px;
  font-weight: 900;
  min-height: 64px;
}
.choice.ok { background: var(--mint); color: #fff; }
.choice.hint { outline: 3px solid var(--accent); }
</style>
