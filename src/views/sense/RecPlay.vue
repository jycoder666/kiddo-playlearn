<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import CountItem from '../../components/sense/CountItem.vue'
import NumberButtons from '../../components/sense/NumberButtons.vue'
import NumberLine from '../../components/sense/NumberLine.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import { REC_MODES, type RecModeId } from '../../data/sense/meta'
import type { ItemSkin } from '../../data/sense/items'
import {
  bondKey,
  bondsOf,
  numberChoices,
  pick,
  randInt,
  scatterPositions,
  shuffle,
} from '../../data/sense/util'
import { useSenseProgress } from '../../composables/useSenseProgress'
import { useSpeech } from '../../composables/useSpeech'

const route = useRoute()
const router = useRouter()
const { completeRec, isRecUnlocked } = useSenseProgress()
const { speak } = useSpeech()

const mode = computed(() => route.params.mode as RecModeId)
const meta = computed(() => REC_MODES.find((m) => m.id === mode.value))

const prompt = ref('')
const celebrate = ref(false)
const wrongStreak = ref(0)
const flashN = ref<number | null>(null)
const skin = ref<ItemSkin>('apple')
const target = ref(5)
const choices = ref<number[]>([])
const qIndex = ref(0)
const bigPulse = ref(false)
const applesShown = ref(0)
const lineHighlight = ref<number | null>(null)
const lineNeighbors = ref<number[]>([])

const items = reactive<Array<{ id: number; x: number; y: number; lit: boolean; inBasket: boolean }>>([])
const basketCount = computed(() => items.filter((i) => i.inBasket).length)
const poolCount = computed(() => items.filter((i) => !i.inBasket).length)

/* split */
const leftIds = ref<number[]>([])
const rightIds = ref<number[]>([])
const foundBonds = ref<string[]>([])
const needBonds = ref(2)
const splitN = ref(5)
type Pile = 'pool' | 'L' | 'R'
const piles = reactive<Record<number, Pile>>({})

/* family */
const famA = ref(2)
const famB = ref(3)
const famN = computed(() => famA.value + famB.value)
const famDemo = ref<'a+b' | 'b+a' | 'n-a' | 'n-b' | null>(null)
const famDone = ref(false)

/* compare */
const big = ref(7)
const small = ref(5)
const diff = computed(() => big.value - small.value)

/* neighbors */
const center = ref(5)
const pickedNeighbors = ref<number[]>([])

/* challenge */
const challengeLeft = ref(5)
const challengePool: RecModeId[] = ['countPick', 'takeN', 'neighbors', 'compare']
const activeSub = ref<RecModeId | null>(null)

function reset() {
  wrongStreak.value = 0
  flashN.value = null
  celebrate.value = false
  bigPulse.value = false
  applesShown.value = 0
  famDemo.value = null
  famDone.value = false
  pickedNeighbors.value = []
  leftIds.value = []
  rightIds.value = []
  foundBonds.value = []
  lineHighlight.value = null
  lineNeighbors.value = []
  items.splice(0, items.length)
  Object.keys(piles).forEach((k) => delete piles[Number(k)])
  choices.value = []
}

function unlockChoices(correct: number) {
  choices.value = numberChoices(correct, 4, wrongStreak.value >= 2)
}

function startHello() {
  reset()
  target.value = randInt(1, 10)
  prompt.value = `点一点大数字 ${target.value}`
  speak(`这是 ${target.value}，点一点`)
}

function onHelloTap() {
  bigPulse.value = true
  applesShown.value = target.value
  speak(`${target.value}`)
  window.setTimeout(() => {
    qIndex.value++
    if (qIndex.value >= 4) {
      completeRec('hello', 2)
      celebrate.value = true
    } else startHello()
  }, 900)
}

function startCountPick() {
  reset()
  target.value = randInt(1, 10)
  const pos = scatterPositions(target.value)
  pos.forEach((p, i) => items.push({ id: i + 1, x: p.x, y: p.y, lit: false, inBasket: false }))
  prompt.value = '点亮每一个，再选出数字'
  speak(prompt.value)
}

