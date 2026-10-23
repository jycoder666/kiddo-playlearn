import { reactive } from 'vue'
import {
  CALC_UNLOCK_ORDER,
  CMP_UNLOCK_ORDER,
  COMPOSE_UNLOCK_ORDER,
  EXTRA_MODES,
  REC_UNLOCK_ORDER,
  type AttrModeId,
  type CalcModeId,
  type CmpModeId,
  type ComposeModeId,
  type ExtraModeId,
  type MemoryModeId,
  type RecModeId,
} from '../data/sense/meta'
import { noteSenseClear } from './useExtraInsert'

interface TrackState {
  unlockedIndex: number
  stars: Record<string, number>
  stickers: Record<string, boolean>
}

/** 颜色/图形线：按通关集合解锁，不用线性 unlockedIndex */
interface AttrState {
  done: Record<string, boolean>
  stars: Record<string, number>
}

/** 记忆翻牌线：集合通关，与 attr 同形 */
type MemoryState = AttrState
/** 热身 / 找不同 / 影子 */
type ExtraState = AttrState

const CALC_KEY = 'kiddo-playlearn:number:v1'
const REC_KEY = 'kiddo-playlearn:number:recognize:v1'
const CMP_KEY = 'kiddo-playlearn:number:compare:v1'
const ATTR_KEY = 'kiddo-playlearn:number:recognize-attr:v1'
const COMPOSE_KEY = 'kiddo-playlearn:number:compose:v1'
const MEMORY_KEY = 'kiddo-playlearn:number:memory:v1'
const EXTRA_KEY = 'kiddo-playlearn:number:extra:v1'

function freshTrack(_orderLen: number): TrackState {
  return { unlockedIndex: 0, stars: {}, stickers: {} }
}

function loadTrack(key: string, orderLen: number): TrackState {
  const base = freshTrack(orderLen)
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return base
    const p = JSON.parse(raw)
    return {
      unlockedIndex: Math.min(Math.max(0, Number(p.unlockedIndex) || 0), orderLen - 1),
      stars: { ...(p.stars || {}) },
      stickers: { ...(p.stickers || {}) },
    }
  } catch {
    return base
  }
}

