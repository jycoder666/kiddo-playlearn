<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getSkin, type ItemSkin } from '../../data/sense/items'
import { artUrl } from '../../composables/useArt'

const props = withDefaults(
  defineProps<{
    skin?: ItemSkin
    lit?: boolean
    gone?: boolean
    bouncing?: boolean
    size?: number
    /** false：仅展示，点击穿透到外层（找相同数量等） */
    interactive?: boolean
  }>(),
  { skin: 'apple', lit: false, gone: false, bouncing: false, size: 52, interactive: true },
)

const emit = defineEmits<{ click: [] }>()
const def = computed(() => getSkin(props.skin))
const src = computed(() => artUrl(def.value.file))
const imgOk = ref(false)
const bounceOnce = ref(false)

function onClick(e: MouseEvent) {
  if (!props.interactive) return
  e.stopPropagation()
  emit('click')
}

watch(
  () => props.bouncing,
  (v) => {
    if (v) {
      bounceOnce.value = true
      window.setTimeout(() => (bounceOnce.value = false), 380)
    }
  },
)

watch(src, () => {
  imgOk.value = false
})
</script>

<template>
  <component
    :is="interactive ? 'button' : 'span'"
    :type="interactive ? 'button' : undefined"
    class="item"
    :class="{ lit, gone, bounce: bounceOnce || bouncing, deco: !interactive }"
    :style="{ width: size + 'px', height: size + 'px', fontSize: size * 0.62 + 'px' }"
    :aria-label="def.label"
    :aria-hidden="interactive ? undefined : true"
    @click="onClick"
  >
    <img v-if="src" class="pic" :src="src" alt="" @load="imgOk = true" @error="imgOk = false" />
    <span v-if="!src || !imgOk" class="emo">{{ def.emoji }}</span>
  </component>
</template>

<style scoped>
.item {
  position: relative;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 3px 0 rgba(92, 75, 81, 0.12);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, opacity 0.35s ease, filter 0.2s;
  overflow: hidden;
}
.item.lit {
  box-shadow: 0 0 0 4px rgba(255, 201, 77, 0.55), 0 3px 0 rgba(92, 75, 81, 0.12);
  filter: saturate(1.15);
}
.item.gone {
  opacity: 0;
  transform: scale(0.2);
  pointer-events: none;
}
.item.bounce {
  animation: hop 0.38s ease;
}
.item.deco {
  pointer-events: none;
  cursor: default;
  /* 勿用 disabled，浏览器会把图洗灰 */
  opacity: 1;
  filter: none;
}
.pic {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 78%;
  height: 78%;
  transform: translate(-50%, -50%);
  object-fit: contain;
  pointer-events: none;
}
.emo {
  line-height: 1;
  pointer-events: none;
  z-index: 0;
}
/* 只在自身坐标系缩放，外层 .abs 负责 translate 居中，避免闪到别处 */
@keyframes hop {
  0% { transform: scale(1); }
  35% { transform: scale(1.22); }
  100% { transform: scale(1); }
}
</style>
