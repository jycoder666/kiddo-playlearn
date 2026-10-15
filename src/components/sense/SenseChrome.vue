<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSpeech } from '../../composables/useSpeech'
import SpeakButton from '../shared/SpeakButton.vue'

const props = defineProps<{
  title: string
  prompt?: string
  /** 次要说明，字号更小 */
  hint?: string
  backTo?: string
}>()

const router = useRouter()
const { play } = useSpeech()

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
</script>

<template>
  <div class="chrome">
    <header class="top">
      <button class="hot back" aria-label="返回" @click="router.push(backTo || '/sense')">←</button>
      <h1>{{ title }}</h1>
      <SpeakButton :text="speakText || title" />
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
  grid-template-columns: 72px 1fr 72px;
  align-items: center;
  padding: 10px 8px 0;
}
h1 {
  margin: 0;
  text-align: center;
  font-size: 22px;
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
