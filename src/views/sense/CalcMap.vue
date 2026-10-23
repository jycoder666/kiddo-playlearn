<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  CALC_GROUPS,
  CALC_MODES,
  CALC_SIDE_LINKS,
  modesByIds,
  type CalcModeId,
} from '../../data/sense/meta'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { useSpeech } from '../../composables/useSpeech'
import StarsRow from '../../components/shared/StarsRow.vue'
import SpeakButton from '../../components/shared/SpeakButton.vue'
import ExtraInsertBanner from '../../components/sense/ExtraInsertBanner.vue'

const router = useRouter()
const { calc, isCalcUnlocked } = useSenseProgress()
const { speak } = useSpeech()

const mapSpeak =
  '算一算。先练点数和分合加减，再玩口算小游戏和闯关。点下面一关开始玩。'

function open(id: string) {
  const mode = id as CalcModeId
  if (!isCalcUnlocked(mode)) {
    speak('先过前面这一关哦')
    return
  }
  router.push(`/sense/calc/${mode}`)
}

function openSide(path: string) {
  if (path.startsWith('/sense/calc/')) {
    const mode = path.split('/').pop() as CalcModeId
    if (!isCalcUnlocked(mode)) {
      speak('先过前面这一关哦')
      return
    }
  }
  router.push(path)
}

function orderIndex(id: string) {
  return CALC_MODES.findIndex((m) => m.id === id) + 1
}
</script>

<template>
  <div class="map">
    <header class="top">
      <button class="hot back" aria-label="回数感岛" @click="router.push('/sense')">←</button>
      <h1>算一算</h1>
      <SpeakButton :text="mapSpeak" />
    </header>
    <p class="lead">点数 → 分合加减 → 口算小游戏 → 闯关</p>
    <ExtraInsertBanner />

    <section
      v-for="(g, gi) in CALC_GROUPS"
      :key="g.title"
      class="sec"
      :class="'tone-' + gi"
    >
      <header class="sec-head">
        <span class="sec-badge">{{ gi + 1 }}</span>
        <div>
          <h2>{{ g.title }}</h2>
          <p class="sec-blurb">{{ g.blurb }}</p>
        </div>
      </header>
      <div class="list">
        <button
          v-for="m in modesByIds(CALC_MODES, g.ids)"
          :key="m.id"
          type="button"
          class="row"
          :class="{ locked: !isCalcUnlocked(m.id as CalcModeId) }"
          @click="open(m.id)"
        >
          <span class="idx">{{
            isCalcUnlocked(m.id as CalcModeId) ? orderIndex(m.id) : '🔒'
          }}</span>
          <span class="body">
            <span class="name">{{ m.emoji }} {{ m.name }}</span>
            <span class="blurb">{{ m.blurb }}</span>
            <StarsRow :count="calc.stars[m.id] ?? 0" :size="16" />
          </span>
        </button>
      </div>
    </section>

    <section class="sec tone-side">
      <header class="sec-head">
        <span class="sec-badge side">★</span>
        <div>
          <h2>口算小游戏</h2>
          <p class="sec-blurb">轻松练 · 无限时</p>
        </div>
      </header>
      <div class="grid2">
        <button
          v-for="s in CALC_SIDE_LINKS"
          :key="s.id"
          type="button"
          class="row tile"
          @click="openSide(s.path)"
        >
          <span class="emo">{{ s.emoji }}</span>
          <span class="body">
            <span class="name">{{ s.name }}</span>
            <span class="blurb">{{ s.blurb }}</span>
          </span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.map {
  min-height: 100dvh;
  padding: 10px 14px calc(22px + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 80% 10%, rgba(255, 180, 162, 0.4) 0 70px, transparent 71px),
    radial-gradient(circle at 10% 40%, rgba(255, 220, 180, 0.35) 0 60px, transparent 61px),
    var(--bg-cream);
}
.top { display: grid; grid-template-columns: 72px 1fr 72px; align-items: center; }
h1 { margin: 0; text-align: center; font-size: 24px; font-weight: 900; }
.back { background: var(--card); box-shadow: var(--shadow); font-size: 26px; }
.lead {
  text-align: center;
  font-weight: 800;
  color: var(--ink-soft);
  margin: 6px 0 12px;
  font-size: 13px;
}
.sec {
  margin-bottom: 14px;
  padding: 14px 12px 12px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.75);
  box-shadow: 0 4px 0 rgba(92, 75, 81, 0.06);
}
.tone-0 { border: 2px solid rgba(255, 180, 140, 0.55); }
.tone-1 { border: 2px solid rgba(240, 160, 122, 0.5); }
.tone-2 { border: 2px solid rgba(232, 176, 74, 0.55); }
.tone-side { border: 2px solid rgba(126, 184, 232, 0.55); }
.sec-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.sec-badge {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: var(--hero, #f08a5a);
  color: #fff;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sec-badge.side { background: #6aa8d4; }
h2 { margin: 0; font-size: 17px; font-weight: 900; }
.sec-blurb { margin: 2px 0 0; font-size: 12px; font-weight: 700; color: var(--ink-soft); }
.list { display: flex; flex-direction: column; gap: 8px; }
.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.row {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: none;
  border-radius: 18px;
  background: var(--card);
  box-shadow: 0 3px 0 rgba(92, 75, 81, 0.08);
  text-align: left;
  width: 100%;
}
.row.tile { flex-direction: column; align-items: flex-start; min-height: 100px; }
.row.tile .emo { font-size: 28px; }
.row.locked { opacity: 0.55; }
.idx {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--hero, #f08a5a);
  color: #fff;
  font-weight: 900;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.name { font-size: 17px; font-weight: 900; }
.row.tile .name { font-size: 15px; }
.blurb { font-size: 13px; color: var(--ink-soft); font-weight: 700; }
.row.tile .blurb { font-size: 12px; }
</style>
