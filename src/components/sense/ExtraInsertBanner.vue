<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { dismissExtraInsert, pickInsertExtra, useExtraInsert } from '../../composables/useExtraInsert'

const router = useRouter()
const { state } = useExtraInsert()
const offer = ref(pickInsertExtra())

watch(
  () => state.pending,
  (v) => {
    if (v) offer.value = pickInsertExtra()
  },
)

const show = computed(() => state.pending)

function play() {
  const path = offer.value.path
  dismissExtraInsert()
  router.push(path)
}

function skip() {
  dismissExtraInsert()
}
</script>

<template>
  <div v-if="show" class="banner" role="dialog" aria-label="玩个小游戏">
    <p class="title">休息一下，玩个小游戏？</p>
    <p class="sub">{{ offer.emoji }} {{ offer.name }}</p>
    <div class="actions">
      <button type="button" class="hot go" @click="play">去玩玩</button>
      <button type="button" class="hot skip" @click="skip">下次再玩</button>
    </div>
  </div>
</template>

<style scoped>
.banner {
  margin: 0 0 12px;
  padding: 12px 14px;
  border-radius: 18px;
  background: linear-gradient(135deg, #e8f6ff, #fff3e0);
  box-shadow: var(--shadow);
  text-align: center;
}
.title { margin: 0; font-weight: 900; font-size: 16px; }
.sub { margin: 6px 0 10px; font-weight: 800; color: var(--ink-soft); }
.actions { display: flex; gap: 10px; justify-content: center; }
.go, .skip {
  border: none;
  padding: 10px 16px;
  border-radius: 14px;
  font-weight: 900;
  font-size: 15px;
}
.go { background: #ffd27a; }
.skip { background: var(--card); }
</style>
