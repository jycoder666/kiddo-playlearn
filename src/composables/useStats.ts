import { computed, reactive, watch } from 'vue'

const KEY = 'direction-game:stats'

export type StatsGroup = 'direction' | 'calc' | 'rec'

export interface AreaStat {
  name: string
  group: StatsGroup
  correct: number
  total: number
  /** 错题标签 → 次数，例如「右」→ 3 */
  wrongs: Record<string, number>
}

interface StatsState {
  areas: Record<string, AreaStat>
}

const GROUPS: StatsGroup[] = ['direction', 'calc', 'rec']

function empty(): StatsState {
  return { areas: {} }
}

function isGroup(v: unknown): v is StatsGroup {
  return v === 'direction' || v === 'calc' || v === 'rec'
}

function sanitizeArea(raw: unknown): AreaStat | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Partial<AreaStat>
  if (!isGroup(p.group) || typeof p.name !== 'string' || !p.name) return null
  const wrongs: Record<string, number> = {}
  if (p.wrongs && typeof p.wrongs === 'object') {
    for (const [k, n] of Object.entries(p.wrongs)) {
      if (k && typeof n === 'number' && n > 0) wrongs[k] = Math.floor(n)
    }
  }
  const total = Math.max(0, Math.floor(Number(p.total) || 0))
  const correct = Math.min(total, Math.max(0, Math.floor(Number(p.correct) || 0)))
  return { name: p.name, group: p.group, correct, total, wrongs }
}

function load(): StatsState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const p = JSON.parse(raw) as { areas?: Record<string, unknown> }
    const areas: Record<string, AreaStat> = {}
    if (p?.areas && typeof p.areas === 'object') {
      for (const [id, area] of Object.entries(p.areas)) {
        const clean = sanitizeArea(area)
        if (id && clean && clean.total > 0) areas[id] = clean
      }
    }
    return { areas }
  } catch {
    return empty()
  }
}

const state = reactive<StatsState>(load())

watch(state, () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* 存储不可用时仅本次有效 */
  }
})

export function recordAnswer(input: {
  id: string
  name: string
  group: StatsGroup
  ok: boolean
  /** 答错时记下这一题属于什么，例如「右」「7」 */
  label?: string
}) {
  if (!input.id || !GROUPS.includes(input.group)) return
  let area = state.areas[input.id]
  if (!area) {
    area = { name: input.name, group: input.group, correct: 0, total: 0, wrongs: {} }
    state.areas[input.id] = area
  }
  area.name = input.name
  area.total += 1
  if (input.ok) {
    area.correct += 1
    return
  }
  const label = (input.label || '这题').trim()
  area.wrongs[label] = (area.wrongs[label] ?? 0) + 1
}

export function clearStats() {
  state.areas = {}
}

const totalCount = computed(() => Object.values(state.areas).reduce((sum, a) => sum + a.total, 0))
const correctCount = computed(() => Object.values(state.areas).reduce((sum, a) => sum + a.correct, 0))

export function useStats() {
  return { state, totalCount, correctCount, recordAnswer, clearStats }
}
