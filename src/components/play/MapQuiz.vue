<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { MAP_HINT, MAP_LABEL } from '../../data/directions'
import ArtImg from '../shared/ArtImg.vue'

const props = withDefaults(
  defineProps<{
    mode?: 'dir' | 'find'
    correct: string
    target?: string
    /** 反向找物时本题问的方位，用于纠错提示 */
    dir?: string
    hint: boolean
    highlight: boolean
    revealed: boolean
    disabled: boolean
    wrongTick: number
  }>(),
  { mode: 'dir', dir: '' },
)
const emit = defineEmits<{ answer: [code: string] }>()

/** 北↑固定，地标本关内不换位 */
const LANDMARKS = [
  { id: 'school', name: '学校', file: 'landmark_school.png', emoji: '🏫', col: 2, row: 1 },
  { id: 'lake', name: '湖', file: 'landmark_lake.png', emoji: '🌊', col: 1, row: 2 },
  { id: 'home', name: '家', file: 'landmark_home.png', emoji: '🏠', col: 2, row: 2 },
  { id: 'shop', name: '商店', file: 'landmark_shop.png', emoji: '🏪', col: 3, row: 2 },
  { id: 'park', name: '公园', file: 'landmark_park.png', emoji: '🌳', col: 2, row: 3 },
]
const BUTTONS = ['E', 'S', 'W', 'N', 'C']

const hintKey = computed(() => (props.mode === 'find' ? props.dir || 'N' : props.correct))
const hintText = computed(() => (props.hint ? MAP_HINT[hintKey.value] ?? '' : ''))

const shaking = ref<string | null>(null)
let last = ''
watch(
  () => props.wrongTick,
  () => {
    shaking.value = last
    window.setTimeout(() => (shaking.value = null), 450)
  },
)

function tap(code: string) {
  if (props.disabled) return
  last = code
  emit('answer', code)
}
</script>

<template>
  <div class="map-quiz">
    <div class="map">
      <div class="north" :class="{ focus: mode === 'dir' && target === 'badge' }">
        <ArtImg name="badge_north.png" alt="北">
          <span class="north-fallback"><b>⬆</b> 北 <i>N</i></span>
        </ArtImg>
      </div>
      <div class="roads"><span class="road v" /><span class="road h" /></div>
      <div class="board">
        <component
          :is="mode === 'find' ? 'button' : 'div'"
          v-for="lm in LANDMARKS"
          :key="lm.id"
          class="landmark"
          :class="{
            focus: mode === 'dir' && target === lm.id,
            home: lm.id === 'home',
            tappable: mode === 'find',
            'is-hl': mode === 'find' && highlight && lm.id === correct,
            'is-dim': mode === 'find' && highlight && lm.id !== correct,
            'is-ok': mode === 'find' && revealed && lm.id === correct,
            'is-shake': mode === 'find' && shaking === lm.id,
          }"
          :style="{ gridColumn: lm.col, gridRow: lm.row }"
          :aria-label="lm.name"
          @click="mode === 'find' && tap(lm.id)"
        >
          <div class="lm-img">
            <ArtImg :name="lm.file" :alt="lm.name"><span class="lm-emoji">{{ lm.emoji }}</span></ArtImg>
          </div>
          <span class="lm-name">{{ lm.name }}</span>
        </component>
      </div>
    </div>

    <p class="hint" :class="{ show: hint }">{{ hintText }}</p>

    <div v-if="mode === 'dir'" class="bar">
      <button
        v-for="b in BUTTONS"
        :key="b"
        class="dir-btn"
        :class="{
          'is-hl': highlight && b === correct,
          'is-dim': highlight && b !== correct,
          'is-ok': revealed && b === correct,
          'is-shake': shaking === b,
        }"
        @click="tap(b)"
      >
        {{ MAP_LABEL[b] }}
      </button>
    </div>
    <p v-else class="find-tip">点地图上的地方</p>
  </div>
</template>

<style scoped>
.map-quiz { display: flex; flex-direction: column; align-items: center; gap: 16px; width: 100%; }
.map {
  position: relative;
  width: 330px;
  padding: 56px 12px 12px;
  border-radius: 28px;
  background: linear-gradient(#EAF6F0, #F4FBF7);
  border: 3px solid var(--mint);
  box-shadow: var(--shadow);
}
.north {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
.north.focus { animation: pulse 0.9s ease-in-out infinite; }
.north-fallback {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  border-radius: 999px;
  background: var(--warn);
  font-weight: 800;
  font-size: 20px;
  white-space: nowrap;
}
.north-fallback i { font-style: normal; background: #fff; border-radius: 8px; padding: 0 6px; }
.roads { position: absolute; inset: 56px 12px 12px; pointer-events: none; }
.road { position: absolute; background: #F9EBD3; border-radius: 8px; }
.road.v { left: calc(50% - 9px); width: 18px; top: 16%; bottom: 16%; }
.road.h { top: calc(50% - 9px); height: 18px; left: 16%; right: 16%; }
.board {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 94px);
  gap: 6px;
}
.landmark {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.85);
  border: 2px solid transparent;
  min-width: var(--hit);
  min-height: 88px;
  transition: transform 0.12s ease, opacity 0.2s;
}
.landmark.home { background: #FFF1EC; border-color: var(--hero); }
.landmark.focus { border: 3px solid var(--accent-strong); animation: pulse 1.1s ease-in-out infinite; }
.landmark.tappable { cursor: pointer; border: 3px solid #F3D9DF; box-shadow: var(--shadow); }
.landmark.tappable:active { transform: scale(0.94); }
.lm-img { width: 58px; height: 58px; display: flex; align-items: center; justify-content: center; }
.lm-emoji { font-size: 44px; line-height: 1; }
.lm-name { font-size: 16px; font-weight: 800; }
.hint {
  margin: -6px 0;
  min-height: 34px;
  padding: 4px 16px;
  border-radius: 999px;
  font-size: 20px;
  font-weight: 800;
}
.hint.show { background: #FFF4D6; animation: pop 0.3s ease both; }
.find-tip {
  margin: 0;
  min-height: 34px;
  font-size: 18px;
  font-weight: 800;
  color: var(--ink-soft);
}
.bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  width: 100%;
}
.dir-btn {
  width: var(--hit);
  height: var(--hit);
  border-radius: 20px;
  background: var(--card);
  border: 3px solid var(--warn);
  box-shadow: var(--shadow);
  font-size: 30px;
  font-weight: 800;
  transition: transform 0.12s ease, opacity 0.2s;
}
.dir-btn:active { transform: scale(0.94); }
</style>
