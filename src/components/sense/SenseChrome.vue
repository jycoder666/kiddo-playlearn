<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSpeech } from '../../composables/useSpeech'
import {
  islandFromBackTo,
  type SenseIslandId,
} from '../../composables/useSenseProgress'
import { startPlayTimeTick, stopPlayTimeTick } from '../../composables/usePlayTime'
import SpeakButton from '../shared/SpeakButton.vue'
import ParentCorner from './ParentCorner.vue'

const HOLD_MS = 2000

const props = defineProps<{
  title: string
  prompt?: string
  /** 次要说明，字号更小 */
  hint?: string
  backTo?: string
  /** 显式指定岛；缺省由 backTo 推断 */
  island?: SenseIslandId
}>()

const router = useRouter()
const { play } = useSpeech()

const parentOpen = ref(false)
let holdTimer: ReturnType<typeof setTimeout> | null = null

const resolvedIsland = computed(
  () => props.island ?? islandFromBackTo(props.backTo),
)

/** 把连续数字拆出来高亮 */
const promptParts = computed(() => {
  const text = props.prompt || ''
  return text.split(/(\d+)/).filter((p) => p.length > 0)
})

/** 题干 + 提示，供点击朗读 */
const speakText = computed(() =>
  [props.prompt, props.hint].filter((s) => s && String(s).trim()).join('，'),
)

function replayPrompt() {
  if (speakText.value) play(speakText.value)
}

function clearHold() {
  if (holdTimer) {
    clearTimeout(holdTimer)
    holdTimer = null
  }
}

function onParentDown(e: PointerEvent) {
  if (!resolvedIsland.value) return
  e.preventDefault()
  clearHold()
  holdTimer = setTimeout(() => {
    holdTimer = null
    parentOpen.value = true
  }, HOLD_MS)
}

function onParentUp() {
  clearHold()
}

onMounted(startPlayTimeTick)
onUnmounted(() => {
  clearHold()
  stopPlayTimeTick()
})
</script>

<template>
  <div class="chrome">
    <header class="top">
      <button class="hot back" aria-label="返回" @click="router.push(backTo || '/sense')">←</button>
      <h1>{{ title }}</h1>
      <div class="right">
        <button
          v-if="resolvedIsland"
          type="button"
          class="parent-entry"
          aria-label="家长角，长按两秒打开"
          @pointerdown="onParentDown"
          @pointerup="onParentUp"
          @pointerleave="onParentUp"
          @pointercancel="onParentUp"
          @click.prevent
        >
          爸妈
        </button>
        <SpeakButton :text="speakText || title" />
      </div>
    </header>
    <div
      v-if="prompt || hint"
      class="prompt-block"
      role="button"
      tabindex="0"
      aria-label="再听一次题干"
      @click="replayPrompt"
      @keydown.enter.prevent="replayPrompt"
    >
      <p v-if="prompt" class="prompt">
        <template v-for="(part, i) in promptParts" :key="i">
          <span v-if="/^\d+$/.test(part)" class="num">{{ part }}</span>
          <template v-else>{{ part }}</template>
        </template>
      </p>
      <p v-if="hint" class="hint">{{ hint }}</p>
    </div>
    <slot />
    <ParentCorner
      v-if="parentOpen && resolvedIsland"
      :island="resolvedIsland"
      @close="parentOpen = false"
    />
  </div>
</template>

<style scoped>
.chrome {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 80% 12%, rgba(168, 213, 229, 0.45) 0 48px, transparent 49px),
    var(--bg-cream);
}
.top {
  display: grid;
  grid-template-columns: 72px 1fr auto;
  align-items: center;
  padding: 10px 8px 0;
  gap: 4px;
}
h1 {
  margin: 0;
  text-align: center;
  font-size: 22px;
}
.right {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}
.parent-entry {
  min-width: 44px;
  min-height: 44px;
  padding: 0 8px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--ink-soft);
  font-size: 12px;
  font-weight: 800;
  opacity: 0.55;
  touch-action: none;
  user-select: none;
}
.parent-entry:active {
  opacity: 0.85;
  background: rgba(255, 255, 255, 0.4);
}
.back {
  background: var(--card);
  box-shadow: var(--shadow);
  font-size: 26px;
}
.prompt-block {
  margin: 8px 16px 0;
  text-align: center;
  cursor: pointer;
  border-radius: 16px;
  padding: 4px 8px;
}
.prompt-block:active {
  background: rgba(255, 255, 255, 0.45);
}
.prompt {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.35;
}
.prompt .num {
  display: inline-block;
  min-width: 1.15em;
  padding: 0 6px;
  margin: 0 2px;
  border-radius: 10px;
  background: #ffe0a8;
  color: #c45c12;
  font-size: 1.35em;
  font-weight: 900;
  line-height: 1.25;
  vertical-align: -0.05em;
}
.hint {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink-soft);
  line-height: 1.3;
}
</style>
