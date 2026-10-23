import { computed, reactive, ref, watch } from 'vue'
import { isAntiDebug } from './useAntiAddiction'

const KEY = 'direction-game:wrong-rest'
/** 错题达到上限后的休息时长，和防沉迷的 1 小时无关 */
const REST_MS = 30 * 60 * 1000

export const WRONG_LIMITS = [3, 5, 8, 10, 15, 20] as const
export type WrongLimit = (typeof WRONG_LIMITS)[number]

interface WrongState {
  /** 0 表示未配置 */
  max: 0 | WrongLimit
  /** 本轮重新计算后累计的错题 */
  wrongCount: number
  /** 本轮开始时间 */
  periodStartedAt: number | null
  /** 休息开始时间 */
  lockedAt: number | null
}

function isLimit(n: unknown): n is WrongLimit {
  return typeof n === 'number' && (WRONG_LIMITS as readonly number[]).includes(n)
}

function fallback(): WrongState {
  return { max: 0, wrongCount: 0, periodStartedAt: null, lockedAt: null }
}

function sanitize(raw: unknown): WrongState {
  const base = fallback()
  if (!raw || typeof raw !== 'object') return base
  const p = raw as Partial<WrongState>
  const max = p.max === 0 || isLimit(p.max) ? p.max : base.max
  const wrongCount = Math.max(0, Math.floor(Number(p.wrongCount) || 0))
  return {
    max,
    wrongCount,
    periodStartedAt: typeof p.periodStartedAt === 'number' ? p.periodStartedAt : null,
    lockedAt: typeof p.lockedAt === 'number' ? p.lockedAt : null,
  }
}

function load(): WrongState {
  try {
    const raw = localStorage.getItem(KEY)
    return sanitize(raw ? JSON.parse(raw) : null)
  } catch {
    return fallback()
  }
}

const state = reactive<WrongState>(load())
const now = ref(Date.now())

function sameState(a: WrongState, b: WrongState) {
  return (
    a.max === b.max &&
    a.wrongCount === b.wrongCount &&
    a.periodStartedAt === b.periodStartedAt &&
    a.lockedAt === b.lockedAt
  )
}

function assign(next: WrongState) {
  if (sameState(state, next)) return
  state.max = next.max
  state.wrongCount = next.wrongCount
  state.periodStartedAt = next.periodStartedAt
  state.lockedAt = next.lockedAt
}

/** 休息满 30 分钟就清零，开始下一轮计数 */
function reconcile(t = Date.now()) {
  now.value = t
  if (!state.max) {
    state.wrongCount = 0
    state.periodStartedAt = null
    state.lockedAt = null
    return
  }
  if (state.lockedAt != null) {
    if (t >= state.lockedAt + REST_MS) {
      state.lockedAt = null
      state.wrongCount = 0
      state.periodStartedAt = t
    }
    return
  }
  if (state.periodStartedAt == null) state.periodStartedAt = t
  if (state.wrongCount >= state.max) state.lockedAt = t
}

export function isWrongLocked(t = Date.now()) {
  return state.max > 0 && state.lockedAt != null && t < state.lockedAt + REST_MS
}

function formatClock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const locked = computed(() => isWrongLocked(now.value))
const restLeftMs = computed(() => {
  if (state.lockedAt == null) return 0
  return Math.max(0, state.lockedAt + REST_MS - now.value)
})
const restLabel = computed(() => formatClock(restLeftMs.value))
const max = computed(() => state.max)
const wrongCount = computed(() => state.wrongCount)

function setMax(n: number) {
  if (isWrongLocked()) return
  if (n !== 0 && !isLimit(n)) return
  if (n === state.max) return
  const t = Date.now()
  now.value = t
  const wasOff = state.max === 0
  state.max = n as 0 | WrongLimit
  if (n === 0) {
    state.wrongCount = 0
    state.periodStartedAt = null
    state.lockedAt = null
    return
  }
  if (wasOff) {
    state.wrongCount = 0
    state.periodStartedAt = t
    state.lockedAt = null
    return
  }
  if (state.periodStartedAt == null) state.periodStartedAt = t
  if (state.wrongCount >= n) state.lockedAt = t
}

/** 结算为一道错题时调用。只在本轮重新计算之后累计。 */
export function noteWrongAnswer() {
  if (!state.max || isWrongLocked()) return
  if (state.periodStartedAt == null) state.periodStartedAt = Date.now()
  state.wrongCount += 1
  if (state.wrongCount >= state.max) state.lockedAt = Date.now()
}

function debugActivate() {
  if (!isAntiDebug) return
  const t = Date.now()
  now.value = t
  if (!state.max) state.max = 3
  state.wrongCount = state.max
  state.periodStartedAt = state.periodStartedAt ?? t
  state.lockedAt = t
}

function debugClear() {
  if (!isAntiDebug) return
  const t = Date.now()
  now.value = t
  state.lockedAt = null
  state.wrongCount = 0
  state.periodStartedAt = state.max ? t : null
}

watch(state, () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* 存储不可用时仅本次有效 */
  }
})

reconcile()

const clockFlag = '__kiddoWrongClock'
const host = window as Window & { [clockFlag]?: boolean }
if (!host[clockFlag]) {
  host[clockFlag] = true
  window.setInterval(() => reconcile(), 1000)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') reconcile()
  })
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY || !e.newValue) return
    try {
      assign(sanitize(JSON.parse(e.newValue)))
      reconcile()
    } catch {
      /* 忽略坏数据 */
    }
  })
}

export function useWrongRest() {
  return reactive({
    max,
    wrongCount,
    locked,
    restLabel,
    setMax,
    debugActivate,
    debugClear,
  })
}
