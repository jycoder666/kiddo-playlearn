<script setup lang="ts">
import HeroSprite from '../shared/HeroSprite.vue'

defineProps<{
  show: boolean
  text?: string
}>()
</script>

<template>
  <div v-if="show" class="burst" aria-live="polite">
    <div class="card">
      <div class="sparks" aria-hidden="true">
        <span v-for="i in 8" :key="i" class="dot" :style="{ '--i': i }" />
      </div>
      <HeroSprite pose="happy" :width="96" />
      <p class="msg">{{ text || '太棒了！' }}</p>
      <p class="sub">你真棒</p>
    </div>
  </div>
</template>

<style scoped>
.burst {
  position: fixed;
  inset: 0;
  z-index: 45;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(92, 75, 81, 0.28);
  animation: fadeIn 0.2s ease both;
  pointer-events: none;
  padding: 20px;
}
.card {
  position: relative;
  width: min(300px, 100%);
  background: var(--bg-cream);
  border-radius: 28px;
  padding: 22px 18px 18px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 12px 40px rgba(92, 75, 81, 0.18);
  animation: pop 0.35s cubic-bezier(0.2, 1.2, 0.4, 1) both;
}
.card :deep(.hero) {
  margin: 0 auto;
}
.msg {
  margin: 8px 0 0;
  font-size: 30px;
  font-weight: 900;
}
.sub {
  margin: 4px 0 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--ink-soft);
}
.sparks {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: 28px;
}
.dot {
  position: absolute;
  left: 50%;
  top: 42%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--gold);
  opacity: 0;
  animation: spray 0.9s ease forwards;
  animation-delay: calc(var(--i) * 0.04s);
  transform: rotate(calc(var(--i) * 45deg)) translateY(0);
}
.dot:nth-child(odd) { background: var(--hero); }
.dot:nth-child(3n) { background: var(--mint); }
@keyframes spray {
  0% { opacity: 1; transform: rotate(calc(var(--i) * 45deg)) translateY(0) scale(0.6); }
  100% { opacity: 0; transform: rotate(calc(var(--i) * 45deg)) translateY(-72px) scale(1.1); }
}
@keyframes pop {
  from { transform: scale(0.82); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
