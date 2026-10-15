<script setup lang="ts">
import { useRouter } from 'vue-router'
import { LEVELS } from '../data/levelMeta'
import { useProgress } from '../composables/useProgress'
import ArtImg from '../components/shared/ArtImg.vue'

const router = useRouter()
const { state } = useProgress()
</script>

<template>
  <div class="stickers">
    <header class="top">
      <button class="hot back" aria-label="回地图" @click="router.push('/')">
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M30 10 L16 24 L30 38" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
      <h1>我的贴纸</h1>
    </header>
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
  </div>
</template>

<style scoped>
.stickers { min-height: 100dvh; background: var(--bg-cream); padding: 12px 16px; }
.top { display: flex; align-items: center; gap: 12px; }
.back { background: var(--card); box-shadow: var(--shadow); }
.back svg { width: 30px; height: 30px; }
h1 { margin: 0; font-size: 28px; }
.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 20px; }
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
