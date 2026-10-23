import { reactive } from 'vue'
import { EXTRA_MODES, EXTRA_SLUG, type ExtraModeId } from '../data/sense/meta'

const KEY = 'kiddo-playlearn:extra-insert:v1'
const EVERY = 5

interface State {
  clears: number
  /** 待展示插播 */
  pending: boolean
  lastDismissDay: string
}

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { clears: 0, pending: false, lastDismissDay: '' }
    const p = JSON.parse(raw)
    return {
      clears: Math.max(0, Number(p.clears) || 0),
      pending: !!p.pending,
      lastDismissDay: String(p.lastDismissDay || ''),
    }
  } catch {
    return { clears: 0, pending: false, lastDismissDay: '' }
  }
}

const state = reactive(load())

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

/** 主线/附加通关时调用：每 FULL 次弹出插播 */
export function noteSenseClear() {
  state.clears += 1
  if (state.clears > 0 && state.clears % EVERY === 0) {
    state.pending = true
  }
  save()
}

export function dismissExtraInsert() {
  state.pending = false
  state.lastDismissDay = today()
  save()
}

/** 随机一个附加玩法入口 */
export function pickInsertExtra(): { id: ExtraModeId; path: string; name: string; emoji: string } {
  const pool = EXTRA_MODES.filter((m) =>
    ['spotDiff', 'shadowMatch', 'oddOne', 'whoMissing', 'peekFind', 'orderNums', 'rhythm'].includes(
      m.id,
    ),
  )
  const m = pool[Math.floor(Math.random() * pool.length)]!
  return {
    id: m.id as ExtraModeId,
    path: `/sense/extra/${EXTRA_SLUG[m.id as ExtraModeId]}`,
    name: m.name,
    emoji: m.emoji,
  }
}

export function useExtraInsert() {
  return {
    state,
    noteSenseClear,
    dismissExtraInsert,
    pickInsertExtra,
    every: EVERY,
  }
}
