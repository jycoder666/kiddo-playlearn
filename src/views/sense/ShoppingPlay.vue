<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import CountItem from '../../components/sense/CountItem.vue'
import { EXTRA_MODES } from '../../data/sense/meta'
import { ITEM_SKINS, type ItemSkin } from '../../data/sense/items'
import { randInt, shuffle } from '../../data/sense/util'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { unlockSenseSticker } from '../../composables/useSenseStickers'
import { noteWrongAnswer } from '../../composables/useWrongRest'
import { useSpeech } from '../../composables/useSpeech'

interface Need {
  skin: ItemSkin
  n: number
  got: number
}

const NEED_ROUNDS = 5
const router = useRouter()
const { completeExtra } = useSenseProgress()
const { speak } = useSpeech()
const meta = EXTRA_MODES.find((m) => m.id === 'shopping')!

const phase = ref<'memo' | 'shop'>('memo')
const list = ref<Need[]>([])
const shelf = ref<ItemSkin[]>([])
const round = ref(0)
const celebrate = ref(false)
const missedOnce = ref(false)

const prompt = computed(() =>
  phase.value === 'memo' ? '先记住购物清单' : '去货架点够数量',
)

function deal() {
  const skins = shuffle([...ITEM_SKINS.map((s) => s.id)]).slice(0, randInt(2, 3))
  list.value = skins.map((skin) => ({ skin, n: randInt(1, 3), got: 0 }))
  const extras = shuffle(ITEM_SKINS.map((s) => s.id)).filter((id) => !skins.includes(id)).slice(0, 2)
  shelf.value = shuffle([...skins, ...skins, ...extras])
  phase.value = 'memo'
  missedOnce.value = false
  const text = list.value.map((x) => `${x.n}个${ITEM_SKINS.find((s) => s.id === x.skin)!.label}`).join('，')
  speak(`记住：${text}`)
  window.setTimeout(() => {
    if (celebrate.value) return
    phase.value = 'shop'
    speak('去货架点够数量')
  }, 3200)
}

function start() {
  round.value = 0
  celebrate.value = false
  deal()
}

function onShelf(skin: ItemSkin) {
  if (phase.value !== 'shop' || celebrate.value) return
  const item = list.value.find((x) => x.skin === skin)
  if (!item) {
    if (!missedOnce.value) {
      missedOnce.value = true
      noteWrongAnswer()
    }
    speak('清单里没有这个')
    return
  }
  if (item.got >= item.n) {
    speak('这个够啦')
    return
  }
  item.got++
  speak(ITEM_SKINS.find((s) => s.id === skin)!.label)
  if (list.value.every((x) => x.got >= x.n)) {
    window.setTimeout(() => {
      if (round.value >= NEED_ROUNDS - 1) {
        completeExtra('shopping', 2)
        unlockSenseSticker('shopping')
        celebrate.value = true
        return
      }
      round.value++
      deal()
    }, 500)
  }
}

onMounted(start)
</script>

<template>
  <SenseChrome
    :title="meta.name"
    :prompt="prompt"
    :hint="`${round + 1} / ${NEED_ROUNDS}`"
    back-to="/sense/recognize"
  >
    <div v-if="!celebrate" class="stage">
      <div v-if="phase === 'memo'" class="list-card">
        <p class="list-title">购物清单</p>
        <div v-for="it in list" :key="it.skin" class="row">
          <CountItem :skin="it.skin" :size="48" :interactive="false" />
          <span>× {{ it.n }}</span>
        </div>
        <p class="tip">看清楚，等会儿去拿哦</p>
      </div>
      <template v-else>
        <div class="need">
          <span v-for="it in list" :key="it.skin" class="chip" :class="{ done: it.got >= it.n }">
            {{ ITEM_SKINS.find((s) => s.id === it.skin)?.label }} {{ it.got }}/{{ it.n }}
          </span>
        </div>
        <div class="shelf">
          <button
            v-for="(skin, i) in shelf"
            :key="skin + i"
            type="button"
            class="hot item"
            @click="onShelf(skin)"
          >
            <CountItem :skin="skin" :size="56" :interactive="false" />
          </button>
        </div>
      </template>
    </div>
    <Celebrate
      :show="celebrate"
      title="买齐啦！"
      again-label="再逛一轮"
      @again="start"
      @next="router.push('/sense/recognize')"
      @home="router.push('/sense/recognize')"
    />
  </SenseChrome>
</template>

<style scoped>
.stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 12px;
}
.list-card {
  width: min(300px, 90vw);
  padding: 20px;
  border-radius: 24px;
  background: #fffdf6;
  border: 2px dashed #e0d4c8;
  box-shadow: var(--shadow);
}
.list-title { margin: 0 0 12px; text-align: center; font-weight: 900; font-size: 20px; }
.row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 22px;
  font-weight: 900;
  margin: 8px 0;
}
.tip { margin: 12px 0 0; text-align: center; font-weight: 700; color: var(--ink-soft); }
.need { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.chip {
  padding: 6px 12px;
  border-radius: 999px;
  background: #fff;
  font-weight: 800;
  box-shadow: var(--shadow);
}
.chip.done { background: #d8f3e8; color: #2f7a5f; }
.shelf {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  max-width: 340px;
}
.item {
  width: 76px;
  height: 76px;
  border-radius: 18px;
  background: var(--card);
  box-shadow: var(--shadow);
  display: grid;
  place-items: center;
}
</style>
