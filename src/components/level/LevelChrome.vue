<script setup lang="ts">
import StarsRow from '../shared/StarsRow.vue'

defineProps<{ title: string; index: number; total: number; best: number }>()
defineEmits<{ back: [] }>()
</script>

<template>
  <header class="chrome">
    <button class="hot back" aria-label="回地图" @click="$emit('back')">
      <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M30 10 L16 24 L30 38" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" /></svg>
      <span>地图</span>
    </button>
    <div class="mid">
      <b class="title">{{ title }}</b>
      <span class="count">{{ Math.min(index + 1, total) }} / {{ total }}</span>
    </div>
    <StarsRow :count="best" :size="18" />
  </header>
</template>

<style scoped>
.chrome {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px 4px;
}
.back {
  flex-direction: column;
  gap: 0;
  background: var(--card);
  box-shadow: var(--shadow);
  font-size: 13px;
}
.back svg { width: 28px; height: 28px; }
.mid { flex: 1; display: flex; flex-direction: column; align-items: center; }
.title { font-size: 22px; }
.count { font-size: 16px; color: var(--ink-soft); font-weight: 700; }
</style>
