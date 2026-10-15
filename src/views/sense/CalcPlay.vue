<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SenseChrome from '../../components/sense/SenseChrome.vue'
import CountItem from '../../components/sense/CountItem.vue'
import NumberButtons from '../../components/sense/NumberButtons.vue'
import NumberLine from '../../components/sense/NumberLine.vue'
import Celebrate from '../../components/sense/Celebrate.vue'
import PraiseBurst from '../../components/sense/PraiseBurst.vue'
import { CALC_MODES, type CalcModeId } from '../../data/sense/meta'
import { getSkin, randomSkin, type ItemSkin } from '../../data/sense/items'
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
import { useSfx } from '../../composables/useSfx'

const route = useRoute()
const router = useRouter()
const { completeCalc, isCalcUnlocked } = useSenseProgress()
const { speak } = useSpeech()
const sfx = useSfx()

const mode = computed(() => route.params.mode as CalcModeId)
const meta = computed(() => CALC_MODES.find((m) => m.id === mode.value))

type Phase = 'play' | 'merged' | 'ask' | 'done'
const phase = ref<Phase>('play')
const celebrate = ref(false)
const praise = ref(false)
const praiseText = ref('太棒了！')
const lockedPick = ref(false)
const prompt = ref('')
const hint = ref('')
const wrongStreak = ref(0)
const flashN = ref<number | null>(null)
const lineHighlight = ref<number | null>(null)
const lineNeighbors = ref<number[]>([])

const PRAISE_LINES = ['太棒了！', '答对啦！', '真厉害！', '你数得很准！', '做得好！']


const skin = ref<ItemSkin>('apple')
const target = ref(5)
const choices = ref<number[]>([])
const items = reactive<Array<{ id: number; x: number; y: number; lit: boolean; gone: boolean; bounce: boolean; pile?: 'L' | 'R' | 'C' | 'pool' }>>([])

/* match */
const matchLeft = ref(4)
const matchOpts = ref<Array<{ n: number; skin: ItemSkin; sameKind: boolean }>>([])

/* split */
const splitN = ref(6)
const leftIds = ref<number[]>([])
const rightIds = ref<number[]>([])
const foundBonds = ref<string[]>([])
/** 过关门槛（默认 3 种）；达到后可进下一关，但仍可继续找其余组合 */
const needBonds = ref(2)
/** 本关是否已记过关（completeCalc 只记一次） */
const splitPassed = ref(false)
const celebrateTitle = ref('太棒了！')
/** 已锁定的分法盘子（保留不动），每找到一种再开一组新盘子 */
const savedGroups = ref<Array<{ a: number; b: number; key: string }>>([])
let nextSplitItemId = 1

const splitAllCount = computed(() => bondsOf(splitN.value).length)
const canKeepSplitting = computed(() => foundBonds.value.length < splitAllCount.value)
const splitAgainLabel = computed(() =>
  mode.value === 'split' && canKeepSplitting.value ? '继续找其他分法' : '再玩一次',
)

/* merge */
const leftN = ref(3)
const rightN = ref(5)
const merged = ref(false)
/** 动画辅助：可把图在两行间拖来拖去，每加一个报数 */
const mergeAssist = ref(false)
const showSplitDemo = ref(false)
const splitDemoPairs = ref<Array<{ a: number; b: number }>>([])
const pendingSwap = ref<{ a: number; b: number } | null>(null)
/** 本关是否已安排过「换边」第二题（只安排一次，避免 1+2↔2+1 循环） */
const mergeSwapOffered = ref(false)
/** 本关是否已展示过「还能怎么分」（最多一次） */
const mergeDemoShown = ref(false)
/** 关掉「还能怎么分」后要继续的回调（避免和表扬弹层叠在一起） */
let afterSplitDemo: (() => void) | null = null
const qIndex = ref(0)
const qTotal = ref(5)

const mergeLiveL = computed(() => items.filter((it) => it.pile === 'L' && !it.gone).length)
const mergeLiveR = computed(() => items.filter((it) => it.pile === 'R' && !it.gone).length)
const mergeShowL = computed(() => (mergeAssist.value ? mergeLiveL.value : leftN.value))
const mergeShowR = computed(() => (mergeAssist.value ? mergeLiveR.value : rightN.value))

/* takeaway：体验 → 选题；选题可开动画辅助试算 */
const takeTotal = ref(7)
const takeK = ref(2)
const taken = ref(0)
const takePhase = ref<'practice' | 'quiz'>('practice')
const takeAssist = ref(false)
/** 本局是否已做过体验（只一次） */
const takePracticeDone = ref(false)
/** 盘子里还剩几个（拿走后实时减） */
const takeRemain = computed(() => Math.max(0, takeTotal.value - taken.value))
const takeCountBump = ref(false)
const isTakeawayMode = computed(
  () => mode.value === 'takeaway' || (mode.value === 'challenge' && challengeKind.value === 'takeaway'),
)
const showTakeCount = computed(
  () => isTakeawayMode.value && (takePhase.value === 'practice' || takeAssist.value),
)
const canTakeTap = computed(
  () =>
    isTakeawayMode.value &&
    (takePhase.value === 'practice' || (takePhase.value === 'quiz' && takeAssist.value)),
)

/* challenge */
const challengeKinds = ['count', 'merge', 'takeaway'] as const
const challengeKind = ref<(typeof challengeKinds)[number]>('count')
const challengeLeft = ref(5)

function resetBoard() {
  wrongStreak.value = 0
  flashN.value = null
  celebrate.value = false
  praise.value = false
  lockedPick.value = false
  prompt.value = ''
  hint.value = ''
  phase.value = 'play'
  merged.value = false
  mergeAssist.value = false
  showSplitDemo.value = false
  takePhase.value = 'practice'
  takeAssist.value = false
  taken.value = 0
  takeCountBump.value = false
  leftIds.value = []
  rightIds.value = []
  foundBonds.value = []
  savedGroups.value = []
  splitPassed.value = false
  celebrateTitle.value = '太棒了！'
  nextSplitItemId = 1
  lineHighlight.value = null
  lineNeighbors.value = []
  items.splice(0, items.length)
}