function startTakeN() {
  reset()
  target.value = randInt(1, 8)
  const total = 10
  const pos = scatterPositions(total)
  pos.forEach((p, i) => items.push({ id: i + 1, x: p.x, y: p.y, lit: false, inBasket: false }))
  prompt.value = `篮子里放 ${target.value} 个苹果`
  speak(prompt.value)
}

function startNeighbors() {
  reset()
  center.value = randInt(2, 9)
  lineHighlight.value = center.value
  lineNeighbors.value = []
  pickedNeighbors.value = []
  const opts = new Set<number>([center.value - 1, center.value + 1])
  while (opts.size < 4) opts.add(randInt(1, 10))
  choices.value = shuffle([...opts])
  prompt.value = `${center.value} 的邻居是谁？把两个都点出来`
  speak(prompt.value)
}

function startSplit() {
  reset()
  splitN.value = randInt(4, 10)
  needBonds.value = Math.min(3, bondsOf(splitN.value).length)
  for (let i = 1; i <= splitN.value; i++) {
    items.push({ id: i, x: 0, y: 0, lit: false, inBasket: false })
    piles[i] = 'pool'
  }
  prompt.value = `${splitN.value} 可以分成几和几？点进左右盘`
  speak(prompt.value)
}

function startFamily() {
  reset()
  famA.value = randInt(1, 5)
  famB.value = randInt(1, 10 - famA.value)
  for (let i = 1; i <= famN.value; i++) {
    items.push({ id: i, x: 0, y: 0, lit: false, inBasket: false })
  }
  prompt.value = '点一个算式，看看合或拆'
  speak(prompt.value)
}

function startCompare() {
  reset()
  small.value = randInt(1, 7)
  big.value = randInt(small.value + 1, 10)
  unlockChoices(diff.value)
  lineHighlight.value = small.value
  lineNeighbors.value = [big.value]
  prompt.value = `${big.value} 比 ${small.value} 多几个？`
  speak(prompt.value)
}

function startChallenge() {
  challengeLeft.value = 5
  nextChallenge()
}

function nextChallenge() {
  const m = pick(challengePool)
  activeSub.value = m
  if (m === 'countPick') startCountPick()
  else if (m === 'takeN') startTakeN()
  else if (m === 'neighbors') startNeighbors()
  else startCompare()
}

const playAs = computed(() => (mode.value === 'challenge' ? activeSub.value : mode.value))

function startMode() {
  if (!isRecUnlocked(mode.value)) {
    router.replace('/sense/recognize')
    return
  }
  qIndex.value = 0
  if (mode.value === 'hello') startHello()
  else if (mode.value === 'countPick') startCountPick()
  else if (mode.value === 'takeN') startTakeN()
  else if (mode.value === 'neighbors') startNeighbors()
  else if (mode.value === 'split') startSplit()
  else if (mode.value === 'family') startFamily()
  else if (mode.value === 'compare') startCompare()
  else if (mode.value === 'challenge') startChallenge()
}

onMounted(startMode)
watch(mode, startMode)

function litCount() {
  return items.filter((i) => i.lit).length
}

