<script setup lang="ts">
import { useRouter } from 'vue-router'
import { LEVELS } from '../data/levelMeta'
import { useProgress } from '../composables/useProgress'
import { useSenseStickers } from '../composables/useSenseStickers'
import ArtImg from '../components/shared/ArtImg.vue'

const router = useRouter()
const { state } = useProgress()
const { owned, stickers } = useSenseStickers()
</script>

<template>
  <div class="stickers">
    <header class="top">
      <button class="hot back" aria-label="回地图" @click="router.push('/')">
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M30 10 L16 24 L30 38" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
      <h1>我的贴纸</h1>
    </header>

    <h2>方向关</h2>
    <div class="grid">
      <div v-for="l in LEVELS" :key="l.id" class="slot" :class="{ owned: state.stickers[l.id] }">
        <div class="face">
          <template v-if="state.stickers[l.id]">
            <ArtImg :name="l.sticker" :alt="l.stickerName"><span class="emoji">{{ l.stickerEmoji }}</span></ArtImg>
          </template>
          <span v-else class="emoji unknown">?</span>
        </div>
        <span class="name">{{ state.stickers[l.id] ? l.stickerName : `第${l.id}关` }}</span>
      </div>
    </div>

    <h2>数感岛</h2>
    <p class="lead">通关热身、观察、口算等可解锁</p>
    <div class="grid">
      <div v-for="s in stickers" :key="s.id" class="slot" :class="{ owned: owned[s.id] }">
        <div class="face">
          <span class="emoji" :class="{ unknown: !owned[s.id] }">{{ owned[s.id] ? s.emoji : '?' }}</span>
        </div>
        <span class="name">{{ owned[s.id] ? s.name : '未解锁' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stickers { min-height: 100dvh; background: var(--bg-cream); padding: 12px 16px calc(24px + env(safe-area-inset-bottom)); }
.top { display: flex; align-items: center; gap: 12px; }
.back { background: var(--card); box-shadow: var(--shadow); }
.back svg { width: 30px; height: 30px; }
h1 { margin: 0; font-size: 28px; }
h2 { margin: 22px 0 0; text-align: center; font-size: 18px; }
.lead { text-align: center; font-weight: 700; color: var(--ink-soft); margin: 4px 0 10px; font-size: 14px; }
.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 12px; }
.slot { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.face {
  width: 128px;
  height: 128px;
  border-radius: 50%;
  background: var(--locked);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow);
}
.owned .face { background: var(--lavender); }
.emoji { font-size: 64px; }
.unknown { color: #fff; font-weight: 900; }
.name { font-weight: 800; font-size: 18px; }
</style>