function refillSplitPool() {
  items.splice(0, items.length)
  leftIds.value = []
  rightIds.value = []
  for (let i = 0; i < splitN.value; i++) {
    items.push({
      id: nextSplitItemId++,
      x: 0,
      y: 0,
      lit: false,
      gone: false,
      bounce: false,
      pile: 'pool',
    })
  }
}

function withPraise(after: () => void) {
  lockedPick.value = true
  praiseText.value = pick(PRAISE_LINES)
  praise.value = true
  sfx.correct()
  speak(praiseText.value)
  prompt.value = praiseText.value
  window.setTimeout(() => {
    praise.value = false
    lockedPick.value = false
    after()
  }, 1500)
}

function speakNum(n: number) {
  speak(String(n))
}

function makeScattered(n: number, pile?: 'L' | 'R' | 'C' | 'pool') {
  const pos = scatterPositions(n)
  return pos.map((p, i) => ({
    id: i + 1 + Math.random(),
    x: p.x,
    y: p.y,
    lit: false,
    gone: false,
    bounce: false,
    pile,
  }))
}

function unlockChoices(correct: number) {
  choices.value = numberChoices(correct, 4, wrongStreak.value >= 2)
}

function startCount(n?: number) {
  resetBoard()
  skin.value = randomSkin().id
  target.value = n ?? randInt(1, 10)
  items.push(...makeScattered(target.value))
  prompt.value = '一个一个点亮，数一数有几个？'
  speak(prompt.value)
  choices.value = []
}

const matchFlash = ref<number | null>(null)

function nearCounts(target: number, need: number): number[] {
  /** 优先 ±1、±2，贴近目标造成干扰 */
  const candidates = [target - 1, target + 1, target - 2, target + 2, target - 3, target + 3]
    .filter((n) => n >= 1 && n <= 10 && n !== target)
  const picked: number[] = []
  for (const n of candidates) {
    if (picked.length >= need) break
    if (!picked.includes(n)) picked.push(n)
  }
  // 兜底：仍不够再从邻近随机补
  while (picked.length < need) {
    const n = randInt(Math.max(1, target - 2), Math.min(10, target + 2))
    if (n !== target && !picked.includes(n)) picked.push(n)
  }
  return picked
}

function startMatch() {
  resetBoard()
  matchFlash.value = null
  skin.value = randomSkin().id
  // 3～9：两边都留得出 ±1/±2 干扰
  matchLeft.value = randInt(3, 9)
  const [wrongA, wrongB] = nearCounts(matchLeft.value, 2)
  matchOpts.value = shuffle([
    { n: matchLeft.value, skin: skin.value, sameKind: true },
    { n: wrongA, skin: skin.value, sameKind: true },
    { n: wrongB, skin: skin.value, sameKind: true },
  ])
  prompt.value = '哪一组和示例一样多？'
  hint.value = '看上面橙色示例，点下面选一组'
  speak('看橙色示例，下面哪一组一样多？')
}

function startSplit(n?: number) {
  resetBoard()
  skin.value = randomSkin().id
  splitN.value = n ?? randInt(4, 10)
  needBonds.value = Math.min(3, bondsOf(splitN.value).length)
  refillSplitPool()
  prompt.value = `${splitN.value} 可以怎么分成两堆？`
  hint.value = '按住拖到左右盘子里'
  speak(`${splitN.value} 可以怎么分成两堆？按住拖到左右盘子里`)
}

function startMerge(force?: { a: number; b: number }) {
  // 先取出换边题，再 reset，避免被清掉或和旧 prompt 搅在一起
  const swap = force ? null : pendingSwap.value
  if (!force) pendingSwap.value = null

  resetBoard()
  skin.value = randomSkin().id
  if (force) {
    leftN.value = force.a
    rightN.value = force.b
    prompt.value = `${force.a} 加 ${force.b}，等于几？`
  } else if (swap) {
    leftN.value = swap.a
    rightN.value = swap.b
    prompt.value = '只是换了边，还是这些哦'
  } else {
    // 从 3～10 的组成里抽一组有序拆法，避免总偏大+小（如老是 7+1）
    const total = randInt(3, 10)
    const pair = pick(bondsOf(total))
    leftN.value = pair.a
    rightN.value = pair.b
    prompt.value = `${leftN.value} 加 ${rightN.value}，等于几？`
  }
  target.value = leftN.value + rightN.value
  const leftPos = scatterPositions(leftN.value, 100, 80)
  const rightPos = scatterPositions(rightN.value, 100, 80)
  leftPos.forEach((p, i) =>
    items.push({ id: i + 1, x: p.x, y: p.y, lit: false, gone: false, bounce: true, pile: 'L' }),
  )
  rightPos.forEach((p, i) =>
    items.push({
      id: 100 + i + 1,
      x: p.x,
      y: p.y,
      lit: false,
      gone: false,
      bounce: true,
      pile: 'R',
    }),
  )
  // 一开始就用上下两行（一行一块），避免先左右并排再切换的闪动
  merged.value = true
  phase.value = 'ask'
  unlockChoices(target.value)
  speak(
    prompt.value.startsWith('只是')
      ? `${prompt.value}。${leftN.value} 加 ${rightN.value}，等于几？`
      : prompt.value,
  )
}

function setupTakeawayBoard() {
  skin.value = randomSkin().id
  takeTotal.value = randInt(3, 10)
  takeK.value = randInt(1, takeTotal.value - 1)
  target.value = takeTotal.value - takeK.value
  taken.value = 0
  takeAssist.value = false
  takeCountBump.value = false
  items.splice(0, items.length)
  items.push(...makeScattered(takeTotal.value).map((it, i) => ({ ...it, id: i + 1 })))
}

