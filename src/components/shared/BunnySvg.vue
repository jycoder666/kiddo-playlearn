<script setup lang="ts">
import { computed } from 'vue'
import type { Pose } from './HeroSprite.vue'

/**
 * 背对观众的小兔子（缺图兜底）。
 * 背对时：小兔的右手/右耳在画面左侧，左手/左耳在画面右侧。
 */
const props = defineProps<{ pose: Pose; wiggle?: 'L' | 'R' | null }>()

// 画面左侧手臂 = 小兔右手；画面右侧手臂 = 小兔左手
const armScreenLeft = computed(() => (props.pose === 'hand_right' || props.pose === 'happy' ? 150 : 8))
const armScreenRight = computed(() => (props.pose === 'hand_left' || props.pose === 'happy' ? -150 : -8))
</script>

<template>
  <svg class="bunny" :class="pose" viewBox="0 0 200 240" role="img" aria-label="背对你的小兔子">
    <g stroke="#5C4B51" stroke-width="3" stroke-linejoin="round">
      <!-- 耳朵：画面左=右耳，画面右=左耳 -->
      <g class="ear ear-screen-left" :class="{ wiggle: wiggle === 'R' }">
        <ellipse cx="70" cy="50" rx="16" ry="40" fill="#FFFDFB" transform="rotate(-16 70 88)" />
        <ellipse cx="70" cy="54" rx="7" ry="26" fill="#F8E6EA" stroke="none" transform="rotate(-16 70 88)" />
      </g>
      <g class="ear ear-screen-right" :class="{ wiggle: wiggle === 'L' }">
        <ellipse cx="130" cy="50" rx="16" ry="40" fill="#FFFDFB" transform="rotate(16 130 88)" />
        <ellipse cx="130" cy="54" rx="7" ry="26" fill="#F8E6EA" stroke="none" transform="rotate(16 130 88)" />
      </g>

      <!-- 脚 -->
      <g class="feet">
        <ellipse class="foot foot-l" cx="78" cy="222" rx="21" ry="12" fill="#FFFDFB" />
        <ellipse class="foot foot-r" cx="122" cy="222" rx="21" ry="12" fill="#FFFDFB" />
      </g>

      <!-- 身体 + 蜜桃小背心 -->
      <ellipse cx="100" cy="170" rx="48" ry="52" fill="#FFFDFB" />
      <path d="M57 150 Q100 126 143 150 Q149 172 143 192 Q100 206 57 192 Q51 172 57 150 Z" fill="var(--hero)" />
      <path d="M70 160 Q100 150 130 160" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round" />

      <!-- 尾巴（背面才看得到） -->
      <g fill="#FFFFFF">
        <circle cx="100" cy="202" r="15" />
        <circle cx="91" cy="196" r="5" stroke="none" />
        <circle cx="108" cy="207" r="5" stroke="none" />
      </g>

      <!-- 后脑勺 -->
      <circle cx="100" cy="98" r="44" fill="#FFFDFB" />
      <path d="M86 66 Q100 56 114 66" fill="none" stroke-width="2.5" stroke-linecap="round" />
      <ellipse cx="100" cy="134" rx="22" ry="5" fill="#F8E6EA" stroke="none" opacity="0.8" />

      <!-- 手臂 -->
      <g class="arm" :style="{ transform: `rotate(${armScreenLeft}deg)`, transformOrigin: '64px 142px' }">
        <ellipse cx="56" cy="168" rx="12" ry="26" fill="#FFFDFB" />
      </g>
      <g class="arm" :style="{ transform: `rotate(${armScreenRight}deg)`, transformOrigin: '136px 142px' }">
        <ellipse cx="144" cy="168" rx="12" ry="26" fill="#FFFDFB" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.bunny { width: 100%; height: 100%; display: block; overflow: visible; }
.arm { transform-box: view-box; transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.ear { transform-box: view-box; }
.ear-screen-left { transform-origin: 72px 88px; }
.ear-screen-right { transform-origin: 128px 88px; }
.ear.wiggle { animation: earWiggle 0.5s ease-in-out 3; }
.happy { animation: bounce 0.6s ease 2; }
.walk { animation: float 0.5s ease-in-out infinite; }
.walk .foot-l { transform: translateY(-6px); }
@keyframes earWiggle {
  0%, 100% { transform: rotate(0deg); }
  30% { transform: rotate(-14deg); }
  70% { transform: rotate(14deg); }
}
</style>
