import { computed, reactive, ref, watch } from 'vue'

const KEY = 'direction-game:anti-addiction'
/** 到点后休息满这么久，再给一轮完整时长 */
const REST_MS = 60 * 60 * 1000

export const ANTI_LIMITS = [5, 10, 15, 30, 45, 60] as const
export type AntiLimit = (typeof ANTI_LIMITS)[number]

interface AntiState {
  enabled: boolean
  limitMinutes: AntiLimit
  /** 本轮可玩开始时间。用墙上时钟，关掉页面也会继续走 */
  startedAt: number | null
  /** 休息开始时间。为空表示没在休息 */
  lockedAt: number | null
}

function isLimit(n: unknown): n is AntiLimit {
  return typeof n === 'number' && (ANTI_LIMITS as readonly number[]).includes(n)
}

function fallback(): AntiState {
  return { enabled: false, limitMinutes: 15, startedAt: null, lockedAt: null }
}

function sanitize(raw: unknown): AntiState {
  const base = fallback()
  if (!raw || typeof raw !== 'object') return base
  const p = raw as Partial<AntiState>
  return {
    enabled: !!p.enabled,
    limitMinutes: isLimit(p.limitMinutes) ? p.limitMinutes : base.limitMinutes,
    startedAt: typeof p.startedAt === 'number' ? p.startedAt : null,
    lockedAt: typeof p.lockedAt === 'number' ? p.lockedAt : null,
  }
}

function load(): AntiState {
  try {
    const raw = localStorage.getItem(KEY)
    return sanitize(raw ? JSON.parse(raw) : null)
  } catch {
    return fallback()
  }
}

/** 本地 vite / 本机预览才露出调试按钮，正式站点没有 */
export const isAntiDebug =
  import.meta.env.DEV ||
  (typeof location !== 'undefined' &&
    (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === '[::1]'))

const state = reactive<AntiState>(load())
const now = ref(Date.now())

function sameState(a: AntiState, b: AntiState) {
  return a.enabled === b.enabled && a.limitMinutes === b.limitMinutes && a.startedAt === b.startedAt && a.lockedAt === b.lockedAt
}

function assign(next: AntiState) {
  if (sameState(state, next)) return
  state.enabled = next.enabled
  state.limitMinutes = next.limitMinutes
  state.startedAt = next.startedAt
  state.lockedAt = next.lockedAt
}

/**
 * 把存档对齐到当前时间：
 * 可玩时间走完就进入休息；休息满 1 小时再开一轮。
 * 若整段休息都是在页面关闭时过去的，回来直接开新一轮。
 */
function reconcile(t = Date.now()) {
  now.value = t
  if (!state.enabled) return
  if (state.lockedAt != null) {
    if (t >= state.lockedAt + REST_MS) {
      state.lockedAt = null
      state.startedAt = t
    }
    return
  }
  if (state.startedAt == null) {
    state.startedAt = t
    return
  }
  const end = state.startedAt + state.limitMinutes * 60_000
  if (t < end) return
  if (t >= end + REST_MS) {
    state.startedAt = t
    return
  }
  state.lockedAt = end
  state.startedAt = null
}

export function isAntiLocked(t = Date.now()) {
  return state.enabled && state.lockedAt != null && t < state.lockedAt + REST_MS
}

function formatClock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const locked = computed(() => isAntiLocked(now.value))

const playLeftMs = computed(() => {
  if (!state.enabled || state.lockedAt != null || state.startedAt == null) return 0
  return Math.max(0, state.startedAt + state.limitMinutes * 60_000 - now.value)
})

const restLeftMs = computed(() => {
  if (state.lockedAt == null) return 0
  return Math.max(0, state.lockedAt + REST_MS - now.value)
})

const playLabel = computed(() => formatClock(playLeftMs.value))
const restLabel = computed(() => formatClock(restLeftMs.value))
const enabled = computed(() => state.enabled)
const limitMinutes = computed(() => state.limitMinutes)

function setEnabled(on: boolean) {
  if (on === state.enabled) return
  if (!on && isAntiLocked()) return
  state.enabled = on
  if (!on) {
    state.startedAt = null
    state.lockedAt = null
    return
  }
  if (state.lockedAt == null) state.startedAt = Date.now()
  reconcile()
}

function setLimit(min: number) {
  if (isAntiLocked()) return
  if (!isLimit(min) || state.limitMinutes === min) return
  state.limitMinutes = min
  reconcile()
}

function debugActivate() {
  if (!isAntiDebug) return
  state.enabled = true
  state.startedAt = null
  state.lockedAt = Date.now()
  reconcile()
}

function debugClear() {
  if (!isAntiDebug) return
  const t = Date.now()
  now.value = t
  state.lockedAt = null
  state.startedAt = state.enabled ? t : null
}

watch(state, () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* 存储不可用时仅本次有效 */
  }
})

reconcile()

const clockFlag = '__kiddoAntiClock'
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

export function useAntiAddiction() {
  return reactive({
    enabled,
    limitMinutes,
    locked,
    playLabel,
    restLabel,
    setEnabled,
    setLimit,
    debugActivate,
    debugClear,
  })
}
