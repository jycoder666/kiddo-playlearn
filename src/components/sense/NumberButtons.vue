<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  options: number[]
  disabled?: boolean
  flashCorrect?: number | null
}>()

const emit = defineEmits<{ pick: [n: number] }>()
const pulse = ref<number | null>(null)

function onPick(n: number) {
  pulse.value = n
  window.setTimeout(() => (pulse.value = null), 450)
  emit('pick', n)
}
</script>

<template>
  <div class="pad" role="group" aria-label="选数字">
    <button
      v-for="(n, idx) in options"
      :key="`${idx}-${n}`"
      type="button"
      class="hot num"
      :class="{ flash: flashCorrect === n || pulse === n }"
      :disabled="disabled"
      @click="onPick(n)"
    >
      {{ n }}
    </button>
  </div>
</template>

<style scoped>
.pad {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  padding: 8px 4px;
}
.num {
  width: 76px;
  height: 76px;
  border-radius: 22px;
  background: var(--card);
  box-shadow: var(--shadow);
  font-size: 36px;
  font-weight: 900;
  color: var(--ink);
}
.num.flash {
  animation: glow 0.45s ease;
  background: var(--mint);
}
.num:disabled {
  opacity: 0.45;
}
@keyframes glow {
  0% { transform: scale(1); }
  40% { transform: scale(1.18); box-shadow: 0 0 0 8px rgba(255, 201, 77, 0.45); }
  100% { transform: scale(1); }
}
</style>
