import { reactive, ref } from 'vue'
import { LEVEL_COUNT } from '../data/levelMeta'

export type Outcome = 'self' | 'helped' | 'demo'

export interface IncompleteRun {
  levelId: number
  itemIndex: number
  answers: Outcome[]
  demoCount: number
  /** 本局洗牌后的 itemId 顺序，续局保持一致 */
  order?: number[]
  /** 本局随机连跳整段（次数/方向/步数） */
  walkHops?: Array<{ correct: string; steps: string; prompt: string; icon: string }>
}

interface ProgressState {
  unlockedMax: number
  highestStars: Record<string, number>
  stickers: Record<string, boolean>
  incompleteRun: IncompleteRun | null
}

const KEY = 'direction-game:v1'

function fresh(): ProgressState {
  const highestStars: Record<string, number> = {}
  const stickers: Record<string, boolean> = {}
  for (let i = 1; i <= LEVEL_COUNT; i++) {
    highestStars[i] = 0
    stickers[i] = false
  }
  return { unlockedMax: 1, highestStars, stickers, incompleteRun: null }
}

const loadFailed = ref(false)

function load(): ProgressState {
  const base = fresh()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return base
    const p = JSON.parse(raw)
    if (typeof p !== 'object' || p === null || typeof p.unlockedMax !== 'number') throw new Error('bad schema')
    return {
      unlockedMax: Math.min(Math.max(1, p.unlockedMax), LEVEL_COUNT),
      highestStars: { ...base.highestStars, ...p.highestStars },
      stickers: { ...base.stickers, ...p.stickers },
      incompleteRun: p.incompleteRun ?? null,
    }
  } catch {
    loadFailed.value = true
    return base
  }
}

const state = reactive<ProgressState>(load())

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* 隐私模式等存储失败：不挡玩 */
  }
}

function isUnlocked(levelId: number) {
  return levelId >= 1 && levelId <= state.unlockedMax
}

function saveRun(run: IncompleteRun) {
  state.incompleteRun = { ...run, answers: [...run.answers] }
  save()
}

function clearRun() {
  state.incompleteRun = null
  save()
}

/** 星级取历史最高；首次达标掉贴纸并解锁下一关 */
function recordResult(levelId: number, stars: number, passed: boolean) {
  const key = String(levelId)
  if (stars > (state.highestStars[key] ?? 0)) state.highestStars[key] = stars
  const newSticker = passed && !state.stickers[key]
  if (newSticker) state.stickers[key] = true
  const newUnlock = passed && state.unlockedMax === levelId && levelId < LEVEL_COUNT
  if (newUnlock) state.unlockedMax = levelId + 1
  state.incompleteRun = null
  save()
  return { newSticker, newUnlock }
}

function dismissLoadError() {
  loadFailed.value = false
  save()
}

export function useProgress() {
  return { state, loadFailed, isUnlocked, saveRun, clearRun, recordResult, dismissLoadError }
}
