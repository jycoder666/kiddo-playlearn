<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import CountItem from '../../components/sense/CountItem.vue'
import NumberButtons from '../../components/sense/NumberButtons.vue'
import NumberLine from '../../components/sense/NumberLine.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import { REC_MODES, type RecModeId } from '../../data/sense/meta'
import { getSkin, type ItemSkin } from '../../data/sense/items'
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
import { recordAnswer } from '../../composables/useStats'
import { noteWrongAnswer } from '../../composables/useWrongRest'
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
const splitHint = ref('')
const dupBondFlash = ref<string | null>(null)
type Pile = 'pool' | 'L' | 'R'
const piles = reactive<Record<number, Pile>>({})

/* family */
type FamKind = 'a+b' | 'b+a' | 'n-a' | 'n-b'
const famA = ref(2)
const famB = ref(3)
const famN = computed(() => famA.value + famB.value)
const famDemo = ref<FamKind | null>(null)
const famDone = ref(false)
const famSeen = ref<Set<string>>(new Set())
const famEq = ref('')
const famHeapL = ref(0)
const famHeapR = ref(0)
const famOp = ref<'+' | '−'>('+')
const famResult = ref(0)
const famBounce = ref(false)
/** 相等加数（5+5）时加减各只留一个，避免重复按钮 */
const famButtons = computed(() => {
  const a = famA.value
  const b = famB.value
  const n = famN.value
  if (a === b) {
    return [
      { kind: 'a+b' as const, label: `${a}+${b}` },
      { kind: 'n-a' as const, label: `${n}-${a}` },
    ]
  }
  return [
    { kind: 'a+b' as const, label: `${a}+${b}` },
    { kind: 'b+a' as const, label: `${b}+${a}` },
    { kind: 'n-a' as const, label: `${n}-${a}` },
    { kind: 'n-b' as const, label: `${n}-${b}` },
  ]
})
const famNeed = computed(() => famButtons.value.length)

/* compare */
const big = ref(7)
const small = ref(5)
const diff = computed(() => big.value - small.value)

/* neighbors：左盘=前一个(N−1)，右盘=后一个(N+1) */
const center = ref(5)
const pickedNeighbors = ref<number[]>([])
const nbPrev = ref<number | null>(null)
const nbNext = ref<number | null>(null)
const nbPool = computed(() =>
  choices.value.filter((n) => n !== nbPrev.value && n !== nbNext.value),
)
const toast = ref('')
let toastTimer: number | undefined

function showToast(msg: string, ms = 2200) {
  toast.value = msg
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = ''), ms)
}

/* challenge */
const challengeLeft = ref(5)
const challengePool: RecModeId[] = ['countPick', 'takeN', 'neighbors', 'compare']
const activeSub = ref<RecModeId | null>(null)

const missedOnce = ref(false)

/** 牌组：同一关连抽不重复，抽完再洗一副 */
function loadNumberDeck(key: string, min: number, max: number): number[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const nums = JSON.parse(raw) as unknown[]
    const seen = new Set<number>()
    return nums.filter((n): n is number => {
      if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max || seen.has(n)) return false
      seen.add(n)
      return true
    })
  } catch {
    return []
  }
}

function makeDeck(min: number, max: number): number[] {
  const pool: number[] = []
  for (let n = min; n <= max; n++) pool.push(n)
  return shuffle(pool)
}

function nextFromDeck(deck: { value: number[] }, key: string, min: number, max: number): number {
  if (!deck.value.length) deck.value = makeDeck(min, max)
  const n = deck.value.pop() as number
  localStorage.setItem(key, JSON.stringify(deck.value))
  return n
}

const HELLO_DECK_KEY = 'kiddo-playlearn:hello-deck'
const COUNT_PICK_DECK_KEY = 'kiddo-playlearn:count-pick-deck'
const TAKE_N_DECK_KEY = 'kiddo-playlearn:take-n-deck'
const helloDeck = ref<number[]>(loadNumberDeck(HELLO_DECK_KEY, 1, 10))
const countPickDeck = ref<number[]>(loadNumberDeck(COUNT_PICK_DECK_KEY, 1, 10))
const takeNDeck = ref<number[]>(loadNumberDeck(TAKE_N_DECK_KEY, 1, 8))

function nextHelloNumber() {
  return nextFromDeck(helloDeck, HELLO_DECK_KEY, 1, 10)
}

function nextCountPickNumber() {
  return nextFromDeck(countPickDeck, COUNT_PICK_DECK_KEY, 1, 10)
}

function nextTakeNNumber() {
  return nextFromDeck(takeNDeck, TAKE_N_DECK_KEY, 1, 8)
}

function markMiss() {
  if (missedOnce.value) return
  missedOnce.value = true
  noteWrongAnswer()
}

type TakeDrop = 'basket' | 'pool'
const takeDropHover = ref<TakeDrop | null>(null)
const takeDragGhost = ref<{ id: number; x: number; y: number; emoji: string } | null>(null)
let takeDragId: number | null = null
let takeDragFrom: TakeDrop | null = null
let takeDragMoved = false
let takeDragOrigin = { x: 0, y: 0 }

