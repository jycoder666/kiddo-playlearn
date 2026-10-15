<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSpeech } from '../../composables/useSpeech'
import SpeakButton from '../../components/shared/SpeakButton.vue'

const router = useRouter()
const { speak } = useSpeech()

const islandSpeak = '数感岛。用玩一玩，把一到十认稳、算稳。点算一算或认一认开始。'

function openCompare() {
  speak('比一比马上就来，先玩算一算或认一认吧')
}
</script>

<template>
  <div class="island">
    <header class="top">
      <button class="hot back" aria-label="回主页" @click="router.push('/')">←</button>
      <h1>数感岛</h1>
      <SpeakButton :text="islandSpeak" />
    </header>
    <p class="lead">用玩一玩，把 1～10 认稳、算稳</p>

    <div class="cards">
      <button class="card locked" type="button" @click="openCompare">
        <span class="emo">⚖️</span>
        <span class="name">比一比</span>
        <span class="tag">即将开放</span>
      </button>
      <button class="card open" type="button" @click="router.push('/sense/calc')">
        <span class="emo">🧮</span>
        <span class="name">算一算</span>
        <span class="tag">点数 · 加减 · 分合</span>
      </button>
      <button class="card open mint" type="button" @click="router.push('/sense/recognize')">
        <span class="emo">🔢</span>
        <span class="name">认一认</span>
        <span class="tag">数字 · 邻居 · 互逆</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.island {
  min-height: 100dvh;
  padding: 10px 16px calc(20px + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 20% 20%, rgba(184, 224, 210, 0.55) 0 60px, transparent 61px),
    radial-gradient(circle at 90% 60%, rgba(255, 180, 162, 0.4) 0 50px, transparent 51px),
    var(--bg-cream);
}
.top {
  display: grid;
  grid-template-columns: 72px 1fr 72px;
  align-items: center;
}
h1 { margin: 0; text-align: center; font-size: 28px; }
.back { background: var(--card); box-shadow: var(--shadow); font-size: 26px; }
.lead { text-align: center; font-weight: 800; color: var(--ink-soft); margin: 8px 0 20px; }
.cards { display: flex; flex-direction: column; gap: 14px; }
.card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 22px 20px;
  border-radius: 28px;
  background: var(--card);
  box-shadow: var(--shadow);
  text-align: left;
}
.card.open { background: linear-gradient(135deg, #fff 40%, #ffe8e2); }
.card.open.mint { background: linear-gradient(135deg, #fff 40%, #e4f5ef); }
.card.locked { opacity: 0.72; }
.emo { font-size: 40px; }
.name { font-size: 26px; font-weight: 900; }
.tag { font-size: 16px; font-weight: 700; color: var(--ink-soft); }
</style>