/** 体验关：动手拿走，圆盘实时报数，拿够后进入选题 */
function startTakeawayPractice() {
  resetBoard()
  setupTakeawayBoard()
  takePhase.value = 'practice'
  choices.value = []
  prompt.value = `先试一试：盘子里有 ${takeTotal.value} 个，请拿走 ${takeK.value} 个`
  hint.value = '点一下拿走，看圆盘数字怎么变'
  speak(`先试一试。盘子里有 ${takeTotal.value} 个，请拿走 ${takeK.value} 个`)
}

/** 出题关：随机 N−K=?，默认不显示剩余；可开动画辅助 */
function startTakeawayQuiz() {
  resetBoard()
  setupTakeawayBoard()
  takePhase.value = 'quiz'
  lockedPick.value = false
  unlockChoices(target.value)
  prompt.value = `${takeTotal.value} 减 ${takeK.value}，等于几？`
  hint.value = '不会可以点「动画辅助」试试'
  speak(`${takeTotal.value} 减 ${takeK.value}，等于几？`)
}

function startTakeaway() {
  if (takePracticeDone.value) startTakeawayQuiz()
  else startTakeawayPractice()
}

function restoreTakePlate() {
  taken.value = 0
  takeCountBump.value = false
  items.forEach((it) => {
    it.gone = false
    it.bounce = false
  })
}

function toggleTakeAssist() {
  if (takePhase.value !== 'quiz') return
  lockedPick.value = false
  takeAssist.value = !takeAssist.value
  restoreTakePlate()
  if (takeAssist.value) {
    hint.value = '点图拿走试试，拿够后再选出答案'
    speak('打开辅助啦。点图拿走试试，再选出答案')
  } else {
    hint.value = '不会可以点「动画辅助」试试'
    speak('辅助关掉啦')
  }
}

function startChallengeRound() {
  challengeKind.value = pick([...challengeKinds])
  if (challengeKind.value === 'count') startCount()
  else if (challengeKind.value === 'merge') startMerge()
  else startTakeawayQuiz()
}

function startMode() {
  if (!isCalcUnlocked(mode.value)) {
    router.replace('/sense/calc')
    return
  }
  // 重新进关 / 再玩一次：不要沿用上一题的「换边」预约
  pendingSwap.value = null
  mergeSwapOffered.value = false
  mergeDemoShown.value = false
  afterSplitDemo = null
  showSplitDemo.value = false
  takePracticeDone.value = false
  qIndex.value = 0
  qTotal.value = mode.value === 'challenge' ? 5 : mode.value === 'split' ? needBonds.value : mode.value === 'merge' ? 2 : 4
  if (mode.value === 'challenge') {
    challengeLeft.value = 5
    startChallengeRound()
  } else if (mode.value === 'count') startCount()
  else if (mode.value === 'match') startMatch()
  else if (mode.value === 'split') startSplit()
  else if (mode.value === 'merge') startMerge()
  else if (mode.value === 'takeaway') startTakeaway()
}

onMounted(startMode)
watch(mode, startMode)

function onTapItem(it: (typeof items)[0]) {
  if (mode.value === 'count' || (mode.value === 'challenge' && challengeKind.value === 'count')) {
    if (it.lit) return
    it.lit = true
    it.bounce = true
    const litCount = items.filter((x) => x.lit).length
    speakNum(litCount)
    if (litCount >= target.value) {
      unlockChoices(target.value)
      prompt.value = '有几个？选出数字'
      speak(prompt.value)
    }
    return
  }

  if (mode.value === 'takeaway' || (mode.value === 'challenge' && challengeKind.value === 'takeaway')) {
    if (!canTakeTap.value || it.gone || lockedPick.value) return
    // 先弹一下再飞走
    it.bounce = true
    sfx.gentle()
    window.setTimeout(() => {
      it.gone = true
    }, 90)
    taken.value++
    takeCountBump.value = true
    window.setTimeout(() => {
      takeCountBump.value = false
    }, 320)
    const remain = takeRemain.value
    speakNum(remain)
    if (taken.value < takeK.value) return

    if (takePhase.value === 'practice') {
      takePracticeDone.value = true
      prompt.value = `太棒了！还剩 ${remain} 个`
      withPraise(() => startTakeawayQuiz())
      return
    }
    // 出题关 + 辅助：拿够后仍要点数字
    hint.value = '现在选出答案吧'
    speak(`还剩 ${remain} 个，现在选出答案吧`)
    return
  }

}

type SplitPile = 'L' | 'R' | 'pool'
const dropHover = ref<SplitPile | null>(null)
const dragGhost = ref<{ id: number; x: number; y: number; emoji: string } | null>(null)
let splitDragId: number | null = null
/** split | merge-assist */
let dragKind: 'split' | 'merge' | null = null

function moveItemToPile(id: number, pile: SplitPile) {
  const it = items.find((x) => x.id === id)
  if (!it || it.pile === pile) {
    tryCommitSplit()
    return
  }
  leftIds.value = leftIds.value.filter((x) => x !== id)
  rightIds.value = rightIds.value.filter((x) => x !== id)
  it.pile = pile
  if (pile === 'L') leftIds.value.push(id)
  if (pile === 'R') rightIds.value.push(id)
  it.bounce = true
  tryCommitSplit()
}

function restoreMergePiles() {
  items.forEach((it) => {
    it.pile = it.id < 100 ? 'L' : 'R'
    it.bounce = false
  })
}

function toggleMergeAssist() {
  mergeAssist.value = !mergeAssist.value
  if (mergeAssist.value) {
    hint.value = '按住拖到另一行，每加一个会报最新个数'
    speak('打开辅助啦。把图拖到另一行，每加一个会报数')
  } else {
    restoreMergePiles()
    hint.value = ''
    prompt.value = `${leftN.value} 加 ${rightN.value}，等于几？`
    speak('辅助关掉啦')
  }
}