type NbDrop = 'prev' | 'next' | 'pool'
const nbDropHover = ref<NbDrop | null>(null)
const nbDragGhost = ref<{ n: number; x: number; y: number } | null>(null)
let nbDragN: number | null = null
let nbDragFrom: NbDrop | null = null
let nbDragMoved = false
let nbDragOrigin = { x: 0, y: 0 }

type SplitDrop = Pile
const splitDropHover = ref<SplitDrop | null>(null)
const splitDragGhost = ref<{ id: number; x: number; y: number; emoji: string } | null>(null)
let splitDragId: number | null = null
let splitDragMoved = false
let splitDragOrigin = { x: 0, y: 0 }

function clearTakeDragListeners() {
  window.removeEventListener('pointermove', onTakePointerMove)
  window.removeEventListener('pointerup', onTakePointerUp)
  window.removeEventListener('pointercancel', onTakePointerUp)
}

function takeDropFromPoint(x: number, y: number): TakeDrop | null {
  const el = document.elementFromPoint(x, y) as HTMLElement | null
  if (!el) return null
  const zone = el.closest('[data-drop]') as HTMLElement | null
  const pile = zone?.dataset.drop
  if (pile === 'basket' || pile === 'pool') return pile
  return null
}

function applyTakeMove(it: (typeof items)[0], intoBasket: boolean) {
  if (intoBasket) {
    if (it.inBasket) return
    if (basketCount.value >= target.value) {
      speak('够啦，多了可以拖回去或点篮子里的拿回去')
      return
    }
    it.inBasket = true
  } else {
    if (!it.inBasket) return
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
}

function onTakePointerMove(e: PointerEvent) {
  if (takeDragId == null || !takeDragGhost.value) return
  const dx = e.clientX - takeDragOrigin.x
  const dy = e.clientY - takeDragOrigin.y
  if (dx * dx + dy * dy > 64) takeDragMoved = true
  takeDragGhost.value = { ...takeDragGhost.value, x: e.clientX, y: e.clientY }
  takeDropHover.value = takeDropFromPoint(e.clientX, e.clientY)
}

function onTakePointerUp(e: PointerEvent) {
  if (takeDragId == null) return
  clearTakeDragListeners()
  const id = takeDragId
  const from = takeDragFrom
  const moved = takeDragMoved
  const drop = takeDropFromPoint(e.clientX, e.clientY)
  takeDragId = null
  takeDragFrom = null
  takeDragMoved = false
  takeDragGhost.value = null
  takeDropHover.value = null
  const it = items.find((x) => x.id === id)
  if (!it || !from) return
  if (!moved) {
    applyTakeMove(it, !it.inBasket)
    return
  }
  if (drop === 'basket') applyTakeMove(it, true)
  else if (drop === 'pool') applyTakeMove(it, false)
}

function onTakePointerDown(it: (typeof items)[0], from: TakeDrop, e: PointerEvent) {
  if (playAs.value !== 'takeN') return
  e.preventDefault()
  const el = e.currentTarget as HTMLElement
  try {
    el.setPointerCapture(e.pointerId)
  } catch {
    /* 部分环境可不捕获，改用 window 监听 */
  }
  takeDragId = it.id
  takeDragFrom = from
  takeDragMoved = false
  takeDragOrigin = { x: e.clientX, y: e.clientY }
  takeDragGhost.value = {
    id: it.id,
    x: e.clientX,
    y: e.clientY,
    emoji: getSkin('apple').emoji,
  }
  takeDropHover.value = null
  clearTakeDragListeners()
  window.addEventListener('pointermove', onTakePointerMove)
  window.addEventListener('pointerup', onTakePointerUp)
  window.addEventListener('pointercancel', onTakePointerUp)
}

function clearNbDragListeners() {
  window.removeEventListener('pointermove', onNbPointerMove)
  window.removeEventListener('pointerup', onNbPointerUp)
  window.removeEventListener('pointercancel', onNbPointerUp)
}

function nbDropFromPoint(x: number, y: number): NbDrop | null {
  const el = document.elementFromPoint(x, y) as HTMLElement | null
  if (!el) return null
  const zone = el.closest('[data-drop]') as HTMLElement | null
  const pile = zone?.dataset.drop
  if (pile === 'prev' || pile === 'next' || pile === 'pool') return pile
  return null
}

function syncNbLine() {
  lineNeighbors.value = [nbPrev.value, nbNext.value].filter((n): n is number => n != null)
  pickedNeighbors.value = [...lineNeighbors.value]
}

function tryNeighborsWin() {
  syncNbLine()
  if (nbPrev.value === center.value - 1 && nbNext.value === center.value + 1) {
    noteRecRound(`${center.value - 1}和${center.value + 1}`)
    window.setTimeout(() => winSoft(), 350)
    return true
  }
  return false
}

function rejectNb(n: number, slot: 'prev' | 'next') {
  const other = slot === 'prev' ? center.value + 1 : center.value - 1
  markMiss()
  wrongStreak.value++
  let msg = ''
  if (n === other) {
    msg = slot === 'prev' ? '这个是后一个，请放到右边盘子' : '这个是前一个，请放到左边盘子'
  } else if (n === center.value) {
    msg = '它自己不算邻居哦'
  } else {
    msg = slot === 'prev' ? `前一个是 ${center.value} 减 1` : `后一个是 ${center.value} 加 1`
  }
  showToast(msg)
  speak(msg)
  // 拖放模式不收窄底部选项，避免干扰项「消失」；错多次仍用吐司/语音引导
}

function placeNb(n: number, slot: 'prev' | 'next', from: NbDrop) {
  const expect = slot === 'prev' ? center.value - 1 : center.value + 1
  if (n !== expect) {
    rejectNb(n, slot)
    return
  }
  // 成功后再腾出原位，避免放错时丢掉已放对的
  if (from === 'prev' && slot !== 'prev') nbPrev.value = null
  if (from === 'next' && slot !== 'next') nbNext.value = null
  if (slot === 'prev') nbPrev.value = n
  else nbNext.value = n
  speak(String(n))
  if (!tryNeighborsWin()) {
    speak(slot === 'prev' ? '前一个对啦，再放后一个' : '后一个对啦，再放前一个')
  }
}

function onNbPointerMove(e: PointerEvent) {
  if (nbDragN == null || !nbDragGhost.value) return
  const dx = e.clientX - nbDragOrigin.x
  const dy = e.clientY - nbDragOrigin.y
  if (dx * dx + dy * dy > 64) nbDragMoved = true
  nbDragGhost.value = { ...nbDragGhost.value, x: e.clientX, y: e.clientY }
  nbDropHover.value = nbDropFromPoint(e.clientX, e.clientY)
}

function onNbPointerUp(e: PointerEvent) {
  if (nbDragN == null) return
  clearNbDragListeners()
  const n = nbDragN
  const from = nbDragFrom
  const moved = nbDragMoved
  const drop = nbDropFromPoint(e.clientX, e.clientY)
  nbDragN = null
  nbDragFrom = null
  nbDragMoved = false
  nbDragGhost.value = null
  nbDropHover.value = null
  if (from == null) return

  // 轻点：不移动，忽略（必须拖进盘子，保证前后顺序）
  if (!moved) return

  if (drop === 'pool') {
    if (from === 'prev') nbPrev.value = null
    if (from === 'next') nbNext.value = null
    syncNbLine()
    return
  }
  if (drop === 'prev' || drop === 'next') {
    placeNb(n, drop, from)
  }
}

function onNbPointerDown(n: number, from: NbDrop, e: PointerEvent) {
  if (playAs.value !== 'neighbors') return
  e.preventDefault()
  const el = e.currentTarget as HTMLElement
  try {
    el.setPointerCapture(e.pointerId)
  } catch {
    /* ignore */
  }
  nbDragN = n
  nbDragFrom = from
  nbDragMoved = false
  nbDragOrigin = { x: e.clientX, y: e.clientY }
  nbDragGhost.value = { n, x: e.clientX, y: e.clientY }
  nbDropHover.value = null
  clearNbDragListeners()
  window.addEventListener('pointermove', onNbPointerMove)
  window.addEventListener('pointerup', onNbPointerUp)
  window.addEventListener('pointercancel', onNbPointerUp)
}

function clearSplitDragListeners() {
  window.removeEventListener('pointermove', onSplitPointerMove)
  window.removeEventListener('pointerup', onSplitPointerUp)
  window.removeEventListener('pointercancel', onSplitPointerUp)
}

function splitDropFromPoint(x: number, y: number): SplitDrop | null {
  const el = document.elementFromPoint(x, y) as HTMLElement | null
  if (!el) return null
  const zone = el.closest('[data-drop]') as HTMLElement | null
  const pile = zone?.dataset.drop
  if (pile === 'L' || pile === 'R' || pile === 'pool') return pile
  return null
}

function resetSplitPlates() {
  items.forEach((x) => {
    piles[x.id] = 'pool'
  })
  leftIds.value = []
  rightIds.value = []
}

function tryCommitRecSplit() {
  const a = leftIds.value.length
  const b = rightIds.value.length
  if (a + b !== splitN.value || a < 1 || b < 1) return
  const key = bondKey(a, b)
  if (foundBonds.value.includes(key)) {
    prompt.value = '这种已经分过啦'
    splitHint.value = '盘子已清空，换一种分法试试'
    dupBondFlash.value = key
    speak('这个已经有过啦，换一种分法试试')
    window.setTimeout(() => {
      resetSplitPlates()
      prompt.value = `再找一种（${foundBonds.value.length}/${needBonds.value}）`
      splitHint.value = ''
      dupBondFlash.value = null
    }, 2600)
    return
  }
  foundBonds.value.push(key)
  splitHint.value = ''
  dupBondFlash.value = null
  speak(`${splitN.value} 等于 ${a} 加 ${b}`)
  if (foundBonds.value.length >= needBonds.value) winSoft()
  else {
    window.setTimeout(() => {
      resetSplitPlates()
      prompt.value = `再找一种（${foundBonds.value.length}/${needBonds.value}）`
    }, 600)
  }
}

function moveSplitToPile(id: number, pile: SplitDrop) {
  const cur = piles[id] || 'pool'
  if (cur === pile) {
    tryCommitRecSplit()
    return
  }
  leftIds.value = leftIds.value.filter((x) => x !== id)
  rightIds.value = rightIds.value.filter((x) => x !== id)
  piles[id] = pile
  if (pile === 'L') leftIds.value.push(id)
  if (pile === 'R') rightIds.value.push(id)
  tryCommitRecSplit()
}

function onSplitPointerMove(e: PointerEvent) {
  if (splitDragId == null || !splitDragGhost.value) return
  const dx = e.clientX - splitDragOrigin.x
  const dy = e.clientY - splitDragOrigin.y
  if (dx * dx + dy * dy > 64) splitDragMoved = true
  splitDragGhost.value = { ...splitDragGhost.value, x: e.clientX, y: e.clientY }
  splitDropHover.value = splitDropFromPoint(e.clientX, e.clientY)
}

function onSplitPointerUp(e: PointerEvent) {
  if (splitDragId == null) return
  clearSplitDragListeners()
  const id = splitDragId
  const moved = splitDragMoved
  const drop = splitDropFromPoint(e.clientX, e.clientY)
  splitDragId = null
  splitDragMoved = false
  splitDragGhost.value = null
  splitDropHover.value = null
  const it = items.find((x) => x.id === id)
  if (!it) return
  if (!moved) {
    // 轻点：盘上→池；池里→分到较空的一边
    const cur = piles[it.id] || 'pool'
    if (cur === 'L' || cur === 'R') moveSplitToPile(it.id, 'pool')
    else {
      const prefer: Pile = leftIds.value.length <= rightIds.value.length ? 'L' : 'R'
      moveSplitToPile(it.id, prefer)
    }
    return
  }
  if (drop) moveSplitToPile(id, drop)
}

function onSplitPointerDown(it: (typeof items)[0], e: PointerEvent) {
  if (mode.value !== 'split') return
  e.preventDefault()
  const el = e.currentTarget as HTMLElement
  try {
    el.setPointerCapture(e.pointerId)
  } catch {
    /* ignore */
  }
  splitDragId = it.id
  splitDragMoved = false
  splitDragOrigin = { x: e.clientX, y: e.clientY }
  splitDragGhost.value = {
    id: it.id,
    x: e.clientX,
    y: e.clientY,
    emoji: getSkin('apple').emoji,
  }
  splitDropHover.value = null
  clearSplitDragListeners()
  window.addEventListener('pointermove', onSplitPointerMove)
  window.addEventListener('pointerup', onSplitPointerUp)
  window.addEventListener('pointercancel', onSplitPointerUp)
}

function reset() {
  wrongStreak.value = 0
  missedOnce.value = false
  flashN.value = null
  celebrate.value = false
  bigPulse.value = false
  applesShown.value = 0
  famDemo.value = null
  famDone.value = false
  famSeen.value = new Set()
  famEq.value = ''
  famHeapL.value = 0
  famHeapR.value = 0
  famBounce.value = false
  pickedNeighbors.value = []
  leftIds.value = []
  rightIds.value = []
  foundBonds.value = []
  splitHint.value = ''
  dupBondFlash.value = null
  lineHighlight.value = null
  lineNeighbors.value = []
  items.splice(0, items.length)
  Object.keys(piles).forEach((k) => delete piles[Number(k)])
  choices.value = []
  clearTakeDragListeners()
  takeDragId = null
  takeDragFrom = null
  takeDragMoved = false
  takeDragGhost.value = null
  takeDropHover.value = null
  clearNbDragListeners()
  nbDragN = null
  nbDragFrom = null
  nbDragMoved = false
  nbDragGhost.value = null
  nbDropHover.value = null
  nbPrev.value = null
  nbNext.value = null
  toast.value = ''
  window.clearTimeout(toastTimer)
  clearSplitDragListeners()
  splitDragId = null
  splitDragMoved = false
  splitDragGhost.value = null
  splitDropHover.value = null
}

function unlockChoices(correct: number) {
  choices.value = numberChoices(correct, 4, wrongStreak.value >= 2)
}

function startHello() {
  reset()
  target.value = nextHelloNumber()
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
  target.value = nextCountPickNumber()
  const pos = scatterPositions(target.value)
  pos.forEach((p, i) => items.push({ id: i + 1, x: p.x, y: p.y, lit: false, inBasket: false }))
  prompt.value = '点亮每一个，再选出数字'
  speak(prompt.value)
}

function startTakeN() {
  reset()
  target.value = nextTakeNNumber()
  const total = 10
  const pos = scatterPositions(total)
  pos.forEach((p, i) => items.push({ id: i + 1, x: p.x, y: p.y, lit: false, inBasket: false }))
  prompt.value = `篮子里放 ${target.value} 个苹果`
  speak(`篮子里放 ${target.value} 个苹果，拖进去或点一下`)
}

function startNeighbors() {
  reset()
  center.value = randInt(2, 9)
  lineHighlight.value = center.value
  lineNeighbors.value = []
  pickedNeighbors.value = []
  nbPrev.value = null
  nbNext.value = null
  const opts = new Set<number>([center.value - 1, center.value + 1])
  while (opts.size < 4) {
    const n = randInt(1, 10)
    if (n !== center.value) opts.add(n)
  }
  choices.value = shuffle([...opts])
  prompt.value = `${center.value} 的邻居是谁？拖进左右盘子`
  speak(
    `${center.value} 的邻居是谁？前一个是 ${center.value} 减一，拖到左边；后一个是 ${center.value} 加一，拖到右边`,
  )
}

function startSplit() {
  reset()
  splitN.value = randInt(4, 10)
  needBonds.value = Math.min(3, bondsOf(splitN.value).length)
  for (let i = 1; i <= splitN.value; i++) {
    items.push({ id: i, x: 0, y: 0, lit: false, inBasket: false })
    piles[i] = 'pool'
  }
  prompt.value = `${splitN.value} 可以分成几和几？拖进左右盘`
  speak(`${splitN.value} 可以分成几和几？把苹果拖进左右盘子`)
}

function startFamily() {
  reset()
  famA.value = randInt(1, 5)
  famB.value = randInt(1, 10 - famA.value)
  famSeen.value = new Set()
  famEq.value = ''
  famHeapL.value = 0
  famHeapR.value = 0
  famResult.value = famN.value
  famOp.value = '+'
  famBounce.value = false
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
    applyTakeMove(it, !it.inBasket)
    return
  }

  if (mode.value === 'split') {
    const cur = piles[it.id] || 'pool'
    if (cur === 'L' || cur === 'R') moveSplitToPile(it.id, 'pool')
    else {
      const prefer: Pile = leftIds.value.length <= rightIds.value.length ? 'L' : 'R'
      moveSplitToPile(it.id, prefer)
    }
  }
}

