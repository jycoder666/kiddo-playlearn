<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getLevelMeta, LEVEL_COUNT } from '../data/levelMeta'
import { getLevelItems, orderLevelItems, shuffleLevelItems } from '../data/levels'
import { answerLabel, mapHintKey, MAP_HINT } from '../data/directions'
import { collectWalkHops, expandWalkChains, hopSteps, walkChain } from '../data/walkChain'
import { useProgress } from '../composables/useProgress'
import { useLevelSession } from '../composables/useLevelSession'
import { useSpeech } from '../composables/useSpeech'
import { useSfx } from '../composables/useSfx'
import { usePrefersReducedMotion } from '../composables/usePrefersReducedMotion'
import LevelChrome from '../components/level/LevelChrome.vue'
import PromptBar from '../components/level/PromptBar.vue'
import ResultOverlay from '../components/level/ResultOverlay.vue'
import DirectionPad from '../components/play/DirectionPad.vue'
import WalkGrid from '../components/play/WalkGrid.vue'
import Grid9 from '../components/play/Grid9.vue'
import BodyAnchor from '../components/play/BodyAnchor.vue'
import MapQuiz from '../components/play/MapQuiz.vue'
import HeroSprite from '../components/shared/HeroSprite.vue'

const route = useRoute()
const router = useRouter()
const levelId = Number(route.params.id)
const meta = getLevelMeta(levelId)!
const progress = useProgress()
const saved = progress.state.incompleteRun
const resume = route.query.resume === '1' && saved?.levelId === levelId ? saved : null
function dealItems(fromResume: typeof resume) {
  const base = getLevelItems(levelId)
  // 先扩连跳（次数每局随机），再洗牌；续局用 walkHops 还原同一条路线
  const withChain = expandWalkChains(base, fromResume?.walkHops)
  if (fromResume?.order?.length) return orderLevelItems(withChain, fromResume.order)
  return shuffleLevelItems(withChain)
}

const items = dealItems(resume)
const session = useLevelSession(items, meta.passRate, resume)
const { index, phase, wrongCount, answers, current: item, total, stars, passed } = session
const { speak, cancel, speaking, iconFallback } = useSpeech()
const sfx = useSfx()
const reduced = usePrefersReducedMotion()

const wrongTick = ref(0)
const runId = ref(0)
const feedback = ref('')
const feedbackKind = ref<'idle' | 'ok' | 'hint' | 'demo'>('idle')
const showExit = ref(false)
const result = ref<{ newSticker: boolean; newUnlock: boolean } | null>(null)
let nextTimer: number | undefined
let firstPrompt = !resume

const highlight = computed(() => wrongCount.value >= 2 || phase.value === 'demo')
const revealed = computed(() => phase.value === 'correct' || phase.value === 'demo')
const disabled = computed(() => phase.value !== 'awaiting')
const best = computed(() => progress.state.highestStars[levelId] ?? 0)
const progressPct = computed(() => (answers.value.length / total.value) * 100)

const PRAISE = ['真棒！', '对啦！', '好厉害！', '答对啦！']

function promptSpeech() {
  if (!item.value) return
  if (firstPrompt && meta.intro) {
    firstPrompt = false
    speak(`${meta.intro}。${item.value.prompt}`)
    return
  }
  firstPrompt = false
  speak(item.value.prompt)
}

function present() {
  feedback.value = ''
  feedbackKind.value = 'idle'
  if (!item.value || phase.value !== 'awaiting') return
  // 合成引导题由九宫格先演示再出题
  if (item.value.type === 'compose') return
  promptSpeech()
}

function saveRun() {
  progress.saveRun(session.snapshot(levelId, { walkHops: collectWalkHops(items) }))
}

function goNext() {
  window.clearTimeout(nextTimer)
  nextTimer = undefined
  if (phase.value !== 'correct' && phase.value !== 'demo') return
  session.next()
}

function scheduleNext() {
  window.clearTimeout(nextTimer)
  // 先预约切题，避免 speak/存档异常导致永远停在「答对」禁用态
  nextTimer = window.setTimeout(goNext, reduced.value ? 700 : 1200)
}

