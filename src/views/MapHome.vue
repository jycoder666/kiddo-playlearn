<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { LEVELS, getLevelMeta } from '../data/levelMeta'
import { useProgress } from '../composables/useProgress'
import { useSettings } from '../composables/useSettings'
import { useSpeech } from '../composables/useSpeech'
import StarsRow from '../components/shared/StarsRow.vue'
import HeroSprite from '../components/shared/HeroSprite.vue'
import SpeakButton from '../components/shared/SpeakButton.vue'

const router = useRouter()
const { state, loadFailed, isUnlocked, dismissLoadError } = useProgress()
const settings = useSettings()
const { speak } = useSpeech()

const homeSpeak = '小兔辨方向。点关卡开始玩，也可以去数感岛。'

const STEP = 112
const TOP = 96
const mapHeight = TOP + STEP * (LEVELS.length - 1) + 90
const nodes = computed(() =>
  LEVELS.map((l, i) => ({ ...l, x: i % 2 === 0 ? 30 : 70, y: TOP + i * STEP })),
)
const pathD = computed(() =>
  nodes.value
    .map((n, i) => {
      if (i === 0) return `M ${n.x} ${n.y}`
      const p = nodes.value[i - 1]
      const my = (p.y + n.y) / 2
      return `C ${p.x} ${my}, ${n.x} ${my}, ${n.x} ${n.y}`
    })
    .join(' '),
)

const currentLevel = computed(() => {
  const open = LEVELS.find((l) => isUnlocked(l.id) && (state.highestStars[l.id] ?? 0) < 2)
  return open?.id ?? state.unlockedMax
})

const showStartHint = computed(() => !settings.introSeen && state.unlockedMax === 1 && !state.highestStars[1])
const run = computed(() => (state.incompleteRun && state.incompleteRun.answers.length > 0 ? state.incompleteRun : null))
const runMeta = computed(() => (run.value ? getLevelMeta(run.value.levelId) : undefined))

const lockedTip = ref<number | null>(null)
let tipTimer: number | undefined

function tapNode(id: number) {
  if (!isUnlocked(id)) {
    lockedTip.value = id
    speak('先过前面这一关哦')
    window.clearTimeout(tipTimer)
    tipTimer = window.setTimeout(() => (lockedTip.value = null), 1800)
    return
  }
  settings.introSeen = true
  router.push(`/level/${id}`)
}

function continueRun() {
  if (!run.value) return
  settings.introSeen = true
  router.push({ path: `/level/${run.value.levelId}`, query: { resume: '1' } })
}

</script>

