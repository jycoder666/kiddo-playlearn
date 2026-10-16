import { reactive } from 'vue'
import {
  CALC_UNLOCK_ORDER,
  CMP_UNLOCK_ORDER,
  REC_UNLOCK_ORDER,
  type CalcModeId,
  type CmpModeId,
  type RecModeId,
} from '../data/sense/meta'

interface TrackState {
  unlockedIndex: number
  stars: Record<string, number>
  stickers: Record<string, boolean>
}

const CALC_KEY = 'kiddo-playlearn:number:v1'
const REC_KEY = 'kiddo-playlearn:number:recognize:v1'
const CMP_KEY = 'kiddo-playlearn:number:compare:v1'

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

const calc = reactive(loadTrack(CALC_KEY, CALC_UNLOCK_ORDER.length))
const rec = reactive(loadTrack(REC_KEY, REC_UNLOCK_ORDER.length))
const cmp = reactive(loadTrack(CMP_KEY, CMP_UNLOCK_ORDER.length))

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

export function useSenseProgress() {
  return {
    calc,
    rec,
    cmp,
    isCalcUnlocked,
    isRecUnlocked,
    isCmpUnlocked,
    completeCalc,
    completeRec,
    completeCmp,
  }
}
