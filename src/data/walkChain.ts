import { DIR_LABEL } from './directions'
import type { LevelItem } from './levels'

export interface WalkHop {
  dir: string
  steps: number
}

export interface WalkChain {
  /** 整条路线第一题的起点格 */
  start: string
  /** 本题之前已经跳过的段 */
  hops: WalkHop[]
}

export interface WalkHopSave {
  correct: string
  steps: string
  prompt: string
  icon: string
}

const DIRS8 = ['U', 'D', 'L', 'R', 'LU', 'RU', 'LD', 'RD'] as const
const DIR_ICON: Record<string, string> = {
  U: '⬆️', D: '⬇️', L: '⬅️', R: '➡️',
  LU: '↖️', RU: '↗️', LD: '↙️', RD: '↘️',
}

/** 每局连跳次数：12～18 次随机 */
const HOP_MIN = 12
const HOP_MAX = 18

const isChain = (it?: LevelItem) => it?.type === 'walk' && it.meta.chain === '1'

export function hopSteps(it: LevelItem): number {
  const n = Number(it.meta.steps)
  return Number.isFinite(n) && n >= 1 ? Math.min(3, Math.floor(n)) : 1
}

/** 连续的 chain=1 走格题共用一条路线；非连跳题返回 null */
export function walkChain(items: LevelItem[], index: number): WalkChain | null {
  if (!isChain(items[index])) return null
  let first = index
  while (first > 0 && isChain(items[first - 1])) first--
  return {
    start: items[first].meta.start || 'C',
    hops: items.slice(first, index).map((it) => ({ dir: it.correct, steps: hopSteps(it) })),
  }
}

function pickSteps(): number {
  const r = Math.random()
  if (r < 0.35) return 1
  if (r < 0.8) return 2
  return 3
}

function pickDir(prev: string | null): string {
  const pool = DIRS8.filter((d) => d !== prev)
  return pool[Math.floor(Math.random() * pool.length)]
}

function stepWord(n: number) {
  return n === 1 ? '一步' : n === 2 ? '两步' : '三大步'
}

function hopPrompt(dir: string, steps: number) {
  return `向${DIR_LABEL[dir]}跳${stepWord(steps)}`
}

function makeHop(levelId: number, itemId: number, prev: string | null, isFirst: boolean, start: string): LevelItem {
  const dir = pickDir(prev)
  const steps = pickSteps()
  return {
    levelId,
    itemId,
    type: 'walk',
    prompt: hopPrompt(dir, steps),
    icon: DIR_ICON[dir] ?? '↗️',
    correct: dir,
    options: [],
    meta: {
      ...(isFirst ? { start } : {}),
      pad: '8',
      chain: '1',
      steps: String(steps),
    },
  }
}

function hopsFromSave(levelId: number, start: string, saved: WalkHopSave[]): LevelItem[] {
  return saved.map((h, k) => ({
    levelId,
    itemId: 700 + k,
    type: 'walk' as const,
    prompt: h.prompt,
    icon: h.icon,
    correct: h.correct,
    options: [],
    meta: {
      ...(k === 0 ? { start } : {}),
      pad: '8',
      chain: '1',
      steps: h.steps,
    },
  }))
}

function pickHopCount() {
  return HOP_MIN + Math.floor(Math.random() * (HOP_MAX - HOP_MIN + 1))
}

/**
 * 把题库里的 chain 占位段，扩成 12～18 次随机连跳（方向相邻不重复）。
 * 若传入 savedHops，则按存档还原同一条路线。
 */
export function expandWalkChains(items: LevelItem[], savedHops?: WalkHopSave[]): LevelItem[] {
  const out: LevelItem[] = []
  let i = 0
  let expanded = false
  while (i < items.length) {
    if (!isChain(items[i])) {
      out.push({ ...items[i], meta: { ...items[i].meta } })
      i++
      continue
    }
    const levelId = items[i].levelId
    const start = items[i].meta.start || 'C'
    while (i < items.length && isChain(items[i])) i++
    if (expanded) continue
    expanded = true
    if (savedHops?.length) {
      out.push(...hopsFromSave(levelId, start, savedHops))
    } else {
      const n = pickHopCount()
      let prev: string | null = null
      for (let k = 0; k < n; k++) {
        const hop = makeHop(levelId, 700 + k, prev, k === 0, start)
        prev = hop.correct
        out.push(hop)
      }
    }
  }
  return out
}

export function collectWalkHops(items: LevelItem[]): WalkHopSave[] {
  return items
    .filter(isChain)
    .map((it) => ({
      correct: it.correct,
      steps: String(hopSteps(it)),
      prompt: it.prompt,
      icon: it.icon,
    }))
}
