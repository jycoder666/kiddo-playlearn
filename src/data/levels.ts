import l1 from './levels/l1.csv?raw'
import l2 from './levels/l2.csv?raw'
import l3 from './levels/l3.csv?raw'
import l4 from './levels/l4.csv?raw'
import l5 from './levels/l5.csv?raw'

export type ItemType = 'point' | 'walk' | 'body' | 'grid9' | 'compose' | 'place' | 'map' | 'mapfind'

export interface LevelItem {
  levelId: number
  itemId: number
  type: ItemType
  prompt: string
  icon: string
  correct: string
  options: string[]
  meta: Record<string, string>
}

const RAW: Record<number, string> = { 1: l1, 2: l2, 3: l3, 4: l4, 5: l5 }
const cache = new Map<number, LevelItem[]>()

function parseMeta(text: string): Record<string, string> {
  const meta: Record<string, string> = {}
  for (const pair of text.split(';')) {
    const [k, ...rest] = pair.split('=')
    if (k?.trim()) meta[k.trim()] = rest.join('=').trim()
  }
  return meta
}

function parseCsv(text: string): LevelItem[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const header = lines[0].split(',').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const cols = line.split(',')
    const row: Record<string, string> = {}
    header.forEach((h, i) => (row[h] = (cols[i] ?? '').trim()))
    return {
      levelId: Number(row.level_id),
      itemId: Number(row.item_id),
      type: row.type as ItemType,
      prompt: row.prompt_zh,
      icon: row.prompt_icon,
      correct: row.correct,
      options: row.options ? row.options.split('|') : [],
      meta: parseMeta(row.meta ?? ''),
    }
  })
}

export function getLevelItems(levelId: number): LevelItem[] {
  if (!cache.has(levelId)) cache.set(levelId, RAW[levelId] ? parseCsv(RAW[levelId]) : [])
  return cache.get(levelId)!
}

/** 连跳(chain=1)整段不可拆；其余每题一块 */
function toBlocks(items: LevelItem[]): LevelItem[][] {
  const blocks: LevelItem[][] = []
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    if (it.type === 'walk' && it.meta.chain === '1') {
      const block = [it]
      while (i + 1 < items.length && items[i + 1].type === 'walk' && items[i + 1].meta.chain === '1') {
        block.push(items[++i])
      }
      blocks.push(block)
    } else {
      blocks.push([it])
    }
  }
  return blocks
}

function adjacentOk(a: LevelItem[], b: LevelItem[]) {
  return a[a.length - 1].correct !== b[0].correct
}

/** 开局随机洗牌：相邻题正确答案不重复；连跳段保持内部顺序 */
export function shuffleLevelItems(items: LevelItem[]): LevelItem[] {
  const blocks = toBlocks(items)
  if (blocks.length <= 1) return items.map((it) => ({ ...it, meta: { ...it.meta } }))

  for (let attempt = 0; attempt < 48; attempt++) {
    const pool = blocks.slice()
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    let ok = true
    for (let i = 1; i < pool.length; i++) {
      if (!adjacentOk(pool[i - 1], pool[i])) {
        ok = false
        break
      }
    }
    if (ok) return pool.flat().map((it) => ({ ...it, meta: { ...it.meta } }))
  }

  // 兜底：贪心接龙，尽量不与上一块同向
  const remain = blocks.slice()
  const ordered: LevelItem[][] = [remain.splice(Math.floor(Math.random() * remain.length), 1)[0]]
  while (remain.length) {
    const prev = ordered[ordered.length - 1]
    let idx = remain.findIndex((b) => adjacentOk(prev, b))
    if (idx < 0) idx = 0
    ordered.push(remain.splice(idx, 1)[0])
  }
  return ordered.flat().map((it) => ({ ...it, meta: { ...it.meta } }))
}

/** 按 itemId 顺序还原（续局用） */
export function orderLevelItems(items: LevelItem[], order: number[]): LevelItem[] {
  const byId = new Map(items.map((it) => [it.itemId, it]))
  const ranked = order.map((id) => byId.get(id)).filter((it): it is LevelItem => !!it)
  if (ranked.length !== items.length) return shuffleLevelItems(items)
  return ranked.map((it) => ({ ...it, meta: { ...it.meta } }))
}
