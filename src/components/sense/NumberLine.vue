<script setup lang="ts">
withDefaults(
  defineProps<{
    highlight?: number | null
    neighbors?: number[]
  }>(),
  { highlight: null, neighbors: () => [] },
)
</script>

<template>
  <div class="line" aria-hidden="true">
    <div
      v-for="n in 10"
      :key="n"
      class="step"
      :class="{
        on: highlight === n,
        nb: neighbors.includes(n),
      }"
    >
      {{ n }}
    </div>
  </div>
</template>

<style scoped>
.line {
  display: flex;
  gap: 4px;
  justify-content: space-between;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 16px;
}
.step {
  flex: 1;
  text-align: center;
  font-size: 13px;
  font-weight: 800;
  padding: 6px 0;
  border-radius: 10px;
  background: #f3e8ec;
  color: var(--ink-soft);
  transition: background 0.25s, color 0.25s, transform 0.25s;
}
.step.on {
  background: var(--hero);
  color: #fff;
  transform: translateY(-2px);
}
.step.nb {
  background: var(--accent);
  color: #fff;
  animation: blink 0.6s ease 2;
}
@keyframes blink {
  50% { filter: brightness(1.15); }
}
</style>
