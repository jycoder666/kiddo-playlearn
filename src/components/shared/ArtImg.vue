<script setup lang="ts">
import { computed, ref } from 'vue'
import { artUrl } from '../../composables/useArt'

const props = defineProps<{ name: string; alt?: string }>()
const broken = ref(false)
const src = computed(() => (broken.value ? null : artUrl(props.name)))
</script>

<template>
  <img v-if="src" class="art-img" :src="src" :alt="alt ?? ''" draggable="false" @error="broken = true" />
  <slot v-else />
</template>

<style scoped>
.art-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
}
</style>
