import { reactive } from 'vue'
import {
  CALC_UNLOCK_ORDER,
  CMP_UNLOCK_ORDER,
  COMPOSE_UNLOCK_ORDER,
  REC_UNLOCK_ORDER,
  type AttrModeId,
  type CalcModeId,
  type CmpModeId,
  type ComposeModeId,
  type RecModeId,
} from '../data/sense/meta'

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

const CALC_KEY = 'kiddo-playlearn:number:v1'
const REC_KEY = 'kiddo-playlearn:number:recognize:v1'
const CMP_KEY = 'kiddo-playlearn:number:compare:v1'
const ATTR_KEY = 'kiddo-playlearn:number:recognize-attr:v1'
const COMPOSE_KEY = 'kiddo-playlearn:number:compose:v1'

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

const calc = reactive(loadTrack(CALC_KEY, CALC_UNLOCK_ORDER.length))
const rec = reactive(loadTrack(REC_KEY, REC_UNLOCK_ORDER.length))
const cmp = reactive(loadTrack(CMP_KEY, CMP_UNLOCK_ORDER.length))
const attr = reactive(loadAttr())
/** 拼图形三模式全开：unlockedIndex 固定为最后一项 */
const compose = reactive(() => {
  const t = loadTrack(COMPOSE_KEY, COMPOSE_UNLOCK_ORDER.length)
  t.unlockedIndex = COMPOSE_UNLOCK_ORDER.length - 1
  return t
})()

function isCalcUnlocked(id: CalcModeId) {
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

function completeCalc(id: CalcModeId, stars = 2) {
  const i = CALC_UNLOCK_ORDER.indexOf(id)
  if (i < 0) return
  calc.stars[id] = Math.max(calc.stars[id] ?? 0, stars)
  if (id === 'challenge') calc.stickers.challenge = true
  if (i === calc.unlockedIndex && i < CALC_UNLOCK_ORDER.length - 1) {
    calc.unlockedIndex = i + 1
  }
  saveTrack(CALC_KEY, calc)
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

export function useSenseProgress() {
  return {
    calc,
    rec,
    cmp,
    attr,
    compose,
    isCalcUnlocked,
    isRecUnlocked,
    isCmpUnlocked,
    isAttrUnlocked,
    isComposeUnlocked,
    completeCalc,
    completeRec,
    completeCmp,
    completeAttr,
    completeCompose,
  }
}
