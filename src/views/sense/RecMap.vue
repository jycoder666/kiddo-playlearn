<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  ATTR_MODES,
  EXTRA_GROUPS,
  EXTRA_MODES,
  EXTRA_SLUG,
  MEMORY_MODES,
  MEMORY_SLUG,
  REC_MODES,
  modesByIds,
  type AttrModeId,
  type ExtraModeId,
  type MemoryModeId,
  type RecModeId,
} from '../../data/sense/meta'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { useSpeech } from '../../composables/useSpeech'
import StarsRow from '../../components/shared/StarsRow.vue'
import SpeakButton from '../../components/shared/SpeakButton.vue'
import ExtraInsertBanner from '../../components/sense/ExtraInsertBanner.vue'

const router = useRouter()
const {
  rec,
  attr,
  memory,
  extra,
  isRecUnlocked,
  isAttrUnlocked,
  isMemoryUnlocked,
  isExtraUnlocked,
} = useSenseProgress()
const { speak } = useSpeech()

const mapSpeak =
  '认一认。先认数字，再学颜色和图形，还能翻牌配对、练小眼睛和玩玩乐。点下面一关开始玩。'

const colorLine = ATTR_MODES.filter((m) => m.id === 'colorIntro' || m.id === 'colorQuiz')
const shapeLine = ATTR_MODES.filter((m) => m.id === 'shapeIntro' || m.id === 'shapeQuiz')
const comboMeta = ATTR_MODES.find((m) => m.id === 'combo')!

function openRec(id: string) {
  const mode = id as RecModeId
  if (!isRecUnlocked(mode)) {
    speak('先过前面这一关哦')
    return
  }
  router.push(`/sense/recognize/${mode}`)
}

function openAttr(id: string) {
  const mode = id as AttrModeId
  if (!isAttrUnlocked(mode)) {
    if (mode === 'colorQuiz') speak('先把颜色来报到翻完哦')
    else if (mode === 'shapeQuiz') speak('先把图形来报到翻完哦')
    else if (mode === 'combo') speak('认颜色和认图形都过关后才能玩')
    else speak('先过前面这一关哦')
    return
  }
  router.push(`/sense/recognize/${mode}`)
}

function openMemory(id: MemoryModeId) {
  if (!isMemoryUnlocked(id)) {
    speak('先过前面这一关哦')
    return
  }
  router.push(`/sense/memory/${MEMORY_SLUG[id]}`)
}

function openExtra(id: ExtraModeId) {
  if (!isExtraUnlocked(id)) {
    speak('先过前面这一关哦')
    return
  }
  router.push(`/sense/extra/${EXTRA_SLUG[id]}`)
}

