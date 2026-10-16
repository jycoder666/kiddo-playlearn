<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ATTR_MODES } from '../../data/sense/meta'
import RecPlay from './RecPlay.vue'
import AttrPlay from './AttrPlay.vue'

const route = useRoute()
const isAttr = computed(() => ATTR_MODES.some((m) => m.id === String(route.params.mode)))
</script>

<template>
  <AttrPlay v-if="isAttr" />
  <RecPlay v-else />
</template>
