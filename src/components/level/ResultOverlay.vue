<script setup lang="ts">
import { computed } from 'vue'
import type { LevelMeta } from '../../data/levelMeta'
import StarsRow from '../shared/StarsRow.vue'
import ArtImg from '../shared/ArtImg.vue'
import HeroSprite from '../shared/HeroSprite.vue'

const props = defineProps<{
  meta: LevelMeta
  stars: number
  passed: boolean
  newSticker: boolean
  newUnlock: boolean
  hasNext: boolean
}>()
defineEmits<{ next: []; replay: []; map: [] }>()

const headline = computed(() => (props.passed ? (props.stars === 3 ? '太厉害啦！' : '过关啦！') : '完成啦！'))
const sub = computed(() => (props.passed ? (props.newUnlock ? '新关卡打开了' : '你真棒') : '再练一次会更熟'))
</script>

<template>
  <div class="overlay">
    <div class="card">
      <HeroSprite pose="happy" :width="110" />
      <h2>{{ headline }}</h2>
      <StarsRow :count="stars" :size="64" animate />
      <p class="sub">{{ sub }}</p>

      <div v-if="newSticker" class="sticker-drop">
        <div class="sticker">
          <ArtImg :name="meta.sticker" :alt="meta.stickerName">
            <span class="sticker-fallback">{{ meta.stickerEmoji }}</span>
          </ArtImg>
        </div>
        <span>得到{{ meta.stickerName }}</span>
      </div>

      <div class="actions">
        <template v-if="passed">
          <button v-if="hasNext" class="hot btn-primary" :class="{ glow: newUnlock }" @click="$emit('next')">下一关 ▶</button>
          <button v-else class="hot btn-primary" @click="$emit('map')">回地图</button>
          <div class="row">
            <button class="hot btn-secondary" @click="$emit('replay')">再玩一次</button>
            <button v-if="hasNext" class="hot btn-secondary" @click="$emit('map')">回地图</button>
          </div>
        </template>
        <template v-else>
          <button class="hot btn-primary" @click="$emit('replay')">再玩一次</button>
          <div class="row">
            <button class="hot btn-secondary" @click="$emit('map')">回地图</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(92, 75, 81, 0.35);
  animation: fadeIn 0.25s ease both;
  padding: 16px;
}
.card {
  width: 100%;
  max-width: 360px;
  background: var(--bg-cream);
  border-radius: 32px;
  padding: 18px 18px 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 0 rgba(92, 75, 81, 0.15);
  animation: pop 0.4s ease both;
}
h2 { margin: 0; font-size: 32px; }
.sub { margin: 0; font-size: 20px; font-weight: 700; color: var(--ink-soft); }
.sticker-drop { display: flex; align-items: center; gap: 12px; font-weight: 800; font-size: 18px; }
.sticker {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--lavender);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pop 0.6s 0.8s ease both;
  box-shadow: var(--shadow);
}
.sticker-fallback { font-size: 44px; }
.actions { display: flex; flex-direction: column; gap: 12px; width: 100%; margin-top: 8px; }
.actions .btn-primary { width: 100%; }
.row { display: flex; gap: 10px; }
.row .btn-secondary { flex: 1; padding: 0 8px; }
.glow { animation: breathe 1.2s ease-in-out infinite; }
</style>
