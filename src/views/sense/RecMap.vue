<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  ATTR_MODES,
  MEMORY_MODES,
  REC_MODES,
  type AttrModeId,
  type RecModeId,
} from '../../data/sense/meta'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { useSpeech } from '../../composables/useSpeech'
import StarsRow from '../../components/shared/StarsRow.vue'
import SpeakButton from '../../components/shared/SpeakButton.vue'

const router = useRouter()
const { rec, attr, memory, isRecUnlocked, isAttrUnlocked, isMemoryUnlocked } = useSenseProgress()
const { speak } = useSpeech()

const mapSpeak = '认一认。先玩数字，也可以学颜色和图形，还能玩记忆翻牌。点下面一关开始玩。'

const colorLine = ATTR_MODES.filter((m) => m.id === 'colorIntro' || m.id === 'colorQuiz')
const shapeLine = ATTR_MODES.filter((m) => m.id === 'shapeIntro' || m.id === 'shapeQuiz')
const comboMeta = ATTR_MODES.find((m) => m.id === 'combo')!
const memoryMeta = MEMORY_MODES.find((m) => m.id === 'numPair')!

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

function openMemory() {
  if (!isMemoryUnlocked('numPair')) {
    speak('先过前面这一关哦')
    return
  }
  router.push('/sense/memory/num-pair')
}
</script>

<template>
  <div class="map">
    <header class="top">
      <button class="hot back" @click="router.push('/sense')">←</button>
      <h1>认一认</h1>
      <SpeakButton :text="mapSpeak" />
    </header>

    <section class="sec">
      <h2>数字</h2>
      <p class="lead">字形 · 数量 · 邻居 · 分合</p>
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

    <section class="sec">
      <h2>记忆</h2>
      <p class="lead">翻牌 · 数字对数量</p>
      <div class="list">
        <button
          type="button"
          class="row"
          :class="{ locked: !isMemoryUnlocked('numPair') }"
          @click="openMemory"
        >
          <span class="idx lavender">{{ isMemoryUnlocked('numPair') ? '·' : '🔒' }}</span>
          <span class="body">
            <span class="name">{{ memoryMeta.emoji }} {{ memoryMeta.name }}</span>
            <span class="blurb">{{ memoryMeta.blurb }}</span>
            <StarsRow :count="memory.stars.numPair ?? 0" :size="16" />
          </span>
        </button>
      </div>
    </section>

    <section class="sec">
      <h2>颜色 · 图形</h2>
      <p class="lead">两路汇合 · 先来报到再认 · 再组合</p>
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
h2 { margin: 18px 0 0; text-align: center; font-size: 18px; font-weight: 900; }
.back { background: var(--card); box-shadow: var(--shadow); font-size: 26px; }
.lead { text-align: center; font-weight: 800; color: var(--ink-soft); margin: 4px 0 12px; font-size: 14px; }
.list { display: flex; flex-direction: column; gap: 10px; }
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
  gap: 12px;
  align-items: center;
  padding: 14px;
  border-radius: 22px;
  background: var(--card);
  box-shadow: var(--shadow);
  text-align: left;
  width: 100%;
}
.row.compact { padding: 10px; gap: 8px; border-radius: 18px; }
.row.combo { margin-top: 2px; }
.row.locked { opacity: 0.55; }
.idx {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: #fff;
  font-weight: 900;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.row.compact .idx { width: 36px; height: 36px; font-size: 16px; }
.mint { background: var(--mint); }
.peach { background: #f0a07a; }
.sky { background: #7eb8d9; }
.lavender { background: #9b8ec4; }
.rainbow { background: linear-gradient(135deg, #f08a3a, #8e6cc9); }
.body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.name { font-size: 18px; font-weight: 900; }
.row.compact .name { font-size: 14px; }
.blurb { font-size: 14px; color: var(--ink-soft); font-weight: 700; }
.row.compact .blurb { font-size: 12px; }
</style>
