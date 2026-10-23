<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import CalcPlay from './CalcPlay.vue'
import EqPickPlay from './EqPickPlay.vue'

const route = useRoute()
const mode = computed(() => String(route.params.mode))
</script>

<template>
  <EqPickPlay v-if="mode === 'eqPick'" />
  <CalcPlay v-else />
</template>
