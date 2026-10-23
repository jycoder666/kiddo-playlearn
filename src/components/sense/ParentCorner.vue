<script setup lang="ts">
import { ref } from 'vue'
import {
  islandLabel,
  useSenseProgress,
  type SenseIslandId,
} from '../../composables/useSenseProgress'
import { usePlayTime } from '../../composables/usePlayTime'

const props = defineProps<{
  island: SenseIslandId
}>()

const emit = defineEmits<{
  close: []
  reset: []
}>()

const { resetIsland } = useSenseProgress()
const { label: playTimeLabel } = usePlayTime()
const confirming = ref(false)
const done = ref(false)

function onResetClick() {
  if (!confirming.value) {
    confirming.value = true
    return
  }
  resetIsland(props.island)
  done.value = true
  confirming.value = false
  emit('reset')
}

function onClose() {
  confirming.value = false
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div class="scrim" role="dialog" aria-modal="true" aria-label="家长角" @click.self="onClose">
      <div class="panel">
        <h2>家长角</h2>
        <p class="lead">当前岛：{{ islandLabel(island) }}</p>
        <p class="time">本机累计游玩约 {{ playTimeLabel }}</p>
        <p v-if="done" class="ok">已清空本岛进度</p>
        <p v-else class="tip">重置后星星与解锁会回到初始，其它岛不受影响。</p>
        <div class="acts">
          <button
            v-if="!done"
            type="button"
            class="hot btn-primary act"
            @click="onResetClick"
          >
            {{ confirming ? '再点一次确认重置' : '重置本岛进度' }}
          </button>
          <button type="button" class="hot btn-secondary act" @click="onClose">关闭</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.scrim {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(60, 48, 52, 0.45);
}
.panel {
  width: min(360px, 100%);
  padding: 22px 20px 18px;
  border-radius: 24px;
  background: var(--card);
  box-shadow: var(--shadow);
  text-align: center;
}
h2 {
  margin: 0;
  font-size: 22px;
}
.lead {
  margin: 10px 0 0;
  font-weight: 800;
}
.time {
  margin: 8px 0 0;
  font-size: 15px;
  font-weight: 800;
  color: #5a8f7b;
}
.tip,
.ok {
  margin: 8px 0 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink-soft);
  line-height: 1.4;
}
.ok {
  color: #3c9a7b;
}
.acts {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}
.act {
  width: 100%;
  min-height: 48px;
  font-size: 16px;
  font-weight: 800;
}
</style>