function moveMergeAssistItem(id: number, pile: 'L' | 'R') {
  const it = items.find((x) => x.id === id)
  if (!it || it.pile === pile) return
  it.pile = pile
  it.bounce = true
  const a = mergeLiveL.value
  const b = mergeLiveR.value
  const dest = pile === 'L' ? a : b
  sfx.gentle()
  speakNum(dest)
  if (a === 0) {
    prompt.value = `都合到下面啦，一共 ${b}`
    hint.value = `从 ${leftN.value} 加 ${rightN.value} 合过来的`
  } else if (b === 0) {
    prompt.value = `都合到上面啦，一共 ${a}`
    hint.value = `从 ${leftN.value} 加 ${rightN.value} 合过来的`
  } else {
    prompt.value = `现在是 ${a} 加 ${b}`
    hint.value = `合起来还是 ${a + b}，等于几？`
  }
}

function pileFromPoint(x: number, y: number): SplitPile | null {
  const el = document.elementFromPoint(x, y) as HTMLElement | null
  if (!el) return null
  const zone = el.closest('[data-drop]') as HTMLElement | null
  const pile = zone?.dataset.drop
  if (pile === 'L' || pile === 'R' || pile === 'pool') return pile
  return null
}

function onSplitPointerDown(it: (typeof items)[0], e: PointerEvent) {
  if (mode.value !== 'split' || lockedPick.value) return
  e.preventDefault()
  const el = e.currentTarget as HTMLElement
  el.setPointerCapture(e.pointerId)
  dragKind = 'split'
  splitDragId = it.id
  const skinDef = getSkin(skin.value)
  dragGhost.value = {
    id: it.id,
    x: e.clientX,
    y: e.clientY,
    emoji: skinDef.emoji,
  }
  dropHover.value = null
}

function onMergeAssistPointerDown(it: (typeof items)[0], e: PointerEvent) {
  if (!mergeAssist.value || !merged.value || lockedPick.value) return
  e.preventDefault()
  const el = e.currentTarget as HTMLElement
  el.setPointerCapture(e.pointerId)
  dragKind = 'merge'
  splitDragId = it.id
  const skinDef = getSkin(skin.value)
  dragGhost.value = {
    id: it.id,
    x: e.clientX,
    y: e.clientY,
    emoji: skinDef.emoji,
  }
  dropHover.value = null
}

function onSplitPointerMove(e: PointerEvent) {
  if (splitDragId == null || !dragGhost.value) return
  dragGhost.value = { ...dragGhost.value, x: e.clientX, y: e.clientY }
  dropHover.value = pileFromPoint(e.clientX, e.clientY)
}

function onSplitPointerUp(e: PointerEvent) {
  if (splitDragId == null) return
  const pile = pileFromPoint(e.clientX, e.clientY)
  const id = splitDragId
  const kind = dragKind
  splitDragId = null
  dragKind = null
  dragGhost.value = null
  dropHover.value = null
  if (!pile) return
  if (kind === 'merge') {
    if (pile === 'L' || pile === 'R') moveMergeAssistItem(id, pile)
    return
  }
  moveItemToPile(id, pile)
}

function resetActiveSplitPlates() {
  items.forEach((it) => {
    it.pile = 'pool'
    it.bounce = false
  })
  leftIds.value = []
  rightIds.value = []
}

function tryCommitSplit() {
  const a = leftIds.value.length
  const b = rightIds.value.length
  if (a + b !== splitN.value || a < 1 || b < 1) return
  const key = bondKey(a, b)
  if (foundBonds.value.includes(key)) {
    sfx.gentle()
    prompt.value = '这种已经分过啦'
    hint.value = '新盘子已清空，换一种分法试试'
    speak('这个已经有过啦，换一种分法试试')
    window.setTimeout(() => {
      resetActiveSplitPlates()
    }, 450)
    return
  }
  foundBonds.value.push(key)
  savedGroups.value.push({ a, b, key })
  sfx.correct()
  speak(`${splitN.value} 等于 ${a} 加 ${b}`)

  const found = foundBonds.value.length
  const all = splitAllCount.value
  const justPassed = found >= needBonds.value && !splitPassed.value
  const allDone = found >= all

  if (justPassed) {
    splitPassed.value = true
    completeCalc('split')
    celebrateTitle.value = allDone
      ? '全部分完啦！'
      : `找到 ${needBonds.value} 种啦！可以进下一关`
    withPraise(() => {
      sfx.fanfare()
      celebrate.value = true
      if (!allDone) {
        // 过关弹层后面先备好新盘子，点「继续找」即可拖
        refillSplitPool()
        hint.value = `已找到 ${found}/${all}，也可继续找`
      }
    })
    return
  }

  if (allDone) {
    celebrateTitle.value = '全部分完啦！'
    withPraise(() => {
      sfx.fanfare()
      celebrate.value = true
    })
    return
  }

  // 未达门槛，或已过关后继续找：只刷新新盘子
  prompt.value = splitPassed.value ? '很好！再找一种' : '很好！再分一种'
  hint.value = splitPassed.value
    ? `已找到 ${found}/${all}，也可以进下一关`
    : `已找到 ${found}/${needBonds.value}，新盘子继续拖`
  speak(
    splitPassed.value
      ? `很好！还可以再找，已找到 ${found} 种`
      : `很好！再给新盘子分一种，已找到 ${found} 种`,
  )
  window.setTimeout(() => {
    refillSplitPool()
  }, 550)
}

/** 过关后关掉弹层，继续在本关找其他组合 */
function continueSplitPlay() {
  celebrate.value = false
  lockedPick.value = false
  if (!canKeepSplitting.value) {
    startSplit()
    return
  }
  if (poolItems('pool').length === 0 && leftIds.value.length === 0 && rightIds.value.length === 0) {
    refillSplitPool()
  }
  prompt.value = `${splitN.value} 还可以怎么分？`
  hint.value = `已找到 ${foundBonds.value.length}/${splitAllCount.value}，继续拖到新盘子`
  speak('继续找其他分法吧')
}