function saveTrack(key: string, state: TrackState) {
  try {
    localStorage.setItem(key, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

function freshAttr(): AttrState {
  return { done: {}, stars: {} }
}

function loadAttr(): AttrState {
  const base = freshAttr()
  try {
    const raw = localStorage.getItem(ATTR_KEY)
    if (!raw) return base
    const p = JSON.parse(raw)
    return {
      done: { ...(p.done || {}) },
      stars: { ...(p.stars || {}) },
    }
  } catch {
    return base
  }
}

function saveAttr(state: AttrState) {
  try {
    localStorage.setItem(ATTR_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

function freshMemory(): MemoryState {
  return { done: {}, stars: {} }
}

function loadMemory(): MemoryState {
  const base = freshMemory()
  try {
    const raw = localStorage.getItem(MEMORY_KEY)
    if (!raw) return base
    const p = JSON.parse(raw)
    return {
      done: { ...(p.done || {}) },
      stars: { ...(p.stars || {}) },
    }
  } catch {
    return base
  }
}

function saveMemory(state: MemoryState) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

function freshExtra(): ExtraState {
  return { done: {}, stars: {} }
}

function loadExtra(): ExtraState {
  const base = freshExtra()
  try {
    const raw = localStorage.getItem(EXTRA_KEY)
    if (!raw) return base
    const p = JSON.parse(raw)
    return {
      done: { ...(p.done || {}) },
      stars: { ...(p.stars || {}) },
    }
  } catch {
    return base
  }
}

function saveExtra(state: ExtraState) {
  try {
    localStorage.setItem(EXTRA_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

const calc = reactive(loadTrack(CALC_KEY, CALC_UNLOCK_ORDER.length))
const rec = reactive(loadTrack(REC_KEY, REC_UNLOCK_ORDER.length))
const cmp = reactive(loadTrack(CMP_KEY, CMP_UNLOCK_ORDER.length))
const attr = reactive(loadAttr())
const memory = reactive(loadMemory())
const extra = reactive(loadExtra())
/** 拼图形三模式全开：unlockedIndex 固定为最后一项 */
const compose = reactive(() => {
  const t = loadTrack(COMPOSE_KEY, COMPOSE_UNLOCK_ORDER.length)
  t.unlockedIndex = COMPOSE_UNLOCK_ORDER.length - 1
  return t
})()

function isCalcUnlocked(id: CalcModeId) {
  /** 口算接龙始终可进（F13） */
  if (id === 'eqPick') return true
  const i = CALC_UNLOCK_ORDER.indexOf(id)
  return i >= 0 && i <= calc.unlockedIndex
}

function isRecUnlocked(id: RecModeId) {
  const i = REC_UNLOCK_ORDER.indexOf(id)
  return i >= 0 && i <= rec.unlockedIndex
}

function isCmpUnlocked(id: CmpModeId) {
  const i = CMP_UNLOCK_ORDER.indexOf(id)
  return i >= 0 && i <= cmp.unlockedIndex
}

function isAttrUnlocked(id: AttrModeId) {
  if (id === 'colorIntro' || id === 'shapeIntro') return true
  if (id === 'colorQuiz') return !!attr.done.colorIntro
  if (id === 'shapeQuiz') return !!attr.done.shapeIntro
  if (id === 'combo') return !!attr.done.colorQuiz && !!attr.done.shapeQuiz
  return false
}

function isComposeUnlocked(id: ComposeModeId) {
  return COMPOSE_UNLOCK_ORDER.includes(id)
}

/** 记忆关目前全部开放；预留 id 校验 */
function isMemoryUnlocked(id: MemoryModeId) {
  return (
    id === 'numPair' || id === 'colorPair' || id === 'shapePair' || id === 'eqPair'
  )
}

/** 附加玩法始终可进 */
const EXTRA_OPEN: ExtraModeId[] = EXTRA_MODES.map((m) => m.id as ExtraModeId)

function isExtraUnlocked(id: ExtraModeId) {
  return EXTRA_OPEN.includes(id)
}

function completeCalc(id: CalcModeId, stars = 2) {
  const i = CALC_UNLOCK_ORDER.indexOf(id)
  if (i < 0) return
  calc.stars[id] = Math.max(calc.stars[id] ?? 0, stars)
  if (id === 'challenge') calc.stickers.challenge = true
  if (i === calc.unlockedIndex && i < CALC_UNLOCK_ORDER.length - 1) {
    calc.unlockedIndex = i + 1
  }
  saveTrack(CALC_KEY, calc)
  noteSenseClear()
}

function completeRec(id: RecModeId, stars = 2) {
  const i = REC_UNLOCK_ORDER.indexOf(id)
  if (i < 0) return
  rec.stars[id] = Math.max(rec.stars[id] ?? 0, stars)
  if (id === 'challenge') rec.stickers.challenge = true
  if (i === rec.unlockedIndex && i < REC_UNLOCK_ORDER.length - 1) {
    rec.unlockedIndex = i + 1
  }
  saveTrack(REC_KEY, rec)
  noteSenseClear()
}

function completeCmp(id: CmpModeId, stars = 2) {
  const i = CMP_UNLOCK_ORDER.indexOf(id)
  if (i < 0) return
  cmp.stars[id] = Math.max(cmp.stars[id] ?? 0, stars)
  if (id === 'challenge') cmp.stickers.challenge = true
  if (i === cmp.unlockedIndex && i < CMP_UNLOCK_ORDER.length - 1) {
    cmp.unlockedIndex = i + 1
  }
  saveTrack(CMP_KEY, cmp)
}

function completeAttr(id: AttrModeId, stars = 2) {
  attr.done[id] = true
  attr.stars[id] = Math.max(attr.stars[id] ?? 0, stars)
  saveAttr(attr)
}

function completeCompose(id: ComposeModeId, stars = 2) {
  if (!COMPOSE_UNLOCK_ORDER.includes(id)) return
  compose.stars[id] = Math.max(compose.stars[id] ?? 0, stars)
  compose.unlockedIndex = COMPOSE_UNLOCK_ORDER.length - 1
  saveTrack(COMPOSE_KEY, compose)
}

function completeMemory(id: MemoryModeId, stars = 2) {
  if (!isMemoryUnlocked(id)) return
  memory.done[id] = true
  memory.stars[id] = Math.max(memory.stars[id] ?? 0, Math.min(3, stars))
  saveMemory(memory)
  noteSenseClear()
}

function completeExtra(id: ExtraModeId, stars = 2) {
  if (!isExtraUnlocked(id)) return
  extra.done[id] = true
  extra.stars[id] = Math.max(extra.stars[id] ?? 0, Math.min(3, stars))
  saveExtra(extra)
  noteSenseClear()
}

/** 数感岛子岛：家长角重置单位 */
export type SenseIslandId = 'calc' | 'recognize' | 'compare' | 'compose'

const ISLAND_LABEL: Record<SenseIslandId, string> = {
  calc: '算一算',
  recognize: '认一认',
  compare: '比一比',
  compose: '拼图形',
}

export function islandLabel(id: SenseIslandId) {
  return ISLAND_LABEL[id]
}

/** 由 SenseChrome backTo 推断当前岛 */
export function islandFromBackTo(backTo?: string): SenseIslandId | null {
  const p = backTo || ''
  if (p.includes('/sense/calc')) return 'calc'
  if (p.includes('/sense/recognize')) return 'recognize'
  if (p.includes('/sense/compare')) return 'compare'
  if (p.includes('/sense/compose')) return 'compose'
  return null
}

function assignTrack(target: TrackState, next: TrackState) {
  target.unlockedIndex = next.unlockedIndex
  target.stars = { ...next.stars }
  target.stickers = { ...next.stickers }
}

function assignAttrLike(target: AttrState, next: AttrState) {
  target.done = { ...next.done }
  target.stars = { ...next.stars }
}

function resetIsland(id: SenseIslandId) {
  if (id === 'calc') {
    assignTrack(calc, freshTrack(CALC_UNLOCK_ORDER.length))
    saveTrack(CALC_KEY, calc)
    return
  }
  if (id === 'compare') {
    assignTrack(cmp, freshTrack(CMP_UNLOCK_ORDER.length))
    saveTrack(CMP_KEY, cmp)
    return
  }
  if (id === 'compose') {
    const next = freshTrack(COMPOSE_UNLOCK_ORDER.length)
    next.unlockedIndex = COMPOSE_UNLOCK_ORDER.length - 1
    assignTrack(compose, next)
    saveTrack(COMPOSE_KEY, compose)
    return
  }
  // recognize：数字线 + 颜色图形 + 记忆 + 附加玩法
  assignTrack(rec, freshTrack(REC_UNLOCK_ORDER.length))
  saveTrack(REC_KEY, rec)
  assignAttrLike(attr, freshAttr())
  saveAttr(attr)
  assignAttrLike(memory, freshMemory())
  saveMemory(memory)
  assignAttrLike(extra, freshExtra())
  saveExtra(extra)
}

export function useSenseProgress() {
  return {
    calc,
    rec,
    cmp,
    attr,
    memory,
    extra,
    compose,
    isCalcUnlocked,
    isRecUnlocked,
    isCmpUnlocked,
    isAttrUnlocked,
    isComposeUnlocked,
    isMemoryUnlocked,
    isExtraUnlocked,
    completeCalc,
    completeRec,
    completeCmp,
    completeAttr,
    completeCompose,
    completeMemory,
    completeExtra,
    resetIsland,
  }
}
