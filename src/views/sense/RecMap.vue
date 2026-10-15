<script setup lang="ts">
import { useRouter } from 'vue-router'
import { REC_MODES, type RecModeId } from '../../data/sense/meta'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { useSpeech } from '../../composables/useSpeech'
import StarsRow from '../../components/shared/StarsRow.vue'
import SpeakButton from '../../components/shared/SpeakButton.vue'

const router = useRouter()
const { rec, isRecUnlocked } = useSenseProgress()
const { speak } = useSpeech()

const mapSpeak = '认一认数字。字形、数量、邻居、分合。点下面一关开始玩。'

function open(id: string) {
  const mode = id as RecModeId
  if (!isRecUnlocked(mode)) {
    speak('先过前面这一关哦')
    return
  }
  router.push(`/sense/recognize/${mode}`)
}
</script>

<template>
  <div class="map">
    <header class="top">
      <button class="hot back" @click="router.push('/sense')">←</button>
      <h1>认一认 · 数字</h1>
      <SpeakButton :text="mapSpeak" />
    </header>
    <p class="lead">字形 · 数量 · 邻居 · 分合</p>
    <div class="list">
      <button
        v-for="(m, i) in REC_MODES"
        :key="m.id"
        type="button"
        class="row"
        :class="{ locked: !isRecUnlocked(m.id as RecModeId) }"
        @click="open(m.id)"
      >
        <span class="idx">{{ isRecUnlocked(m.id as RecModeId) ? i + 1 : '🔒' }}</span>
        <span class="body">
          <span class="name">{{ m.emoji }} {{ m.name }}</span>
          <span class="blurb">{{ m.blurb }}</span>
          <StarsRow :count="rec.stars[m.id] ?? 0" :size="16" />
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.map {
  min-height: 100dvh;
  padding: 10px 14px calc(20px + env(safe-area-inset-bottom));
  background: var(--bg-cream);
}
.top { display: grid; grid-template-columns: 72px 1fr 72px; align-items: center; }
h1 { margin: 0; text-align: center; font-size: 22px; }
.back { background: var(--card); box-shadow: var(--shadow); font-size: 26px; }
.lead { text-align: center; font-weight: 800; color: var(--ink-soft); margin: 6px 0 14px; }
.list { display: flex; flex-direction: column; gap: 10px; }
.row {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border-radius: 22px;
  background: var(--card);
  box-shadow: var(--shadow);
  text-align: left;
}
.row.locked { opacity: 0.55; }
.idx {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--mint);
  color: #fff;
  font-weight: 900;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.body { display: flex; flex-direction: column; gap: 2px; }
.name { font-size: 18px; font-weight: 900; }
.blurb { font-size: 14px; color: var(--ink-soft); font-weight: 700; }
</style>