function onPickNumber(n: number) {
  const correct =
    mode.value === 'match'
      ? matchLeft.value
      : target.value

  if (lockedPick.value) return

  if (mode.value === 'match') {
    if (n !== correct) {
      wrongStreak.value++
      sfx.gentle()
      speak('再数一数，哪一组一样多？')
      prompt.value = '再数一数，哪一组一样多？'
      return
    }
    matchFlash.value = n
    winRound()
    return
  }

  if (n !== correct) {
    wrongStreak.value++
    sfx.gentle()
    speak('再数一遍试试')
    unlockChoices(correct)
    return
  }

  flashN.value = n
  // neighbor tip for ±1
  if (
    (mode.value === 'merge' || (mode.value === 'challenge' && challengeKind.value === 'merge')) &&
    (leftN.value === 1 || rightN.value === 1)
  ) {
    const base = leftN.value === 1 ? rightN.value : leftN.value
    lineHighlight.value = base
    lineNeighbors.value = [target.value]
    speak(`就是 ${base} 的后一个哦`)
  }
  if (
    (mode.value === 'takeaway' || (mode.value === 'challenge' && challengeKind.value === 'takeaway')) &&
    takeK.value === 1
  ) {
    lineHighlight.value = takeTotal.value
    lineNeighbors.value = [target.value]
    speak(`就是 ${takeTotal.value} 的前一个哦`)
  }

  // 合起来：整关只安排一次换边，答完第二题就结束（不再 1+2↔2+1 来回）
  if (
    mode.value === 'merge' &&
    !mergeSwapOffered.value &&
    !pendingSwap.value &&
    leftN.value !== rightN.value
  ) {
    mergeSwapOffered.value = true
    pendingSwap.value = { a: rightN.value, b: leftN.value }
  }

  winRound()
}

function onPickMatch(optN: number) {
  if (lockedPick.value) return
  onPickNumber(optN)
}

function winRound() {
  qIndex.value++

  const finishMode = (id: CalcModeId, stars = 2) => {
    withPraise(() => {
      completeCalc(id, stars)
      sfx.fanfare()
      celebrate.value = true
    })
  }

  if (mode.value === 'challenge') {
    challengeLeft.value--
    if (challengeLeft.value <= 0) {
      finishMode('challenge', 3)
      return
    }
    withPraise(() => startChallengeRound())
    return
  }

  if (mode.value === 'merge') {
    if (pendingSwap.value) {
      const sum = target.value
      const extraBonds = bondsOf(sum).length
      withPraise(() => {
        // 拆法很少（如 3 只有 1+2 / 2+1）时直接换边，不再弹「还能怎么分」
        // 拆法较多时整关只展示一次 demo
        if (!mergeDemoShown.value && extraBonds > 2) {
          mergeDemoShown.value = true
          splitDemoPairs.value = shuffle(bondsOf(sum)).slice(0, 3)
          afterSplitDemo = () => startMerge()
          showSplitDemo.value = true
        } else {
          startMerge()
        }
      })
      return
    }
    finishMode('merge')
    return
  }

  if (mode.value === 'match') {
    if (qIndex.value < 3) {
      withPraise(() => startMatch())
      return
    }
    finishMode('match')
    return
  }

  if (mode.value === 'count') {
    if (qIndex.value < 4) {
      withPraise(() => startCount())
      return
    }
    finishMode('count')
    return
  }

  if (mode.value === 'takeaway') {
    if (qIndex.value < 4) {
      // 体验已做过：后续只出选题
      withPraise(() => startTakeawayQuiz())
      return
    }
    finishMode('takeaway')
  }
}

function skipSplitDemo() {
  showSplitDemo.value = false
  const next = afterSplitDemo
  afterSplitDemo = null
  next?.()
}

function nextMode() {
  celebrate.value = false
  const order = CALC_MODES.map((m) => m.id)
  const i = order.indexOf(mode.value)
  if (i >= 0 && i < order.length - 1) router.push(`/sense/calc/${order[i + 1]}`)
  else router.push('/sense/calc')
}

function poolItems(pile: 'L' | 'R' | 'C' | 'pool') {
  return items.filter((it) => (it.pile || 'pool') === pile && !it.gone)
}
</script>

