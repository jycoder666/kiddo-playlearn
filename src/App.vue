<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAntiDebug, useAntiAddiction } from './composables/useAntiAddiction'
import { useWrongRest } from './composables/useWrongRest'
import { useSpeech } from './composables/useSpeech'

const anti = useAntiAddiction()
const wrong = useWrongRest()
const route = useRoute()
const router = useRouter()
const { speak } = useSpeech()
const tip = ref('')
let tipTimer: number | undefined
let tipAt = 0
const held = computed(() => anti.locked || wrong.locked)
const onQuiz = computed(() => /^\/level\/\d+$|^\/sense\/(?:calc|recognize)\/[^/]+$/.test(route.path))

function waitText() {
  if (wrong.locked && anti.locked) return '请等待休息结束'
  if (wrong.locked) return '请等待错题休息解除'
  return '请等待防沉迷解除'
}

function showWait() {
  const t = Date.now()
  if (t - tipAt < 700) return
  tipAt = t
  const text = waitText()
  tip.value = text
  speak(text)
  window.clearTimeout(tipTimer)
  tipTimer = window.setTimeout(() => (tip.value = ''), 1600)
}

watch(
  () => anti.locked || wrong.locked,
  (locked) => {
    if (!locked) return
    showWait()
    if (route.path !== '/') router.replace('/')
  },
)

onUnmounted(() => window.clearTimeout(tipTimer))
</script>

<template>
  <div class="shell">
    <div v-if="anti.enabled || wrong.locked" class="anti-spacer" :class="{ tall: anti.enabled && wrong.locked }" aria-hidden="true" />
    <p v-if="wrong.max && onQuiz" class="wrong-mini">错题 {{ wrong.wrongCount }}/{{ wrong.max }}</p>
    <div
      v-if="anti.enabled"
      class="anti-timer"
      :class="{ rest: anti.locked }"
      role="timer"
      :aria-label="anti.locked ? `休息还要${anti.restLabel}` : `还可以玩${anti.playLabel}`"
    >
      {{ anti.locked ? `休息 ${anti.restLabel}` : anti.playLabel }}
    </div>
    <div
      v-if="wrong.locked"
      class="anti-timer wrong-rest"
      :class="{ stack: anti.enabled }"
      role="timer"
      :aria-label="`错题休息还要${wrong.restLabel}`"
    >
      错题休息 {{ wrong.restLabel }}
    </div>
    <div class="view" :inert="held ? true : undefined">
      <router-view :key="$route.fullPath" />
    </div>
    <div v-if="held" class="anti-shield" @pointerdown.stop="showWait" @click.stop="showWait" />
    <button
      v-if="isAntiDebug && held && route.path !== '/settings'"
      class="anti-debug-open"
      type="button"
      @click="router.push('/settings')"
    >
      调试配置
    </button>
    <div id="anti-debug-root" class="anti-debug-root" />
    <div v-if="tip" class="anti-tip">{{ tip }}</div>
  </div>
</template>

<style>
.shell {
  position: relative;
  max-width: 430px;
  min-height: 100dvh;
  margin: 0 auto;
  background: var(--bg-cream);
  overflow-x: hidden;
  box-shadow: 0 0 40px rgba(92, 75, 81, 0.08);
}
.anti-spacer { height: 44px; }
.anti-spacer.tall { height: 82px; }
.wrong-mini {
  position: fixed;
  top: calc(2px + env(safe-area-inset-top));
  left: 50%;
  z-index: 50;
  margin: 0;
  transform: translateX(-50%);
  font-size: 12px;
  line-height: 16px;
  font-weight: 700;
  color: var(--ink-soft);
  white-space: nowrap;
  pointer-events: none;
}
.anti-timer {
  position: fixed;
  top: calc(8px + env(safe-area-inset-top));
  right: max(10px, calc((100% - 430px) / 2 + 10px));
  z-index: 50;
  min-width: 92px;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: #fff;
  box-shadow: var(--shadow);
  font-weight: 900;
  font-size: 16px;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.anti-timer.rest { background: var(--warn); }
.anti-timer.wrong-rest { background: var(--lavender); }
.anti-timer.stack { top: calc(46px + env(safe-area-inset-top)); }
.anti-shield {
  position: absolute;
  inset: 0;
  z-index: 40;
  background: transparent;
  cursor: not-allowed;
}
.anti-debug-open,
.anti-debug-root {
  position: fixed;
  z-index: 70;
  left: 50%;
  bottom: calc(18px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  width: min(398px, calc(100% - 32px));
}
.anti-debug-open {
  bottom: 0;
  min-height: 84px;
  border-radius: 22px 22px 0 0;
  background: var(--warn);
  font-size: 20px;
  font-weight: 900;
}
.anti-debug-root { pointer-events: none; }
.anti-debug-root > * { pointer-events: auto; }
.anti-tip {
  position: fixed;
  z-index: 80;
  left: 50%;
  top: 46%;
  transform: translate(-50%, -50%);
  max-width: min(320px, calc(100% - 48px));
  background: #fff;
  border-radius: 18px;
  padding: 14px 18px;
  font-size: 22px;
  font-weight: 900;
  text-align: center;
  box-shadow: var(--shadow);
  pointer-events: none;
  animation: pop 0.3s ease both;
}
</style>