function onPickNumber(n: number) {
  const correct = playAs.value === 'compare' ? diff.value : target.value

  if (n !== correct) {
    markMiss()
    wrongStreak.value++
    speak('再数一遍')
    unlockChoices(correct)
    return
  }
  flashN.value = n
  noteRecRound(String(correct))
  winSoft()
}

function noteRecRound(label: string) {
  const name = meta.value?.name
  if (!name) return
  recordAnswer({
    id: `rec:${mode.value}`,
    name,
    group: 'rec',
    ok: !missedOnce.value,
    label,
  })
}

function playFamily(kind: FamKind) {
  famDemo.value = kind
  famSeen.value = new Set([...famSeen.value, kind])
  famBounce.value = false
  // 下一帧再触发弹跳，保证每次点击都有动效
  window.requestAnimationFrame(() => {
    famBounce.value = true
    window.setTimeout(() => (famBounce.value = false), 500)
  })

  let text = ''
  if (kind === 'a+b') {
    famHeapL.value = famA.value
    famHeapR.value = famB.value
    famOp.value = '+'
    famResult.value = famN.value
    famEq.value = `${famA.value}+${famB.value}=${famN.value}`
    text = `${famA.value} 加 ${famB.value} 等于 ${famN.value}`
  } else if (kind === 'b+a') {
    famHeapL.value = famB.value
    famHeapR.value = famA.value
    famOp.value = '+'
    famResult.value = famN.value
    famEq.value = `${famB.value}+${famA.value}=${famN.value}`
    text = `${famB.value} 加 ${famA.value} 等于 ${famN.value}`
  } else if (kind === 'n-a') {
    famHeapL.value = famN.value
    famHeapR.value = famA.value
    famOp.value = '−'
    famResult.value = famB.value
    famEq.value = `${famN.value}−${famA.value}=${famB.value}`
    text = `${famN.value} 减 ${famA.value} 等于 ${famB.value}`
  } else {
    famHeapL.value = famN.value
    famHeapR.value = famB.value
    famOp.value = '−'
    famResult.value = famA.value
    famEq.value = `${famN.value}−${famB.value}=${famA.value}`
    text = `${famN.value} 减 ${famB.value} 等于 ${famA.value}`
  }
  prompt.value = text
  speak(text)
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
  <SenseChrome
    :title="meta?.name || '认一认'"
    :prompt="prompt"
    :hint="
      playAs === 'neighbors'
        ? '邻居 = 前一个（减1）和 后一个（加1）'
        : mode === 'split' && splitHint
          ? splitHint
          : undefined
    "
    back-to="/sense/recognize"
  >
    <NumberLine
      v-if="playAs === 'neighbors' || playAs === 'compare' || lineHighlight"
      class="nl"
      :highlight="lineHighlight || center"
      :neighbors="lineNeighbors"
    />

    <!-- 邻居：左右盘拖放，顺序必须 前=N−1 / 后=N+1 -->
    <div v-if="playAs === 'neighbors'" class="nb-board">
      <div class="nb-eq">
        <div
          class="nb-card prev"
          data-drop="prev"
          :class="{ hover: nbDropHover === 'prev', filled: nbPrev != null }"
        >
          <span class="nb-tag">前一个 · {{ center }}−1</span>
          <div
            v-if="nbPrev != null"
            class="drag-chip nb-placed"
            role="button"
            tabindex="0"
            aria-label="前一个，可拖回"
            :class="{ dragging: nbDragGhost?.n === nbPrev }"
            @pointerdown="onNbPointerDown(nbPrev, 'prev', $event)"
          >
            <span class="nb-fill">{{ nbPrev }}</span>
          </div>
          <span v-else class="nb-slot">拖到这里</span>
        </div>
        <div class="nb-card mid">
          <span class="nb-tag">自己</span>
          <span class="nb-math self">{{ center }}</span>
        </div>
        <div
          class="nb-card next"
          data-drop="next"
          :class="{ hover: nbDropHover === 'next', filled: nbNext != null }"
        >
          <span class="nb-tag">后一个 · {{ center }}+1</span>
          <div
            v-if="nbNext != null"
            class="drag-chip nb-placed"
            role="button"
            tabindex="0"
            aria-label="后一个，可拖回"
            :class="{ dragging: nbDragGhost?.n === nbNext }"
            @pointerdown="onNbPointerDown(nbNext, 'next', $event)"
          >
            <span class="nb-fill">{{ nbNext }}</span>
          </div>
          <span v-else class="nb-slot">拖到这里</span>
        </div>
      </div>
      <div
        class="nb-pool"
        data-drop="pool"
        :class="{ hover: nbDropHover === 'pool' }"
      >
        <div
          v-for="n in nbPool"
          :key="n"
          class="drag-chip nb-chip"
          role="button"
          tabindex="0"
          :aria-label="`数字 ${n}，拖进盘子`"
          :class="{ dragging: nbDragGhost?.n === n }"
          @pointerdown="onNbPointerDown(n, 'pool', $event)"
        >
          {{ n }}
        </div>
      </div>
    </div>

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

    <!-- take N：拖进篮子 / 拖回池子，轻点也可 -->
    <div v-else-if="playAs === 'takeN'" class="take">
      <div class="digit">{{ target }}</div>
      <div
        class="basket"
        data-drop="basket"
        :class="{ hover: takeDropHover === 'basket' }"
      >
        <span class="blabel">篮子 {{ basketCount }}/{{ target }}</span>
        <div
          v-for="it in items.filter((x) => x.inBasket)"
          :key="'b' + it.id"
          class="drag-chip"
          role="button"
          tabindex="0"
          aria-label="篮子里的苹果，拖回或点一下拿出去"
          :class="{ dragging: takeDragGhost?.id === it.id }"
          @pointerdown="onTakePointerDown(it, 'basket', $event)"
          @pointermove="onTakePointerMove"
          @pointerup="onTakePointerUp"
          @pointercancel="onTakePointerUp"
        >
          <CountItem skin="apple" :size="40" :interactive="false" />
        </div>
      </div>
      <div
        class="pool"
        data-drop="pool"
        :class="{ hover: takeDropHover === 'pool' }"
      >
        <div
          v-for="it in items.filter((x) => !x.inBasket)"
          :key="it.id"
          class="drag-chip"
          role="button"
          tabindex="0"
          aria-label="苹果，拖进篮子或点一下"
          :class="{ dragging: takeDragGhost?.id === it.id }"
          @pointerdown="onTakePointerDown(it, 'pool', $event)"
          @pointermove="onTakePointerMove"
          @pointerup="onTakePointerUp"
          @pointercancel="onTakePointerUp"
        >
          <CountItem skin="apple" :size="44" :interactive="false" />
        </div>
      </div>
    </div>

    <!-- split：拖进左右盘，轻点也可 -->
    <div v-else-if="mode === 'split'" class="split">
      <div class="plates">
        <div
          class="plate"
          data-drop="L"
          :class="{ hover: splitDropHover === 'L' }"
        >
          <div class="plate-items">
            <div
              v-for="it in pileItems('L')"
              :key="it.id"
              class="drag-chip"
              role="button"
              tabindex="0"
              aria-label="左盘苹果，可拖走"
              :class="{ dragging: splitDragGhost?.id === it.id }"
              @pointerdown="onSplitPointerDown(it, $event)"
            >
              <CountItem skin="apple" :size="40" :interactive="false" />
            </div>
          </div>
          <div class="plate-num" aria-hidden="true">{{ leftIds.length }}</div>
        </div>
        <div
          class="plate cold"
          data-drop="R"
          :class="{ hover: splitDropHover === 'R' }"
        >
          <div class="plate-items">
            <div
              v-for="it in pileItems('R')"
              :key="it.id"
              class="drag-chip"
              role="button"
              tabindex="0"
              aria-label="右盘苹果，可拖走"
              :class="{ dragging: splitDragGhost?.id === it.id }"
              @pointerdown="onSplitPointerDown(it, $event)"
            >
              <CountItem skin="apple" :size="40" :interactive="false" />
            </div>
          </div>
          <div class="plate-num" aria-hidden="true">{{ rightIds.length }}</div>
        </div>
      </div>
      <div
        class="pool"
        data-drop="pool"
        :class="{ hover: splitDropHover === 'pool' }"
      >
        <div
          v-for="it in pileItems('pool')"
          :key="it.id"
          class="drag-chip"
          role="button"
          tabindex="0"
          aria-label="苹果，拖进左右盘"
          :class="{ dragging: splitDragGhost?.id === it.id }"
          @pointerdown="onSplitPointerDown(it, $event)"
        >
          <CountItem skin="apple" :size="46" :interactive="false" />
        </div>
      </div>
      <div class="bonds">
        <span
          v-for="b in foundBonds"
          :key="b"
          class="bond"
          :class="{ flash: dupBondFlash === b }"
        >{{ splitN }}={{ b }}</span>
      </div>
    </div>

    <!-- family：点算式 → 语音 + 画面分合演示 -->
    <div v-else-if="mode === 'family'" class="family">
      <div v-if="!famDemo" class="pool center">
        <CountItem v-for="it in items" :key="it.id" skin="apple" :size="42" />
      </div>
      <div v-else class="fam-stage">
        <p class="fam-eq">{{ famEq }}</p>
        <div class="fam-row">
          <div class="fam-heap warm">
            <CountItem
              v-for="i in famHeapL"
              :key="'fl' + i"
              skin="apple"
              :size="36"
              :bouncing="famBounce"
            />
            <span class="fam-cnt">{{ famHeapL }}</span>
          </div>
          <span class="fam-op">{{ famOp }}</span>
          <div class="fam-heap cold">
            <CountItem
              v-for="i in famHeapR"
              :key="'fr' + i"
              skin="apple"
              :size="36"
              :bouncing="famBounce"
            />
            <span class="fam-cnt">{{ famHeapR }}</span>
          </div>
          <span class="fam-op">=</span>
          <div class="fam-answer" :class="{ bounce: famBounce }">{{ famResult }}</div>
        </div>
      </div>
      <div class="fam-btns" :class="{ twin: famNeed === 2 }">
        <button
          v-for="btn in famButtons"
          :key="btn.kind"
          class="hot fam"
          :class="{ on: famDemo === btn.kind, seen: famSeen.has(btn.kind) }"
          @click="playFamily(btn.kind)"
        >
          {{ btn.label }}
        </button>
      </div>
      <p class="hint">
        {{
          famSeen.size >= famNeed
            ? '这些算式都看过啦'
            : `点算式看合或拆（${famSeen.size}/${famNeed}）`
        }}
      </p>
      <button class="hot btn-primary done" @click="finishFamily">都看过啦</button>
    </div>

    <!-- compare -->
    <div v-else-if="playAs === 'compare'" class="compare">
      <div class="row">
        <div class="heap">
          <div class="heap-items">
            <CountItem v-for="i in big" :key="'b' + i" skin="apple" :size="36" />
          </div>
          <span class="heap-n">{{ big }}</span>
        </div>
        <div class="heap">
          <div class="heap-items">
            <CountItem v-for="i in small" :key="'s' + i" skin="carrot" :size="36" />
          </div>
          <span class="heap-n">{{ small }}</span>
        </div>
      </div>
    </div>

    <div
      v-if="takeDragGhost"
      class="ghost"
      :style="{ left: takeDragGhost.x + 'px', top: takeDragGhost.y + 'px' }"
    >
      {{ takeDragGhost.emoji }}
    </div>
    <div
      v-if="nbDragGhost"
      class="ghost num-ghost"
      :style="{ left: nbDragGhost.x + 'px', top: nbDragGhost.y + 'px' }"
    >
      {{ nbDragGhost.n }}
    </div>
    <div
      v-if="splitDragGhost"
      class="ghost"
      :style="{ left: splitDragGhost.x + 'px', top: splitDragGhost.y + 'px' }"
    >
      {{ splitDragGhost.emoji }}
    </div>

    <NumberButtons
      v-if="choices.length && playAs !== 'hello' && playAs !== 'family' && playAs !== 'split' && playAs !== 'takeN' && playAs !== 'neighbors'"
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

    <div v-if="toast" class="toast" role="status">{{ toast }}</div>
  </SenseChrome>
</template>

<style scoped>
.nl { margin: 8px 12px 0; }
.nb-board { padding: 0 0 8px; }
.nb-eq {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 8px;
  margin: 10px 12px 0;
  align-items: stretch;
}
.nb-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 108px;
  padding: 10px 6px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: var(--shadow);
  border: 3px dashed transparent;
  transition: box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.nb-card.prev,
.nb-card.next {
  background: linear-gradient(180deg, #e8f6ff 0%, #d7eefc 100%);
  border-color: rgba(120, 180, 220, 0.35);
}
.nb-card.mid {
  background: linear-gradient(180deg, #ffe8d6 0%, #ffd6b8 100%);
  min-width: 72px;
}
.nb-card.hover {
  border-color: #4a9fd8;
  box-shadow: 0 0 0 4px rgba(74, 159, 216, 0.28);
}
.nb-card.filled {
  border-style: solid;
  border-color: #7bc47f;
}
.nb-tag {
  font-size: 12px;
  font-weight: 800;
  color: var(--ink-soft);
  text-align: center;
  line-height: 1.2;
}
.nb-math {
  font-size: 22px;
  font-weight: 900;
  color: var(--ink);
  letter-spacing: -0.02em;
}
.nb-math.self {
  font-size: 28px;
  color: var(--accent-strong);
}
.nb-slot {
  font-size: 14px;
  font-weight: 800;
  color: var(--ink-soft);
  opacity: 0.7;
  padding: 12px 8px;
}
.nb-fill {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: var(--card);
  box-shadow: var(--shadow);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 900;
  color: var(--ink);
}
.nb-pool {
  margin: 14px 12px 0;
  min-height: 88px;
  padding: 10px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.72);
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  align-items: center;
  transition: box-shadow 0.15s ease, background 0.15s ease;
}
.nb-pool.hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 4px rgba(120, 180, 220, 0.35);
}
.nb-chip {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: var(--card);
  box-shadow: var(--shadow);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  font-weight: 900;
  color: var(--ink);
}
.num-ghost {
  font-weight: 900;
  font-size: 34px;
  color: var(--ink);
}
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
  transition: box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.basket.hover {
  border-color: #c47a3a;
  background: #f8e9d4;
  box-shadow: 0 0 0 4px rgba(212, 165, 116, 0.35);
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
  transition: box-shadow 0.15s ease, background 0.15s ease;
}
.pool.hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 4px rgba(120, 180, 220, 0.35);
}
.drag-chip {
  touch-action: none;
  cursor: grab;
  display: inline-flex;
}
.drag-chip:active { cursor: grabbing; }
.drag-chip.dragging {
  opacity: 0.3;
  pointer-events: none;
}
.ghost {
  position: fixed;
  z-index: 60;
  width: 52px;
  height: 52px;
  margin: -26px 0 0 -26px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 8px 20px rgba(92, 75, 81, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  pointer-events: none;
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
  flex-direction: row;
  align-items: stretch;
  gap: 6px;
  position: relative;
  border: 3px solid transparent;
  transition: box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.plate-items {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 4px;
}
.plate-num {
  flex: 0 0 28px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 2px;
  font-weight: 900;
  opacity: 0.45;
  font-size: 20px;
  line-height: 1;
  user-select: none;
}
.plate.cold { background: #d9eef7; }
.plate.hover {
  border-color: #f0a86a;
  box-shadow: 0 0 0 4px rgba(240, 168, 106, 0.28);
}
.plate.cold.hover {
  border-color: #4a9fd8;
  box-shadow: 0 0 0 4px rgba(74, 159, 216, 0.28);
}
.split .pool.hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 4px rgba(120, 180, 220, 0.35);
}
.bonds { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; justify-content: center; }
.bond { background: var(--lavender); border-radius: 14px; padding: 6px 10px; font-weight: 800; }
.bond.flash {
  animation: bond-flash 2.4s ease;
  background: #ffe0a8;
  box-shadow: 0 0 0 3px rgba(240, 168, 106, 0.45);
}
@keyframes bond-flash {
  0%, 100% { transform: scale(1); }
  20%, 55% { transform: scale(1.1); }
}
.family { padding: 12px; }
.fam-stage { margin: 4px 0 8px; }
.fam-eq {
  margin: 0 0 8px;
  text-align: center;
  font-size: 28px;
  font-weight: 900;
  color: var(--accent-strong);
  letter-spacing: 0.02em;
}
.fam-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
}
.fam-heap {
  min-width: 72px;
  min-height: 72px;
  padding: 8px 6px 6px;
  border-radius: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  justify-content: center;
  align-content: center;
  position: relative;
}
.fam-heap.warm { background: #ffe8d6; }
.fam-heap.cold { background: #d9eef7; }
.fam-cnt {
  position: absolute;
  right: 6px;
  top: 4px;
  font-size: 14px;
  font-weight: 900;
  opacity: 0.45;
}
.fam-op {
  font-size: 28px;
  font-weight: 900;
  color: var(--ink-soft);
  padding: 0 2px;
}
.fam-answer {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: var(--mint);
  box-shadow: var(--shadow);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 900;
}
.fam-answer.bounce { animation: glow 0.45s ease; }
.fam-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
.fam-btns.twin { grid-template-columns: 1fr 1fr; max-width: 100%; }
.fam {
  background: var(--card);
  box-shadow: var(--shadow);
  font-size: 24px;
  font-weight: 900;
  min-height: 64px;
}
.fam.on { background: var(--mint); }
.fam.seen:not(.on) { outline: 2px solid rgba(123, 196, 127, 0.55); }
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
  flex-direction: row;
  align-items: flex-start;
  gap: 6px;
  font-weight: 900;
  font-size: 22px;
}
.heap-items {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-content: flex-start;
  gap: 4px;
}
.heap-n {
  flex: 0 0 auto;
  line-height: 1;
  padding-top: 4px;
}
.nums { margin-top: 10px; }
.prog { text-align: center; font-weight: 800; color: var(--ink-soft); }
.toast {
  position: fixed;
  z-index: 70;
  left: 50%;
  top: 38%;
  transform: translate(-50%, -50%);
  max-width: min(320px, calc(100% - 48px));
  background: linear-gradient(180deg, #5c4b51 0%, #3f3438 100%);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 18px;
  padding: 14px 18px;
  font-size: 20px;
  font-weight: 900;
  text-align: center;
  color: #fff;
  box-shadow: 0 12px 28px rgba(60, 40, 50, 0.35);
  pointer-events: none;
  animation: toast-in 0.28s ease both;
}
@keyframes toast-in {
  from { opacity: 0; transform: translate(-50%, -40%) scale(0.92); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
@keyframes glow {
  40% { transform: scale(1.12); box-shadow: 0 0 0 12px rgba(255, 201, 77, 0.4); }
}
</style>