<template>
  <SenseChrome :title="meta?.name || '算一算'" :prompt="prompt" :hint="hint" back-to="/sense/calc">
    <NumberLine
      v-if="lineHighlight"
      class="nl"
      :highlight="lineHighlight"
      :neighbors="lineNeighbors"
    />

    <!-- count / takeaway field -->
    <div
      v-if="mode === 'count' || mode === 'takeaway' || (mode === 'challenge' && (challengeKind === 'count' || challengeKind === 'takeaway'))"
      class="field"
      :class="{
        'take-field': isTakeawayMode,
        'take-quiz': isTakeawayMode && takePhase === 'quiz',
        'take-assist-on': isTakeawayMode && takeAssist,
      }"
    >
      <div
        v-if="showTakeCount"
        class="plate-count"
        :class="{ bump: takeCountBump }"
        :aria-label="`盘子里还剩 ${takeRemain} 个`"
      >
        {{ takeRemain }}
      </div>
      <div
        class="take-items"
        :class="{ locked: isTakeawayMode && takePhase === 'quiz' && !takeAssist }"
      >
        <div
          v-for="it in items"
          :key="it.id"
          class="abs"
          :class="{ 'take-fly': isTakeawayMode && it.gone }"
          :style="{ left: it.x + '%', top: it.y + '%' }"
        >
          <CountItem
            :skin="skin"
            :lit="it.lit"
            :gone="it.gone && !isTakeawayMode"
            :bouncing="it.bounce"
            :interactive="!isTakeawayMode || canTakeTap"
            @click="onTapItem(it)"
          />
        </div>
      </div>
    </div>
    <div v-if="isTakeawayMode && takePhase === 'quiz'" class="take-assist-row">
      <button
        type="button"
        class="merge-assist-btn"
        :class="{ on: takeAssist }"
        @click.stop="toggleTakeAssist"
      >
        {{ takeAssist ? '关闭辅助' : '动画辅助' }}
      </button>
      <span v-if="takeAssist" class="merge-assist-tip">点图拿走，拿够后再选答案</span>
    </div>

    <!-- match -->
    <div v-else-if="mode === 'match'" class="match">
      <div class="side sample" aria-label="示例组，不用点">
        <span class="badge">示例</span>
        <p class="cap">看这一组有几个</p>
        <div class="group">
          <CountItem v-for="i in matchLeft" :key="'L' + i" :skin="skin" :size="44" :interactive="false" />
        </div>
      </div>
      <p class="choose-hint">👇 在下面选出一样多的一组</p>
      <div class="opts">
        <button
          v-for="(o, idx) in matchOpts"
          :key="idx"
          type="button"
          class="opt"
          :class="{ flash: matchFlash === o.n, correct: matchFlash === o.n && praise }"
          :disabled="lockedPick"
          :aria-label="`选项${idx + 1}`"
          @click="onPickMatch(o.n)"
        >
          <div class="group">
            <CountItem
              v-for="i in o.n"
              :key="idx + '-' + i"
              :skin="o.skin"
              :size="36"
              :interactive="false"
            />
          </div>
        </button>
      </div>
    </div>

    <!-- split：拖拽分堆；成功一种后锁定该组盘子，再开一组新盘子 -->
    <div v-else-if="mode === 'split'" class="split">
      <div
        v-for="(g, gi) in savedGroups"
        :key="g.key"
        class="plates saved"
      >
        <div class="plate locked">
          <span class="done-tag">✓ 第{{ gi + 1 }}种 {{ splitN }}={{ g.key }}</span>
          <span class="pn">{{ g.a }}</span>
          <CountItem v-for="i in g.a" :key="'sa' + g.key + i" :skin="skin" :size="36" :interactive="false" />
        </div>
        <div class="plate cold locked">
          <span class="pn">{{ g.b }}</span>
          <CountItem v-for="i in g.b" :key="'sb' + g.key + i" :skin="skin" :size="36" :interactive="false" />
        </div>
      </div>

      <div v-if="canKeepSplitting" class="plates active-row">
        <div
          class="plate"
          data-drop="L"
          :class="{ hover: dropHover === 'L' }"
        >
          <span class="pn">{{ leftIds.length }}</span>
          <span class="drop-tip">新·左堆</span>
          <div
            v-for="it in poolItems('L')"
            :key="it.id"
            class="drag-chip"
            :class="{ dragging: dragGhost?.id === it.id }"
            @pointerdown="onSplitPointerDown(it, $event)"
            @pointermove="onSplitPointerMove"
            @pointerup="onSplitPointerUp"
            @pointercancel="onSplitPointerUp"
          >
            <CountItem :skin="skin" :size="40" :interactive="false" :bouncing="it.bounce" />
          </div>
        </div>
        <div
          class="plate cold"
          data-drop="R"
          :class="{ hover: dropHover === 'R' }"
        >
          <span class="pn">{{ rightIds.length }}</span>
          <span class="drop-tip">新·右堆</span>
          <div
            v-for="it in poolItems('R')"
            :key="it.id"
            class="drag-chip"
            :class="{ dragging: dragGhost?.id === it.id }"
            @pointerdown="onSplitPointerDown(it, $event)"
            @pointermove="onSplitPointerMove"
            @pointerup="onSplitPointerUp"
            @pointercancel="onSplitPointerUp"
          >
            <CountItem :skin="skin" :size="40" :interactive="false" :bouncing="it.bounce" />
          </div>
        </div>
      </div>
      <div
        v-if="canKeepSplitting"
        class="pool"
        data-drop="pool"
        :class="{ hover: dropHover === 'pool' }"
      >
        <p class="pool-tip">从这里拖到上面「新」盘子（上面已分好的不用动）</p>
        <div
          v-for="it in poolItems('pool')"
          :key="it.id"
          class="drag-chip"
          :class="{ dragging: dragGhost?.id === it.id }"
          @pointerdown="onSplitPointerDown(it, $event)"
          @pointermove="onSplitPointerMove"
          @pointerup="onSplitPointerUp"
          @pointercancel="onSplitPointerUp"
        >
          <CountItem :skin="skin" :size="48" :interactive="false" :bouncing="it.bounce" />
        </div>
      </div>
      <div v-if="splitPassed && canKeepSplitting && !celebrate" class="split-pass-bar">
        <button type="button" class="hot btn-primary" @click="nextMode">下一关</button>
      </div>
    </div>

    <!-- merge：必须紧跟 split 的 v-else-if，勿插 dragGhost 打断链 -->
    <div v-else-if="mode === 'merge' || (mode === 'challenge' && challengeKind === 'merge')" class="merge">
      <div class="plate center merge-sum" :class="{ assist: mergeAssist }">
        <div
          v-if="!mergeAssist || mergeLiveL > 0"
          class="merge-line warm"
          data-drop="L"
          :class="{ hover: mergeAssist && dropHover === 'L' }"
        >
          <div class="merge-icons">
            <div
              v-for="it in poolItems('L')"
              :key="it.id"
              class="drag-chip"
              :class="{ dragging: dragGhost?.id === it.id, assist: mergeAssist }"
              @pointerdown="onMergeAssistPointerDown(it, $event)"
              @pointermove="onSplitPointerMove"
              @pointerup="onSplitPointerUp"
              @pointercancel="onSplitPointerUp"
            >
              <CountItem :skin="skin" :size="40" :interactive="false" :bouncing="it.bounce" />
            </div>
          </div>
          <span class="row-tag">{{ mergeShowL }}</span>
        </div>
        <div
          v-if="!mergeAssist || (mergeLiveL > 0 && mergeLiveR > 0)"
          class="merge-op"
          aria-hidden="true"
        >
          +
        </div>
        <div
          v-if="!mergeAssist || mergeLiveR > 0"
          class="merge-line cool"
          data-drop="R"
          :class="{ hover: mergeAssist && dropHover === 'R' }"
        >
          <div class="merge-icons">
            <div
              v-for="it in poolItems('R')"
              :key="it.id"
              class="drag-chip"
              :class="{ dragging: dragGhost?.id === it.id, assist: mergeAssist }"
              @pointerdown="onMergeAssistPointerDown(it, $event)"
              @pointermove="onSplitPointerMove"
              @pointerup="onSplitPointerUp"
              @pointercancel="onSplitPointerUp"
            >
              <CountItem :skin="skin" :size="40" :interactive="false" :bouncing="it.bounce" />
            </div>
          </div>
          <span class="row-tag">{{ mergeShowR }}</span>
        </div>
        <div class="eq-row">
          <p class="eq">= ?</p>
          <button
            type="button"
            class="merge-assist-btn"
            :class="{ on: mergeAssist }"
            @click.stop="toggleMergeAssist"
          >
            {{ mergeAssist ? '关闭辅助' : '动画辅助' }}
          </button>
        </div>
        <p v-if="mergeAssist" class="merge-assist-tip">按住图拖到另一行</p>
      </div>
    </div>

    <div
      v-if="dragGhost"
      class="ghost"
      :style="{ left: dragGhost.x + 'px', top: dragGhost.y + 'px' }"
    >
      {{ dragGhost.emoji }}
    </div>

    <NumberButtons
      v-if="choices.length && mode !== 'match' && mode !== 'split' && !(isTakeawayMode && takePhase === 'practice')"
      class="nums"
      :options="choices"
      :flash-correct="flashN"
      @pick="onPickNumber"
    />

    <p v-if="mode === 'challenge'" class="prog">还剩 {{ challengeLeft }} 题</p>

    <div v-if="showSplitDemo" class="demo-mask">
      <div class="demo-card">
        <p class="dt">{{ target }} 还能怎么分？</p>
        <div class="demo-list">
          <div v-for="p in splitDemoPairs" :key="p.a + '-' + p.b" class="demo-row">
            <span>{{ p.a }} + {{ p.b }}</span>
            <div class="mini">
              <i v-for="i in p.a" :key="'a' + i" class="dot warm" />
              <i v-for="i in p.b" :key="'b' + i" class="dot cool" />
            </div>
          </div>
        </div>
        <button class="hot btn-primary" @click="skipSplitDemo">知道啦</button>
      </div>
    </div>

    <PraiseBurst :show="praise" :text="praiseText" />

    <Celebrate
      :show="celebrate"
      :title="celebrateTitle"
      :sticker="mode === 'challenge'"
      :again-label="splitAgainLabel"
      @next="nextMode"
      @again="mode === 'split' && splitPassed && canKeepSplitting ? continueSplitPlay() : startMode()"
      @home="router.push('/sense/calc')"
    />
  </SenseChrome>
