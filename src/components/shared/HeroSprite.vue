<script lang="ts">
export type Pose = 'idle' | 'happy' | 'hand_left' | 'hand_right' | 'walk'
</script>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { artUrl } from '../../composables/useArt'
import BunnySvg from './BunnySvg.vue'

const props = withDefaults(defineProps<{ pose?: Pose; width?: number; wiggle?: 'L' | 'R' | null }>(), {
  pose: 'idle',
  width: 200,
  wiggle: null,
})

const FILE: Record<Pose, string> = {
  idle: 'hero_idle_back.png',
  happy: 'hero_happy_back.png',
  hand_left: 'hero_hand_left_back.png',
  hand_right: 'hero_hand_right_back.png',
  walk: 'hero_walk_back.png',
}

const broken = reactive<Record<string, boolean>>({})
const file = computed(() => FILE[props.pose])
const src = computed(() => (broken[file.value] ? null : artUrl(file.value)))
</script>

<template>
  <div class="hero" :style="{ width: width + 'px', height: width * 1.2 + 'px' }">
    <img
      v-if="src"
      :src="src"
      alt="背对你的小兔子"
      draggable="false"
      :class="{ happy: pose === 'happy' }"
      @error="broken[file] = true"
    />
    <BunnySvg v-else :pose="pose" :wiggle="wiggle" />
  </div>
</template>

<style scoped>
.hero { position: relative; pointer-events: none; }
.hero img { width: 100%; height: 100%; object-fit: contain; display: block; }
.hero img.happy { animation: bounce 0.6s ease 2; }
</style>