function onTapItem(it: (typeof items)[0]) {
  if (playAs.value === 'countPick') {
    if (it.lit) return
    it.lit = true
    speak(String(litCount()))
    if (litCount() >= target.value) {
      unlockChoices(target.value)
      prompt.value = '选出数字'
      speak(prompt.value)
    }
    return
  }

  if (playAs.value === 'takeN') {
    if (!it.inBasket) {
      if (basketCount.value >= target.value) {
        speak('够啦，多了可以点篮子里的拿回去')
        return
      }
      it.inBasket = true
    } else {
      it.inBasket = false
    }
    speak(String(basketCount.value))
    if (basketCount.value === target.value) {
      window.setTimeout(() => winSoft(), 400)
    } else if (basketCount.value > target.value) {
      speak('多了，拿回去一点')
    } else {
      speak('再拿一点')
    }
    return
  }

  if (mode.value === 'split') {
    const cur = piles[it.id] || 'pool'
    if (cur === 'L' || cur === 'R') {
      piles[it.id] = 'pool'
      leftIds.value = leftIds.value.filter((id) => id !== it.id)
      rightIds.value = rightIds.value.filter((id) => id !== it.id)
      return
    }
    const prefer: Pile = leftIds.value.length <= rightIds.value.length ? 'L' : 'R'
    piles[it.id] = prefer
    if (prefer === 'L') leftIds.value.push(it.id)
    else rightIds.value.push(it.id)
    const a = leftIds.value.length
    const b = rightIds.value.length
    if (a + b === splitN.value && a >= 1 && b >= 1) {
      const key = bondKey(a, b)
      if (foundBonds.value.includes(key)) {
        speak('这个已经有过啦')
        return
      }
      foundBonds.value.push(key)
      speak(`${splitN.value} 等于 ${a} 加 ${b}`)
      if (foundBonds.value.length >= needBonds.value) winSoft()
      else {
        window.setTimeout(() => {
          items.forEach((x) => {
            piles[x.id] = 'pool'
          })
          leftIds.value = []
          rightIds.value = []
          prompt.value = `再找一种（${foundBonds.value.length}/${needBonds.value}）`
        }, 600)
      }
    }
  }
}

function onPickNumber(n: number) {
  if (playAs.value === 'neighbors') {
    if (n === center.value) {
      speak('它自己不算邻居哦')
      return
    }
    if (![center.value - 1, center.value + 1].includes(n)) {
      wrongStreak.value++
      speak('再想想前后是谁')
      if (wrongStreak.value >= 2) {
        choices.value = shuffle([center.value - 1, center.value + 1])
      }
      return
    }
    if (!pickedNeighbors.value.includes(n)) pickedNeighbors.value.push(n)
    lineNeighbors.value = [...pickedNeighbors.value]
    flashN.value = n
    if (pickedNeighbors.value.length >= 2) winSoft()
    else speak('还有一个邻居')
    return
  }

  const correct = playAs.value === 'compare' ? diff.value : target.value

  if (n !== correct) {
    wrongStreak.value++
    speak('再数一遍')
    unlockChoices(correct)
    return
  }
  flashN.value = n
  winSoft()
}

function playFamily(kind: 'a+b' | 'b+a' | 'n-a' | 'n-b') {
  famDemo.value = kind
  if (kind === 'a+b') speak(`${famA.value} 加 ${famB.value} 等于 ${famN.value}`)
  if (kind === 'b+a') speak(`${famB.value} 加 ${famA.value} 等于 ${famN.value}`)
  if (kind === 'n-a') speak(`${famN.value} 减 ${famA.value} 等于 ${famB.value}`)
  if (kind === 'n-b') speak(`${famN.value} 减 ${famB.value} 等于 ${famA.value}`)
}

function finishFamily() {
  famDone.value = true
  completeRec('family', 2)
  celebrate.value = true
}

function winSoft() {
  speak('太棒了')
  qIndex.value++

  if (mode.value === 'challenge') {
    challengeLeft.value--
    if (challengeLeft.value <= 0) {
      completeRec('challenge', 3)
      celebrate.value = true
      return
    }
    window.setTimeout(nextChallenge, 500)
    return
  }

  if (mode.value === 'split') {
    completeRec('split', 2)
    celebrate.value = true
    return
  }

  if (mode.value === 'neighbors') {
    if (qIndex.value >= 3) {
      completeRec('neighbors', 2)
      celebrate.value = true
    } else window.setTimeout(startNeighbors, 600)
    return
  }

  if (mode.value === 'compare') {
    if (qIndex.value >= 3) {
      completeRec('compare', 2)
      celebrate.value = true
    } else window.setTimeout(startCompare, 600)
    return
  }

  if (mode.value === 'countPick') {
    if (qIndex.value >= 4) {
      completeRec('countPick', 2)
      celebrate.value = true
    } else window.setTimeout(startCountPick, 600)
    return
  }

  if (mode.value === 'takeN') {
    if (qIndex.value >= 4) {
      completeRec('takeN', 2)
      celebrate.value = true
    } else window.setTimeout(startTakeN, 600)
  }
}