</template>

<style scoped>
.nl { margin: 8px 12px 0; }
.field {
  position: relative;
  height: 280px;
  margin: 12px 12px 0;
  background: rgba(255, 255, 255, 0.55);
  border-radius: 24px;
}
.field.take-field {
  background: rgba(255, 255, 255, 0.62);
  border: 2px dashed rgba(95, 169, 198, 0.35);
}
.field.take-quiz:not(.take-assist-on) {
  border-style: solid;
  border-color: rgba(95, 169, 198, 0.28);
}
.plate-count {
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 3;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 900;
  color: #c45c12;
  background: linear-gradient(180deg, #ffe9c2 0%, #ffd089 100%);
  border: 3px solid #f0a86a;
  box-shadow: var(--shadow);
  pointer-events: none;
  line-height: 1;
}
.plate-count.bump {
  animation: countBump 0.32s ease;
}
.take-items {
  position: absolute;
  inset: 0;
}
.take-items.locked {
  pointer-events: none;
}
.take-assist-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin: 8px 16px 0;
  position: relative;
  z-index: 5;
}
.take-assist-row .merge-assist-btn {
  pointer-events: auto;
  cursor: pointer;
}
@keyframes countBump {
  0% { transform: scale(1); }
  40% { transform: scale(1.16); }
  100% { transform: scale(1); }
}
.abs {
  position: absolute;
  transform: translate(-50%, -50%);
}
.abs.take-fly {
  z-index: 4;
  animation: takeFly 0.48s ease forwards;
  pointer-events: none;
}
@keyframes takeFly {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(0deg); }
  55% { opacity: 0.85; transform: translate(-50%, -110%) scale(1.15) rotate(-12deg); }
  100% { opacity: 0; transform: translate(-30%, -160%) scale(0.35) rotate(18deg); }
}
.match { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.side, .opt {
  background: var(--card);
  border-radius: 20px;
  padding: 10px;
  box-shadow: var(--shadow);
  transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;
}
.sample {
  position: relative;
  padding: 16px 12px 14px;
  background: linear-gradient(180deg, #fff6e8 0%, #ffe8d2 100%);
  border: 3px solid #f0a86a;
  box-shadow: 0 0 0 4px rgba(240, 168, 106, 0.25), var(--shadow);
  pointer-events: none;
}
.badge {
  position: absolute;
  top: -12px;
  left: 14px;
  background: #f07840;
  color: #fff;
  font-size: 15px;
  font-weight: 900;
  padding: 4px 12px;
  border-radius: 999px;
  letter-spacing: 1px;
}
.choose-hint {
  margin: 2px 4px 0;
  text-align: center;
  font-size: 17px;
  font-weight: 800;
  color: var(--accent-strong);
}
.opt {
  position: relative;
  border: 2px dashed #cfd8e3;
  background: #fff;
}
.opt:active {
  transform: scale(0.97);
  box-shadow: 0 2px 0 rgba(92, 75, 81, 0.12);
}
.opt.flash {
  background: var(--mint);
  border-style: solid;
  border-color: #7ec9ae;
  box-shadow: 0 0 0 4px rgba(184, 224, 210, 0.8), var(--shadow);
}
.opt.correct {
  animation: correctPulse 0.6s ease;
  background: #c8f0df;
  border-style: solid;
  border-color: var(--gold);
  box-shadow: 0 0 0 5px rgba(255, 201, 77, 0.55), var(--shadow);
}
.opt:disabled {
  opacity: 1;
}
@keyframes correctPulse {
  0% { transform: scale(1); }
  40% { transform: scale(1.04); }
  100% { transform: scale(1); }
}
.cap { margin: 0 0 8px; font-weight: 800; font-size: 16px; color: #b45a2a; text-align: center; }
.group { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; }
.opts { display: flex; flex-direction: column; gap: 8px; }
.split, .merge { padding: 12px; }
.plates { display: flex; gap: 10px; }
.merge-row { align-items: center; }
.plate {
  flex: 1;
  min-height: 120px;
  background: #ffe8d6;
  border-radius: 22px;
  padding: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-content: flex-start;
  position: relative;
  border: 2px solid transparent;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}
.plate.cold { background: #d9eef7; }
.plate.hover, .pool.hover {
  border-color: var(--accent-strong);
  box-shadow: 0 0 0 4px rgba(95, 169, 198, 0.28);
}
.plates.saved {
  margin-bottom: 8px;
  opacity: 0.95;
}
.plate.locked {
  pointer-events: none;
  border: 2px solid #8fd4b8;
  background: #e8f8f0;
  padding-top: 22px;
}
.plate.cold.locked {
  background: #e4f3fa;
  border-color: #7eb8d4;
}
.done-tag {
  position: absolute;
  top: -10px;
  left: 10px;
  background: #3a9b74;
  color: #fff;
  font-size: 12px;
  font-weight: 900;
  padding: 3px 10px;
  border-radius: 999px;
  z-index: 2;
}
.active-row {
  margin-top: 4px;
}
.drop-tip {
  position: absolute;
  top: 6px;
  left: 10px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(92, 75, 81, 0.45);
}
.split-pass-bar {
  margin-top: 12px;
  display: flex;
  justify-content: center;
}
.split-pass-bar .btn-primary {
  min-width: 160px;
  font-size: 18px;
}
.pool-tip {
  width: 100%;
  margin: 0 0 6px;
  text-align: center;
  font-size: 14px;
  font-weight: 800;
  color: var(--ink-soft);
}
.drag-chip {
  touch-action: none;
  cursor: grab;
  display: inline-flex;
}
.drag-chip:active { cursor: grabbing; }
.drag-chip.dragging {
  opacity: 0.3;
  pointer-events: none; /* 让落点能命中盘子，捕获仍在原元素 */
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
.plate.center {
  margin-top: 10px;
  background: #e4f5ef;
  justify-content: center;
}
.plate.merge-sum {
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: 8px;
  padding-top: 12px;
  min-height: 140px;
}
.merge-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-height: 72px;
  padding: 12px;
  border-radius: 14px;
  border: 2px solid transparent;
  box-sizing: border-box;
}
.merge-icons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  align-items: center;
  min-height: 40px;
  width: 100%;
}
.merge-line.warm {
  background: rgba(255, 200, 150, 0.45);
}
.merge-line.cool {
  background: rgba(150, 210, 235, 0.45);
}
.merge-line.hover {
  border: 2px solid var(--accent-strong);
  box-shadow: 0 0 0 4px rgba(95, 169, 198, 0.28);
}
.merge-sum.assist .drag-chip.assist {
  cursor: grab;
  touch-action: none;
}
.merge-sum.assist .drag-chip.assist:active {
  cursor: grabbing;
}
.eq-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  width: 100%;
  margin-top: 6px;
  gap: 8px;
}
.eq-row .eq {
  grid-column: 2;
  width: auto;
  margin: 0;
  text-align: center;
}
.merge-assist-btn {
  grid-column: 3;
  justify-self: end;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
  background: #fff;
  box-shadow: var(--shadow);
  color: var(--ink);
  white-space: nowrap;
}
.merge-assist-btn.on {
  background: var(--accent);
}
.merge-assist-tip {
  margin: 4px 0 0;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-soft);
}
.merge-op {
  text-align: center;
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
  color: var(--ink);
  margin: -2px 0;
}
.row-tag {
  font-size: 22px;
  font-weight: 900;
  color: var(--ink);
  line-height: 1.1;
  -webkit-text-stroke: 0.3px currentColor;
  transition: transform 0.15s ease;
}
.merge-sum.assist .row-tag {
  transform: scale(1.08);
}
.plate.hide { opacity: 0.25; }
.pn {
  position: absolute;
  top: 6px;
  right: 10px;
  font-size: 22px;
  font-weight: 900;
  opacity: 0.5;
}
.plus { font-size: 32px; font-weight: 900; }
.eq { width: 100%; text-align: center; font-size: 22px; font-weight: 900; margin: 6px 0 0; }
.pool {
  margin-top: 10px;
  min-height: 100px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 20px;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}
.bonds { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; justify-content: center; }
.bond {
  background: var(--lavender);
  border-radius: 14px;
  padding: 6px 10px;
  font-weight: 800;
}
.nums { margin-top: 12px; }
.prog { text-align: center; font-weight: 800; color: var(--ink-soft); }
.demo-mask {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(92, 75, 81, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.demo-card {
  background: var(--bg-cream);
  border-radius: 24px;
  padding: 20px;
  width: 100%;
  max-width: 320px;
}
.dt { font-size: 22px; font-weight: 900; text-align: center; margin: 0 0 12px; }
.demo-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 800;
  font-size: 20px;
}
.mini { display: flex; gap: 3px; flex-wrap: wrap; max-width: 140px; }
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}
.dot.warm { background: var(--hero); }
.dot.cool { background: var(--accent-strong); }
.demo-card .hot { width: 100%; margin-top: 8px; }
</style>