<template>
  <div class="home">
    <header class="top">
      <h1>小兔辨方向</h1>
      <div class="tools">
        <button class="hot tool" aria-label="数感岛" @click="router.push('/sense')">🔢</button>
        <SpeakButton class="tool" :text="homeSpeak" />
        <button class="hot tool" aria-label="贴纸册" @click="router.push('/stickers')">📒</button>
      </div>
    </header>

    <section class="map" :style="{ height: mapHeight + 'px' }">
      <svg class="path" :viewBox="`0 0 100 ${mapHeight}`" preserveAspectRatio="none" aria-hidden="true">
        <path :d="pathD" fill="none" stroke="#F3C9D3" stroke-width="14" stroke-linecap="round" vector-effect="non-scaling-stroke" />
        <path :d="pathD" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="2 14" stroke-linecap="round" vector-effect="non-scaling-stroke" />
      </svg>

      <div
        v-for="n in nodes"
        :key="n.id"
        class="node-wrap"
        :style="{ left: n.x + '%', top: n.y + 'px' }"
      >
        <button
          class="node"
          :class="{
            locked: !isUnlocked(n.id),
            current: n.id === currentLevel,
            done: (state.highestStars[n.id] ?? 0) >= 2,
          }"
          :aria-label="`第${n.id}关 ${n.name}`"
          @click="tapNode(n.id)"
        >
          <span class="num">{{ isUnlocked(n.id) ? n.id : '🔒' }}</span>
        </button>
        <span class="label">{{ n.name }}</span>
        <StarsRow :count="state.highestStars[n.id] ?? 0" :size="18" />

        <div v-if="n.id === currentLevel" class="buddy" :class="n.x < 50 ? 'right' : 'left'">
          <HeroSprite pose="idle" :width="54" />
        </div>
        <div v-if="lockedTip === n.id" class="bubble">先过前面这一关哦</div>
        <div v-else-if="n.id === 1 && showStartHint" class="bubble start">点这里开始 👆</div>
      </div>
    </section>

    <footer class="bottom">
      <button v-if="run && runMeta" class="hot btn-primary continue" @click="continueRun">
        ▶ 继续上次 · 第{{ run.levelId }}关 {{ runMeta.name }}
      </button>
    </footer>

    <div v-if="loadFailed" class="modal">
      <div class="dialog">
        <p>进度读不出来<br /><small>从第一关开始吧</small></p>
        <button class="hot btn-primary" @click="dismissLoadError">好的</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  position: relative;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at 12% 18%, rgba(226, 209, 249, 0.55) 0 40px, transparent 41px),
    radial-gradient(circle at 88% 42%, rgba(184, 224, 210, 0.6) 0 54px, transparent 55px),
    radial-gradient(circle at 18% 78%, rgba(247, 197, 159, 0.45) 0 46px, transparent 47px),
    var(--bg-cream);
}
.top { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px 0; }
h1 { margin: 0; font-size: 28px; letter-spacing: 1px; }
.tools { display: flex; gap: 8px; }
.tool { background: var(--card); box-shadow: var(--shadow); font-size: 30px; }
.map { position: relative; margin: 8px 0; flex-shrink: 0; }
.path { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.node-wrap {
  position: absolute;
  transform: translate(-50%, -48px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.node {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: var(--hero);
  border: 5px solid #fff;
  box-shadow: 0 6px 0 #E8907C;
  display: flex;
  align-items: center;
  justify-content: center;
}
.node.done { background: var(--mint); box-shadow: 0 6px 0 #8FC7B2; }
.node.current { animation: breathe 1.6s ease-in-out infinite; background: var(--hero); box-shadow: 0 6px 0 #E8907C, 0 0 0 8px rgba(255, 180, 162, 0.35); }
.node.locked { background: var(--locked); box-shadow: 0 6px 0 #CFC2C6; }
.num { font-size: 38px; font-weight: 900; color: #fff; text-shadow: 0 2px 0 rgba(92, 75, 81, 0.25); }
.locked .num { font-size: 30px; }
.label { font-size: 17px; font-weight: 800; margin-top: 6px; }
.buddy { position: absolute; top: 14px; }
.buddy.right { left: calc(100% + 4px); }
.buddy.left { right: calc(100% + 4px); }
.bubble {
  position: absolute;
  top: -40px;
  white-space: nowrap;
  background: #fff;
  border-radius: 16px;
  padding: 6px 12px;
  font-size: 16px;
  font-weight: 800;
  box-shadow: var(--shadow);
  animation: pop 0.3s ease both;
  z-index: 3;
}
.bubble.start { background: var(--warn); }
.bottom { margin-top: auto; padding: 8px 16px calc(18px + env(safe-area-inset-bottom)); min-height: 96px; display: flex; align-items: center; }
.continue { width: 100%; font-size: 20px; }
.modal {
  position: absolute;
  inset: 0;
  z-index: 40;
  background: rgba(92, 75, 81, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.dialog { background: var(--bg-cream); border-radius: 28px; padding: 24px; width: 100%; max-width: 320px; text-align: center; }
.dialog p { margin: 0 0 16px; font-size: 26px; font-weight: 800; }
.dialog small { font-size: 18px; color: var(--ink-soft); }
.dialog .hot { width: 100%; }
</style>