function nextMode() {
  celebrate.value = false
  const order = REC_MODES.map((m) => m.id)
  const i = order.indexOf(mode.value)
  if (i >= 0 && i < order.length - 1) router.push(`/sense/recognize/${order[i + 1]}`)
  else router.push('/sense/recognize')
}

function pileItems(p: Pile) {
  return items.filter((it) => (piles[it.id] || 'pool') === p)
}
</script>

<template>
  <SenseChrome :title="meta?.name || '认一认'" :prompt="prompt" back-to="/sense/recognize">
    <NumberLine
      v-if="playAs === 'neighbors' || playAs === 'compare' || lineHighlight"
      class="nl"
      :highlight="lineHighlight || center"
      :neighbors="lineNeighbors"
    />

    <!-- hello -->
    <div v-if="mode === 'hello'" class="hello">
      <button type="button" class="big" :class="{ pulse: bigPulse }" @click="onHelloTap">
        {{ target }}
      </button>
      <div class="hello-apples">
        <CountItem v-for="i in applesShown" :key="i" skin="apple" :size="48" :bouncing="true" />
      </div>
    </div>

    <!-- count pick field -->
    <div v-else-if="playAs === 'countPick'" class="field">
      <div
        v-for="it in items"
        :key="it.id"
        class="abs"
        :style="{ left: it.x + '%', top: it.y + '%' }"
      >
        <CountItem
          skin="apple"
          :lit="it.lit"
          @click="onTapItem(it)"
        />
      </div>
    </div>

    <!-- take N -->
    <div v-else-if="playAs === 'takeN'" class="take">
      <div class="digit">{{ target }}</div>
      <div class="basket">
        <span class="blabel">篮子 {{ basketCount }}/{{ target }}</span>
        <CountItem
          v-for="it in items.filter((x) => x.inBasket)"
          :key="'b' + it.id"
          skin="apple"
          :size="40"
          @click="onTapItem(it)"
        />
      </div>
      <div class="pool">
        <CountItem
          v-for="it in items.filter((x) => !x.inBasket)"
          :key="it.id"
          skin="apple"
          :size="44"
          @click="onTapItem(it)"
        />
      </div>
    </div>

    <!-- split -->
    <div v-else-if="mode === 'split'" class="split">
      <div class="plates">
        <div class="plate">
          <span class="pn">{{ leftIds.length }}</span>
          <CountItem v-for="it in pileItems('L')" :key="it.id" skin="apple" :size="40" @click="onTapItem(it)" />
        </div>
        <div class="plate cold">
          <span class="pn">{{ rightIds.length }}</span>
          <CountItem v-for="it in pileItems('R')" :key="it.id" skin="apple" :size="40" @click="onTapItem(it)" />
        </div>
      </div>
      <div class="pool">
        <CountItem v-for="it in pileItems('pool')" :key="it.id" skin="apple" :size="46" @click="onTapItem(it)" />
      </div>
      <div class="bonds">
        <span v-for="b in foundBonds" :key="b" class="bond">{{ splitN }}={{ b }}</span>
      </div>
    </div>

    <!-- family -->
    <div v-else-if="mode === 'family'" class="family">
      <div class="pool center">
        <CountItem v-for="it in items" :key="it.id" skin="apple" :size="42" />
      </div>
      <div class="fam-btns">
        <button class="hot fam" :class="{ on: famDemo === 'a+b' }" @click="playFamily('a+b')">
          {{ famA }}+{{ famB }}
        </button>
        <button class="hot fam" :class="{ on: famDemo === 'b+a' }" @click="playFamily('b+a')">
          {{ famB }}+{{ famA }}
        </button>
        <button class="hot fam" :class="{ on: famDemo === 'n-a' }" @click="playFamily('n-a')">
          {{ famN }}-{{ famA }}
        </button>
        <button class="hot fam" :class="{ on: famDemo === 'n-b' }" @click="playFamily('n-b')">
          {{ famN }}-{{ famB }}
        </button>
      </div>
      <p class="hint">点每个算式听一听、看一看</p>
      <button class="hot btn-primary done" @click="finishFamily">都看过啦</button>
    </div>

    <!-- compare -->
    <div v-else-if="playAs === 'compare'" class="compare">
      <div class="row">
        <div class="heap">
          <CountItem v-for="i in big" :key="'b' + i" skin="apple" :size="36" />
          <span>{{ big }}</span>
        </div>
        <div class="heap">
          <CountItem v-for="i in small" :key="'s' + i" skin="carrot" :size="36" />
          <span>{{ small }}</span>
        </div>
      </div>
    </div>

    <NumberButtons
      v-if="choices.length && playAs !== 'hello' && playAs !== 'family' && playAs !== 'split' && playAs !== 'takeN'"
      class="nums"
      :options="choices"
      :flash-correct="flashN"
      @pick="onPickNumber"
    />

    <p v-if="mode === 'challenge'" class="prog">还剩 {{ challengeLeft }} 题</p>

    <Celebrate
      :show="celebrate"
      :sticker="mode === 'challenge'"
      @next="nextMode"
      @again="startMode"
      @home="router.push('/sense/recognize')"
    />
  </SenseChrome>
