<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import { EXTRA_MODES } from '../../data/sense/meta'
import { shapeById, type ShapeId } from '../../data/sense/attr'
import { makeShadowMatchQuiz, shapeClip, type ShadowMatchQ } from '../../data/sense/extra'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { unlockSenseSticker } from '../../composables/useSenseStickers'
import { noteWrongAnswer } from '../../composables/useWrongRest'
import { recordAnswer } from '../../composables/useStats'
import { useSpeech } from '../../composables/useSpeech'

const router = useRouter()
const { completeExtra } = useSenseProgress()
const { speak } = useSpeech()

const meta = EXTRA_MODES.find((m) => m.id === 'shadowMatch')!
const quiz = ref<ShadowMatchQ[]>([])
const qIndex = ref(0)
const celebrate = ref(false)
const locked = ref(false)
const flash = ref<ShapeId | null>(null)
const hint = ref<ShapeId | null>(null)
const missedOnce = ref(false)

const current = computed(() => quiz.value[qIndex.value] ?? null)
const qTotal = computed(() => quiz.value.length)

function start() {
  quiz.value = makeShadowMatchQuiz(6)
  qIndex.value = 0
  celebrate.value = false
  locked.value = false
  flash.value = null
  hint.value = null
  missedOnce.value = false
  speak('影子是哪个图形？点出来')
}

function markMiss() {
  if (missedOnce.value) return
  missedOnce.value = true
  noteWrongAnswer()
}

function onPick(id: ShapeId) {
  const q = current.value
  if (!q || locked.value || celebrate.value) return
  if (id === q.answer) {
    recordAnswer({ id: 'shadowMatch', name: '影子配对', group: 'rec', ok: true })
    locked.value = true
    flash.value = id
    speak(shapeById(id).name)
    window.setTimeout(() => {
      flash.value = null
      missedOnce.value = false
      if (qIndex.value >= qTotal.value - 1) {
        completeExtra('shadowMatch', 2)
        unlockSenseSticker('shadowMatch')
        celebrate.value = true
        locked.value = false
        return
      }
      qIndex.value++
      locked.value = false
      hint.value = null
      speak('下一个影子')
    }, 520)
    return
  }
  recordAnswer({
    id: 'shadowMatch',
    name: '影子配对',
    group: 'rec',
    ok: false,
    label: shapeById(id).name,
  })
  markMiss()
  hint.value = q.answer
  speak('再看一看')
}

onMounted(start)
</script>

<template>
  <SenseChrome
    :title="meta.name"
    prompt="影子是哪个图形？"
    :hint="current ? `${qIndex + 1} / ${qTotal}` : undefined"
    back-to="/sense/recognize"
  >
    <div v-if="current && !celebrate" class="stage">
      <div class="shadow-card">
        <div
          class="glyph shadow"
          :style="{ background: current.fill, clipPath: shapeClip(current.answer) }"
          aria-hidden="true"
        />
        <p class="caption">点下面的名字</p>
      </div>
      <div class="choices">
        <button
          v-for="id in current.choices"
          :key="id"
          type="button"
          class="hot choice"
          :class="{ ok: flash === id, hint: hint === id }"
          :disabled="locked"
          @click="onPick(id)"
        >
          {{ shapeById(id).name }}
        </button>
      </div>
    </div>
    <Celebrate
      :show="celebrate"
      title="配对成功！"
      again-label="再配一轮"
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
  gap: 18px;
  padding: 8px 14px 16px;
}
.shadow-card {
  width: min(300px, 86vw);
  min-height: 220px;
  border-radius: 28px;
  background: #fff;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 22px;
}
.glyph {
  width: 140px;
  height: 140px;
}
.glyph.shadow {
  filter: brightness(0.35);
}
.caption {
  margin: 0;
  font-weight: 800;
  color: var(--ink-soft);
  font-size: 14px;
}
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: min(340px, 92vw);
}
.choice {
  min-height: 52px;
  font-size: 18px;
  font-weight: 900;
  border-radius: 18px;
  background: var(--card);
  box-shadow: var(--shadow);
}
.choice.ok {
  background: #d8f3e8;
  color: #2f7a5f;
}
.choice.hint {
  box-shadow: 0 0 0 4px rgba(240, 168, 106, 0.45), var(--shadow);
}
</style>
