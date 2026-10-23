<script setup lang="ts">
import ArtImg from './ArtImg.vue'

withDefaults(defineProps<{ count: number; size?: number; animate?: boolean }>(), { size: 20, animate: false })
</script>

<template>
  <div class="stars" :aria-label="`${count} 颗星`">
    <span
      v-for="i in 3"
      :key="i"
      class="star"
      :class="{ on: i <= count, pop: animate && i <= count }"
      :style="{ width: size + 'px', height: size + 'px', fontSize: size + 'px', animationDelay: `${(i - 1) * 0.25}s` }"
    >
      <ArtImg :name="i <= count ? 'star_on.png' : 'star_off.png'">★</ArtImg>
    </span>
  </div>
</template>

<style scoped>
.stars { display: inline-flex; gap: 4px; align-items: center; }
.star {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  color: #E3D8DC;
  text-shadow: 0 1px 0 rgba(92, 75, 81, 0.15);
}
.star.on { color: var(--gold); text-shadow: 0 2px 0 #E0A92E; }
.star.pop { animation: pop 0.5s ease both; }
</style>