function onAnswer(code: string) {
  const it = item.value
  if (!it) return
  const r = session.answer(code)
  if (r === 'ignored') return
  if (r === 'correct') {
    sfx.correct()
    const word = PRAISE[Math.floor(Math.random() * PRAISE.length)]
    feedback.value = word
    feedbackKind.value = 'ok'
    scheduleNext()
    saveRun()
    speak(word.replace('！', ''))
    return
  }
  wrongTick.value++
  sfx.gentle()
  if (r === 'wrong' && wrongCount.value === 1) {
    feedback.value = '再听一次哦'
    feedbackKind.value = 'hint'
    const hk = mapHintKey(it.type, it.correct, it.meta)
    const mapTip = (it.type === 'map' || it.type === 'mapfind') && MAP_HINT[hk] ? `。${MAP_HINT[hk]}` : ''
    speak(`再听一次。${it.prompt}${mapTip}`)
  } else if (r === 'wrong') {
    feedback.value = '看看亮的那个'
    feedbackKind.value = 'hint'
    speak('看看亮亮的那个')
  } else {
    const label = answerLabel(it.type, it.correct)
    feedback.value = `是「${label}」，记住啦`
    feedbackKind.value = 'demo'
    saveRun()
    speak(`是${label}，我们一起记住啦`)
  }
}

function onBlocked() {
  sfx.bump()
  feedback.value = '这边没有路啦'
  feedbackKind.value = 'hint'
  speak('这边没有路啦')
}

function replayPrompt() {
  if (item.value) speak(item.value.prompt)
}

watch(index, () => nextTick(present))

watch(
  phase,
  (p) => {
    if (p !== 'result' || result.value) return
    window.clearTimeout(nextTimer)
    nextTimer = undefined
    result.value = progress.recordResult(levelId, stars.value, passed.value)
    sfx.fanfare()
    speak(passed.value ? '过关啦，你真棒' : '完成啦，再练一次会更熟')
  },
  { immediate: true },
)

function backToMap() {
  if (answers.value.length > 0 && phase.value !== 'result') {
    showExit.value = true
    return
  }
  router.push('/')
}

function confirmExit() {
  cancel()
  router.push('/')
}

function replay() {
  window.clearTimeout(nextTimer)
  result.value = null
  runId.value++
  items.splice(0, items.length, ...dealItems(null))
  session.restart()
  nextTick(present)
}

function nextLevel() {
  router.push(`/level/${levelId + 1}`)
}

onMounted(present)
onBeforeUnmount(() => {
  window.clearTimeout(nextTimer)
  cancel()
})
</script>