function jump(id: string) {
  const el = document.getElementById(id)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="map">
    <header class="top">
      <button class="hot back" aria-label="回数感岛" @click="router.push('/sense')">←</button>
      <h1>认一认</h1>
      <SpeakButton :text="mapSpeak" />
    </header>

    <p class="lead">选一类开始 · 数字 → 颜色图形 → 翻牌 → 小游戏</p>

    <nav class="toc" aria-label="分区导航">
      <button type="button" class="toc-chip mint" @click="jump('sec-num')">🔢 数字</button>
      <button type="button" class="toc-chip peach" @click="jump('sec-attr')">🎨 颜色图形</button>
      <button type="button" class="toc-chip lavender" @click="jump('sec-memory')">🃏 翻牌</button>
      <button type="button" class="toc-chip coral" @click="jump('sec-extra')">👀 小游戏</button>
    </nav>

    <ExtraInsertBanner />

    <section id="sec-num" class="sec tone-mint">
      <header class="sec-head">
        <span class="sec-badge mint">1</span>
        <div>
          <h2>数字主线</h2>
          <p class="sec-blurb">字形 · 数量 · 邻居 · 分合</p>
        </div>
      </header>
      <div class="list">
        <button
          v-for="(m, i) in REC_MODES"
          :key="m.id"
          type="button"
          class="row"
          :class="{ locked: !isRecUnlocked(m.id as RecModeId) }"
          @click="openRec(m.id)"
        >
          <span class="idx mint">{{ isRecUnlocked(m.id as RecModeId) ? i + 1 : '🔒' }}</span>
          <span class="body">
            <span class="name">{{ m.emoji }} {{ m.name }}</span>
            <span class="blurb">{{ m.blurb }}</span>
            <StarsRow :count="rec.stars[m.id] ?? 0" :size="16" />
          </span>
        </button>
      </div>
    </section>

    <section id="sec-attr" class="sec tone-peach">
      <header class="sec-head">
        <span class="sec-badge peach">2</span>
        <div>
          <h2>颜色 · 图形</h2>
          <p class="sec-blurb">两路汇合 · 先来报到再认 · 再组合</p>
        </div>
      </header>
      <div class="dual">
        <div class="col">
          <p class="col-title">颜色线</p>
          <button
            v-for="m in colorLine"
            :key="m.id"
            type="button"
            class="row compact"
            :class="{ locked: !isAttrUnlocked(m.id as AttrModeId) }"
            @click="openAttr(m.id)"
          >
            <span class="idx peach">{{ isAttrUnlocked(m.id as AttrModeId) ? '·' : '🔒' }}</span>
            <span class="body">
              <span class="name">{{ m.emoji }} {{ m.name }}</span>
              <span class="blurb">{{ m.blurb }}</span>
              <StarsRow :count="attr.stars[m.id] ?? 0" :size="14" />
            </span>
          </button>
        </div>
        <div class="col">
          <p class="col-title">图形线</p>
          <button
            v-for="m in shapeLine"
            :key="m.id"
            type="button"
            class="row compact"
            :class="{ locked: !isAttrUnlocked(m.id as AttrModeId) }"
            @click="openAttr(m.id)"
          >
            <span class="idx sky">{{ isAttrUnlocked(m.id as AttrModeId) ? '·' : '🔒' }}</span>
            <span class="body">
              <span class="name">{{ m.emoji }} {{ m.name }}</span>
              <span class="blurb">{{ m.blurb }}</span>
              <StarsRow :count="attr.stars[m.id] ?? 0" :size="14" />
            </span>
          </button>
        </div>
      </div>
      <button
        type="button"
        class="row combo"
        :class="{ locked: !isAttrUnlocked('combo') }"
        @click="openAttr(comboMeta.id)"
      >
        <span class="idx rainbow">{{ isAttrUnlocked('combo') ? '★' : '🔒' }}</span>
        <span class="body">
          <span class="name">{{ comboMeta.emoji }} {{ comboMeta.name }}</span>
          <span class="blurb">{{ comboMeta.blurb }}</span>
          <StarsRow :count="attr.stars.combo ?? 0" :size="16" />
        </span>
      </button>
    </section>

    <section id="sec-memory" class="sec tone-lavender">
      <header class="sec-head">
        <span class="sec-badge lavender">3</span>
        <div>
          <h2>翻牌配对</h2>
          <p class="sec-blurb">数字 · 颜色 · 图形 · 算式</p>
        </div>
      </header>
      <div class="grid2">
        <button
          v-for="m in MEMORY_MODES"
          :key="m.id"
          type="button"
          class="row tile"
          :class="{ locked: !isMemoryUnlocked(m.id as MemoryModeId) }"
          @click="openMemory(m.id as MemoryModeId)"
        >
          <span class="emo">{{ m.emoji }}</span>
          <span class="body">
            <span class="name">{{ m.name }}</span>
            <span class="blurb">{{ m.blurb }}</span>
            <StarsRow :count="memory.stars[m.id] ?? 0" :size="14" />
          </span>
        </button>
      </div>
    </section>

    <div id="sec-extra" class="extra-wrap">
      <p class="extra-label">小游戏区 · 想玩哪一类？</p>
      <section
        v-for="g in EXTRA_GROUPS"
        :id="'sec-' + g.id"
        :key="g.id"
        class="sec"
        :class="'tone-' + g.tone"
      >
        <header class="sec-head">
          <span class="sec-badge" :class="g.tone">{{ g.title.slice(0, 1) }}</span>
          <div>
            <h2>{{ g.title }}</h2>
            <p class="sec-blurb">{{ g.blurb }}</p>
          </div>
        </header>
        <div class="grid2">
          <button
            v-for="m in modesByIds(EXTRA_MODES, g.ids)"
            :key="m.id"
            type="button"
            class="row tile"
            :class="{ locked: !isExtraUnlocked(m.id as ExtraModeId) }"
            @click="openExtra(m.id as ExtraModeId)"
          >
            <span class="emo">{{ m.emoji }}</span>
            <span class="body">
              <span class="name">{{ m.name }}</span>
              <span class="blurb">{{ m.blurb }}</span>
              <StarsRow :count="extra.stars[m.id] ?? 0" :size="14" />
            </span>
          </button>
        </div>
      </section>
      <p class="hint-calc">
        接算式、帽子藏宝在
        <button type="button" class="linkish" @click="router.push('/sense/calc')">算一算</button>
        里哦
      </p>
    </div>
  </div>
</template>

<style scoped>
.map {
  min-height: 100dvh;
  padding: 10px 14px calc(22px + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 12% 8%, rgba(184, 224, 210, 0.45) 0 70px, transparent 71px),
    radial-gradient(circle at 92% 18%, rgba(255, 196, 168, 0.4) 0 60px, transparent 61px),
    var(--bg-cream);
}
.top { display: grid; grid-template-columns: 72px 1fr 72px; align-items: center; }
h1 { margin: 0; text-align: center; font-size: 24px; font-weight: 900; }
.back { background: var(--card); box-shadow: var(--shadow); font-size: 26px; }
.lead {
  text-align: center;
  font-weight: 800;
  color: var(--ink-soft);
  margin: 6px 0 10px;
  font-size: 13px;
}
.toc {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 12px;
}
.toc-chip {
  border: none;
  border-radius: 14px;
  padding: 8px 4px;
  font-size: 12px;
  font-weight: 900;
  background: var(--card);
  box-shadow: 0 2px 0 rgba(92, 75, 81, 0.1);
  color: var(--ink);
}
.toc-chip.mint { background: #e8f7f1; }
.toc-chip.peach { background: #ffe8dc; }
.toc-chip.lavender { background: #efe8fa; }
.toc-chip.coral { background: #ffe4e0; }

.sec {
  margin-bottom: 16px;
  padding: 14px 12px 12px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 4px 0 rgba(92, 75, 81, 0.06);
}
.tone-mint { border: 2px solid rgba(184, 224, 210, 0.9); }
.tone-peach { border: 2px solid rgba(240, 160, 122, 0.55); }
.tone-lavender { border: 2px solid rgba(155, 142, 196, 0.55); }
.tone-warm { border: 2px solid rgba(255, 210, 122, 0.7); }
.tone-eye { border: 2px solid rgba(224, 122, 106, 0.45); }
.tone-play { border: 2px solid rgba(126, 184, 232, 0.55); }

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
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 900;
  font-size: 16px;
  flex-shrink: 0;
}
.sec-badge.mint, .mint.sec-badge { background: #5cb89a; }
.sec-badge.peach { background: #f0a07a; }
.sec-badge.lavender { background: #9b8ec4; }
.sec-badge.warm { background: #e8b04a; }
.sec-badge.eye { background: #e07a6a; }
.sec-badge.play { background: #6aa8d4; }
h2 { margin: 0; font-size: 18px; font-weight: 900; }
.sec-blurb { margin: 2px 0 0; font-size: 12px; font-weight: 700; color: var(--ink-soft); }

.list { display: flex; flex-direction: column; gap: 8px; }
.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.dual {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
}
.col { display: flex; flex-direction: column; gap: 8px; }
.col-title {
  margin: 0;
  text-align: center;
  font-size: 13px;
  font-weight: 800;
  color: var(--ink-soft);
}
.row {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px;
  border: none;
  border-radius: 18px;
  background: var(--card);
  box-shadow: 0 3px 0 rgba(92, 75, 81, 0.08);
  text-align: left;
  width: 100%;
}
.row.tile { flex-direction: column; align-items: flex-start; min-height: 108px; }
.row.tile .emo { font-size: 28px; line-height: 1; }
.row.compact { padding: 10px; gap: 8px; border-radius: 16px; }
.row.combo { margin-top: 2px; }
.row.locked { opacity: 0.55; }
.idx {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: #fff;
  font-weight: 900;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.row.compact .idx { width: 34px; height: 34px; font-size: 15px; }
.mint { background: var(--mint); }
.peach { background: #f0a07a; }
.sky { background: #7eb8d9; }
.lavender { background: #9b8ec4; }
.rainbow { background: linear-gradient(135deg, #f08a3a, #8e6cc9); }
.body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.name { font-size: 16px; font-weight: 900; }
.row.compact .name { font-size: 13px; }
.row.tile .name { font-size: 15px; }
.blurb { font-size: 12px; color: var(--ink-soft); font-weight: 700; }
.row.compact .blurb { font-size: 11px; }

.extra-wrap { margin-top: 4px; }
.extra-label {
  text-align: center;
  font-weight: 900;
  font-size: 14px;
  margin: 8px 0 10px;
  color: var(--ink);
}
.hint-calc {
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-soft);
  margin: 4px 0 0;
}
.linkish {
  border: none;
  background: none;
  color: #2f8f6e;
  font-weight: 900;
  font-size: inherit;
  text-decoration: underline;
  padding: 0;
}
</style>
