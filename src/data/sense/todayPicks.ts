export interface TodayPick {
  id: string
  name: string
  emoji: string
  path: string
  blurb: string
}

/** 可推荐的轻松玩法（均始终可进或主岛入口） */
export const TODAY_POOL: TodayPick[] = [
  { id: 'eqPick', name: '口算接龙', emoji: '🧮', path: '/sense/calc/eqPick', blurb: '看算式点得数' },
  { id: 'spotDiff', name: '找不同', emoji: '👀', path: '/sense/extra/spot-diff', blurb: '哪边不一样多' },
  { id: 'shadowMatch', name: '影子配对', emoji: '🌑', path: '/sense/extra/shadow-match', blurb: '影子是谁' },
  { id: 'digitTap', name: '点点出数字', emoji: '💥', path: '/sense/extra/digit-tap', blurb: '大钮蹦数字' },
  { id: 'colorMix', name: '调色', emoji: '🧪', path: '/sense/extra/color-mix', blurb: '两色变一色' },
  { id: 'explore', name: '探究卡', emoji: '📖', path: '/sense/extra/explore', blurb: '慢慢看' },
  { id: 'compose', name: '拼一拼', emoji: '🧩', path: '/sense/compose/assemble', blurb: '拖进轮廓' },
  { id: 'cmpSize', name: '比大小', emoji: '⚖️', path: '/sense/compare/size', blurb: '哪个更大' },
  { id: 'memoryNum', name: '数字配对', emoji: '🃏', path: '/sense/memory/num-pair', blurb: '翻牌配对' },
  { id: 'oddOne', name: '谁不一样', emoji: '🔍', path: '/sense/extra/odd-one', blurb: '找出不一样' },
  { id: 'shopping', name: '购物清单', emoji: '🛒', path: '/sense/extra/shopping', blurb: '记住再点' },
  { id: 'rhythm', name: '跟节奏', emoji: '🎵', path: '/sense/extra/rhythm', blurb: '照着点' },
  { id: 'softFall', name: '接算式', emoji: '☄️', path: '/sense/extra/soft-fall', blurb: '慢慢接住' },
  { id: 'whoMissing', name: '谁来过', emoji: '🙈', path: '/sense/extra/who-missing', blurb: '谁不见了' },
  { id: 'peekFind', name: '偷看找', emoji: '🕵️', path: '/sense/extra/peek-find', blurb: '亮一下找' },
  { id: 'orderNums', name: '数字排队', emoji: '📶', path: '/sense/extra/order-nums', blurb: '从小到大' },
  { id: 'neighbors', name: '数字邻居', emoji: '↔️', path: '/sense/recognize/neighbors', blurb: '前一个后一个' },
  { id: 'eqPair', name: '算式配对', emoji: '➗', path: '/sense/memory/eq-pair', blurb: '算式对得数' },
  { id: 'magicHat', name: '帽子藏宝', emoji: '🎩', path: '/sense/extra/magic-hat', blurb: '放进拿出' },
]

function daySeed(d = new Date()): number {
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  return y * 10000 + m * 100 + day
}

/** 简单可复现洗牌 */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr]
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 48271) % 2147483647
    const j = s % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function picksForToday(count = 3, d = new Date()): TodayPick[] {
  return seededShuffle(TODAY_POOL, daySeed(d)).slice(0, count)
}

export function todayLabel(d = new Date()): string {
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
