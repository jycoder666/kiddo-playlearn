import { SHAPE_CONFUSE, SHAPES, type ShapeId } from './attr'
import { ITEM_SKINS, type ItemSkin } from './items'
import { numberChoices, pick, randInt, shuffle } from './util'

export interface SpotDiffQ {
  left: number
  right: number
  /** 数量不同的一侧 */
  answer: 'left' | 'right'
}

/** 找不同：两侧数量差恰好 1，范围 1～8 */
export function makeSpotDiffQuiz(count = 5): SpotDiffQ[] {
  const out: SpotDiffQ[] = []
  for (let i = 0; i < count; i++) {
    const low = randInt(1, 7)
    const high = low + 1
    const answer = pick(['left', 'right'] as const)
    out.push({
      left: answer === 'left' ? high : low,
      right: answer === 'right' ? high : low,
      answer,
    })
  }
  return out
}

export interface ShadowMatchQ {
  answer: ShapeId
  choices: ShapeId[]
  fill: string
}

/** 影子配对：轮廓 + 含易混的 4 选项 */
export function makeShadowMatchQuiz(count = 6): ShadowMatchQ[] {
  const ids = shuffle(SHAPES.map((s) => s.id))
  const picks = ids.slice(0, Math.min(count, ids.length))
  while (picks.length < count) picks.push(pick(ids))
  const fills = ['#5a6a78', '#6b7c8a', '#4a5a68']
  return picks.map((answer, i) => {
    const set = new Set<ShapeId>([answer])
    for (const c of SHAPE_CONFUSE[answer] || []) {
      if (set.size >= 4) break
      set.add(c)
    }
    const rest = shuffle(SHAPES.map((s) => s.id).filter((x) => !set.has(x)))
    for (const x of rest) {
      if (set.size >= 4) break
      set.add(x)
    }
    return {
      answer,
      choices: shuffle([...set]),
      fill: fills[i % fills.length],
    }
  })
}

export function shapeClip(id: ShapeId): string {
  switch (id) {
    case 'circle':
      return 'circle(50% at 50% 50%)'
    case 'ellipse':
      return 'ellipse(50% 38% at 50% 50%)'
    case 'square':
      return 'inset(12% 12% 12% 12%)'
    case 'rect':
      return 'inset(22% 6% 22% 6%)'
    case 'triangle':
      return 'polygon(50% 8%, 92% 88%, 8% 88%)'
    case 'diamond':
      return 'polygon(50% 6%, 92% 50%, 50% 94%, 8% 50%)'
    case 'trapezoid':
      return 'polygon(22% 18%, 78% 18%, 94% 82%, 6% 82%)'
    case 'star':
      return 'polygon(50% 4%, 61% 38%, 96% 38%, 68% 58%, 79% 92%, 50% 72%, 21% 92%, 32% 58%, 4% 38%, 39% 38%)'
    default:
      return 'circle(50% at 50% 50%)'
  }
}

/** F25 谁来过：闪示 party → 缺一人 → 3 选项 */
export interface WhoMissingQ {
  party: ItemSkin[]
  missing: ItemSkin
  choices: ItemSkin[]
}

export function makeWhoMissingQuiz(count = 5): WhoMissingQ[] {
  const out: WhoMissingQ[] = []
  for (let i = 0; i < count; i++) {
    const size = randInt(3, 5)
    const order = shuffle(ITEM_SKINS.map((s) => s.id))
    const party = order.slice(0, size)
    const missing = pick(party)
    const strangers = order.filter((id) => !party.includes(id)).slice(0, 2)
    while (strangers.length < 2) {
      const s = pick(ITEM_SKINS.map((x) => x.id))
      if (!party.includes(s) && !strangers.includes(s)) strangers.push(s)
    }
    out.push({ party, missing, choices: shuffle([missing, ...strangers]) })
  }
  return out
}

/** F26 偷看找：格子上的皮肤，找 targets */
export interface PeekFindBoard {
  tiles: ItemSkin[]
  targets: ItemSkin[]
}

export function makePeekFindBoard(): PeekFindBoard {
  const tileCount = 6
  const pool = shuffle(ITEM_SKINS.map((s) => s.id))
  const tiles: ItemSkin[] = []
  while (tiles.length < tileCount) {
    tiles.push(pool[tiles.length % pool.length])
  }
  const onBoard = [...new Set(tiles)]
  const targets = shuffle(onBoard).slice(0, Math.min(3, onBoard.length))
  return { tiles: shuffle(tiles), targets }
}

/** F30 数字排队 */
export function makeOrderNumsQuiz(count = 5): number[][] {
  return Array.from({ length: count }, () => {
    const k = randInt(3, 5)
    const start = randInt(1, 11 - k)
    return shuffle(Array.from({ length: k }, (_, i) => start + i))
  })
}

/** F34 帽子藏宝 */
export interface MagicHatQ {
  start: number
  delta: number
  /** + 放进 / − 取出 */
  op: '+' | '−'
  answer: number
  choices: number[]
}

export function makeMagicHatQuiz(count = 6, max = 10): MagicHatQ[] {
  const out: MagicHatQ[] = []
  for (let i = 0; i < count; i++) {
    const op = pick(['+', '−'] as const)
    let start: number
    let delta: number
    let answer: number
    if (op === '+') {
      start = randInt(1, max - 1)
      delta = randInt(1, max - start)
      answer = start + delta
    } else {
      start = randInt(2, max)
      delta = randInt(1, start - 1)
      answer = start - delta
    }
    out.push({
      start,
      delta,
      op,
      answer,
      choices: numberChoices(answer, 4),
    })
  }
  return out
}