<template>
  <div class="level">
    <LevelChrome :title="`第${levelId}关 · ${meta.name}`" :index="index" :total="total" :best="best" @back="backToMap" />

    <PromptBar
      v-if="item"
      :text="item.prompt"
      :icon="item.icon"
      :show-icon="iconFallback"
      :speaking="speaking"
      @replay="replayPrompt"
    />

    <main class="play">
      <template v-if="item">
        <DirectionPad
          v-if="item.type === 'point'"
          :key="`${runId}-${index}`"
          :mode="4"
          :correct="item.correct"
          :highlight="highlight"
          :revealed="revealed"
          :disabled="disabled"
          :wrong-tick="wrongTick"
          @press="onAnswer"
        >
          <HeroSprite :pose="phase === 'correct' ? 'happy' : 'idle'" :width="138" />
        </DirectionPad>

        <WalkGrid
          v-else-if="item.type === 'walk'"
          :key="`${runId}-${index}`"
          :start="item.meta.start || 'C'"
          :correct="item.correct"
          :steps="hopSteps(item)"
          :pad-mode="item.meta.pad === '8' ? 8 : 4"
          :chain="walkChain(items, index)"
          :highlight="highlight"
          :revealed="revealed"
          :disabled="disabled"
          :wrong-tick="wrongTick"
          @answer="onAnswer"
          @blocked="onBlocked"
        />

        <BodyAnchor
          v-else-if="item.type === 'body'"
          :key="`${runId}-${index}`"
          :correct="item.correct"
          :highlight="highlight"
          :revealed="revealed"
          :disabled="disabled"
          :wrong-tick="wrongTick"
          @answer="onAnswer"
        />

        <Grid9
          v-else-if="item.type === 'grid9' || item.type === 'compose' || item.type === 'place'"
          :key="`${runId}-${index}`"
          :mode="item.type === 'grid9' ? 'tap' : item.type"
          :correct="item.correct"
          :items="item.meta.items ? item.meta.items.split('|') : undefined"
          :highlight="highlight"
          :revealed="revealed"
          :disabled="disabled"
          :wrong-tick="wrongTick"
          @answer="onAnswer"
          @ready="promptSpeech"
        />

        <MapQuiz
          v-else-if="item.type === 'map' || item.type === 'mapfind'"
          :key="`${runId}-${index}`"
          :mode="item.type === 'mapfind' ? 'find' : 'dir'"
          :correct="item.correct"
          :target="item.meta.target"
          :dir="item.meta.dir"
          :hint="wrongCount >= 1 || phase === 'demo'"
          :highlight="highlight"
          :revealed="revealed"
          :disabled="disabled"
          :wrong-tick="wrongTick"
          @answer="onAnswer"
        />
      </template>
    </main>

    <footer class="foot">
      <div class="bar"><div class="fill" :style="{ width: progressPct + '%' }" /></div>
      <div class="feedback" :class="feedbackKind">
        <span>{{ feedback }}</span>
        <button v-if="phase === 'demo' || phase === 'correct'" class="hot btn-primary next" @click="goNext()">
          下一题 ▶
        </button>
      </div>
    </footer>

    <div v-if="showExit" class="modal" @click.self="showExit = false">
      <div class="dialog">
        <p>先回地图？<br /><small>下次可以从这里继续</small></p>
        <div class="dialog-actions">
          <button class="hot btn-secondary" @click="showExit = false">接着玩</button>
          <button class="hot btn-primary" @click="confirmExit">回地图</button>
        </div>
      </div>
    </div>

    <ResultOverlay
      v-if="phase === 'result' && result"
      :meta="meta"
      :stars="stars"
      :passed="passed"
      :new-sticker="result.newSticker"
      :new-unlock="result.newUnlock"
      :has-next="levelId < LEVEL_COUNT"
      @next="nextLevel"
      @replay="replay"
      @map="router.push('/')"
    />
  </div>
</template>

<style scoped>
.level {
  position: relative;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
.play {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 6px;
}
.foot { padding: 6px 16px calc(14px + env(safe-area-inset-bottom)); }
.bar { height: 12px; border-radius: 999px; background: #F3DDE3; overflow: hidden; }
.fill { height: 100%; background: linear-gradient(90deg, var(--mint), var(--accent)); border-radius: 999px; transition: width 0.4s ease; }
.feedback {
  min-height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 22px;
  font-weight: 800;
}
.feedback.ok { color: #3C9A7B; flex-direction: column; gap: 6px; padding-top: 6px; }
.feedback.hint { color: #C9845A; }
.feedback.demo { color: var(--accent-strong); flex-direction: column; gap: 6px; padding-top: 6px; }
.next { font-size: 22px; width: 100%; }
.modal {
  position: absolute;
  inset: 0;
  z-index: 40;
  background: rgba(92, 75, 81, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: fadeIn 0.2s ease both;
}
.dialog {
  background: var(--bg-cream);
  border-radius: 28px;
  padding: 24px 20px 20px;
  width: 100%;
  max-width: 340px;
  text-align: center;
  animation: pop 0.3s ease both;
}
.dialog p { margin: 0 0 18px; font-size: 26px; font-weight: 800; }
.dialog small { font-size: 17px; color: var(--ink-soft); }
.dialog-actions { display: flex; gap: 12px; }
.dialog-actions .hot { flex: 1; }
</style>
