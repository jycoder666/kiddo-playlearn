<script setup lang="ts">
defineProps<{ text: string; icon: string; showIcon: boolean; speaking: boolean }>()
defineEmits<{ replay: [] }>()
</script>

<template>
  <section class="prompt">
    <button class="hot speaker" :class="{ speaking }" aria-label="再听一次" @click="$emit('replay')">
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M8 18 H16 L26 9 V39 L16 30 H8 Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
        <path class="wave w1" d="M32 18 Q36 24 32 30" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
        <path class="wave w2" d="M37 13 Q44 24 37 35" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
      </svg>
    </button>
    <p class="text">
      <span v-if="showIcon && icon" class="icon">{{ icon }}</span>
      <span>{{ text }}</span>
    </p>
  </section>
</template>

<style scoped>
.prompt {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 6px 12px;
  padding: 8px 14px 8px 8px;
  background: var(--card);
  border-radius: 26px;
  box-shadow: var(--shadow);
}
.speaker { background: var(--accent); color: var(--ink); flex-shrink: 0; }
.speaker svg { width: 40px; height: 40px; }
.speaking .w1 { animation: fadeIn 0.6s ease-in-out infinite alternate; }
.speaking .w2 { animation: fadeIn 0.6s 0.3s ease-in-out infinite alternate; }
.text { margin: 0; font-size: 26px; font-weight: 800; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.icon { font-size: 30px; padding: 2px 8px; background: #FFF4D6; border-radius: 14px; }
</style>