</template>

<style scoped>
.nl { margin: 8px 12px 0; }
.hello { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 24px 12px; }
.big {
  width: 160px;
  height: 160px;
  border-radius: 36px;
  background: var(--hero);
  color: #fff;
  font-size: 96px;
  font-weight: 900;
  box-shadow: 0 8px 0 #e8907c;
}
.big.pulse { animation: glow 0.45s ease; }
.hello-apples { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; min-height: 56px; }
.field {
  position: relative;
  height: 260px;
  margin: 12px;
  background: rgba(255, 255, 255, 0.55);
  border-radius: 24px;
}
.abs { position: absolute; transform: translate(-50%, -50%); }
.take { padding: 12px; display: flex; flex-direction: column; gap: 10px; align-items: center; }
.digit {
  font-size: 72px;
  font-weight: 900;
  color: var(--accent-strong);
  line-height: 1;
}
.basket {
  width: 100%;
  min-height: 100px;
  border-radius: 24px;
  background: #f3e0c8;
  border: 4px dashed #d4a574;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  position: relative;
}
.blabel {
  position: absolute;
  top: -12px;
  left: 12px;
  background: var(--card);
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 800;
  font-size: 14px;
}
.pool {
  width: 100%;
  min-height: 90px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 20px;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}
.pool.center { justify-content: center; }
.split { padding: 12px; }
.plates { display: flex; gap: 10px; }
.plate {
  flex: 1;
  min-height: 110px;
  background: #ffe8d6;
  border-radius: 22px;
  padding: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  position: relative;
}
.plate.cold { background: #d9eef7; }
.pn { position: absolute; top: 6px; right: 10px; font-weight: 900; opacity: 0.45; font-size: 20px; }
.bonds { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; justify-content: center; }
.bond { background: var(--lavender); border-radius: 14px; padding: 6px 10px; font-weight: 800; }
.family { padding: 12px; }
.fam-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
.fam {
  background: var(--card);
  box-shadow: var(--shadow);
  font-size: 24px;
  font-weight: 900;
  min-height: 64px;
}
.fam.on { background: var(--mint); }
.hint { text-align: center; font-weight: 700; color: var(--ink-soft); }
.done { width: calc(100% - 24px); margin: 8px 12px 0; }
.compare { padding: 12px; }
.row { display: flex; gap: 10px; }
.heap {
  flex: 1;
  background: var(--card);
  border-radius: 20px;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  font-weight: 900;
  font-size: 22px;
}
.nums { margin-top: 10px; }
.prog { text-align: center; font-weight: 800; color: var(--ink-soft); }
@keyframes glow {
  40% { transform: scale(1.12); box-shadow: 0 0 0 12px rgba(255, 201, 77, 0.4); }
}
</style>
