<script setup lang="ts">
defineProps<{
  show: boolean
  title?: string
  sticker?: boolean
  /** 中间按钮文案；分一分过关后可继续找用「继续找其他分法」 */
  againLabel?: string
}>()
const emit = defineEmits<{ next: []; again: []; home: [] }>()
</script>

<template>
  <div v-if="show" class="mask">
    <div class="card">
      <div class="spark">✨</div>
      <p class="t">{{ title || '太棒了！' }}</p>
      <p v-if="sticker" class="sticker">🏅 贴纸到手</p>
      <div class="actions">
        <button class="hot btn-primary" @click="emit('next')">下一关</button>
        <button class="hot btn-ghost" @click="emit('again')">{{ againLabel || '再玩一次' }}</button>
        <button class="hot btn-ghost" @click="emit('home')">回地图</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(92, 75, 81, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.card {
  width: 100%;
  max-width: 320px;
  background: var(--bg-cream);
  border-radius: 28px;
  padding: 28px 20px;
  text-align: center;
  animation: pop 0.35s ease;
}
.spark { font-size: 48px; animation: hop 0.6s ease infinite alternate; }
.t { margin: 8px 0; font-size: 28px; font-weight: 900; }
.sticker { margin: 0 0 12px; font-size: 20px; font-weight: 800; color: var(--accent-strong); }
.actions { display: flex; flex-direction: column; gap: 8px; }
.btn-ghost {
  background: var(--card);
  box-shadow: var(--shadow);
  font-size: 18px;
  font-weight: 800;
}
@keyframes hop {
  from { transform: translateY(0); }
  to { transform: translateY(-6px); }
}
@keyframes pop {
  from { transform: scale(0.85); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
