<script setup lang="ts">
import { ref } from 'vue'
import { useSettings } from '../../composables/useSettings'
import { useSpeech } from '../../composables/useSpeech'

const props = defineProps<{
  /** 点击时要朗读的文案 */
  text: string
}>()

const settings = useSettings()
const { play, cancel, speaking } = useSpeech()

const longPress = ref(false)
let pressTimer: number | undefined

function clearPress() {
  window.clearTimeout(pressTimer)
  pressTimer = undefined
}

function onPointerDown() {
  longPress.value = false
  clearPress()
  pressTimer = window.setTimeout(() => {
    longPress.value = true
    // 长按：开关静音
    settings.muted = !settings.muted
    if (settings.muted) cancel()
    else play(props.text || '声音打开啦')
  }, 650)
}

function onPointerUp() {
  clearPress()
}

function onClick() {
  if (longPress.value) {
    longPress.value = false
    return
  }
  play(props.text || '听听提示哦')
}
</script>

<template>
  <button
    type="button"
    class="hot speak-btn"
    :class="{ speaking, muted: settings.muted }"
    :aria-label="settings.muted ? '打开声音并朗读' : '再听一次，长按开关声音'"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointerleave="onPointerUp"
    @pointercancel="onPointerUp"
    @click="onClick"
  >
    {{ settings.muted ? '🔇' : '🔊' }}
  </button>
</template>

<style scoped>
.speak-btn {
  background: var(--card);
  box-shadow: var(--shadow);
  font-size: 26px;
}
.speak-btn.speaking {
  background: var(--accent);
}
</style>
