<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DigitTapPlay from './DigitTapPlay.vue'
import SpotDiffPlay from './SpotDiffPlay.vue'
import ShadowMatchPlay from './ShadowMatchPlay.vue'
import ExplorePlay from './ExplorePlay.vue'
import ColorMixPlay from './ColorMixPlay.vue'
import OddOnePlay from './OddOnePlay.vue'
import ShoppingPlay from './ShoppingPlay.vue'
import RhythmPlay from './RhythmPlay.vue'
import SoftFallPlay from './SoftFallPlay.vue'
import WhoMissingPlay from './WhoMissingPlay.vue'
import PeekFindPlay from './PeekFindPlay.vue'
import OrderNumsPlay from './OrderNumsPlay.vue'
import OddEvenPlay from './OddEvenPlay.vue'
import MagicHatPlay from './MagicHatPlay.vue'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
</script>

<template>
  <DigitTapPlay v-if="slug === 'digit-tap'" />
  <SpotDiffPlay v-else-if="slug === 'spot-diff'" />
  <ShadowMatchPlay v-else-if="slug === 'shadow-match'" />
  <ExplorePlay v-else-if="slug === 'explore'" />
  <ColorMixPlay v-else-if="slug === 'color-mix'" />
  <OddOnePlay v-else-if="slug === 'odd-one'" />
  <ShoppingPlay v-else-if="slug === 'shopping'" />
  <RhythmPlay v-else-if="slug === 'rhythm'" />
  <SoftFallPlay v-else-if="slug === 'soft-fall'" />
  <WhoMissingPlay v-else-if="slug === 'who-missing'" />
  <PeekFindPlay v-else-if="slug === 'peek-find'" />
  <OrderNumsPlay v-else-if="slug === 'order-nums'" />
  <OddEvenPlay v-else-if="slug === 'odd-even'" />
  <MagicHatPlay v-else-if="slug === 'magic-hat'" />
</template>
