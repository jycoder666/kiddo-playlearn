export type CalcModeId = 'count' | 'match' | 'split' | 'merge' | 'takeaway' | 'eqPick' | 'challenge'
export type RecModeId =
  | 'hello'
  | 'countPick'
  | 'takeN'
  | 'neighbors'
  | 'split'
  | 'family'
  | 'compare'
  | 'challenge'
export type CmpModeId = 'size' | 'length' | 'height' | 'challenge'
export type AttrModeId = 'colorIntro' | 'colorQuiz' | 'shapeIntro' | 'shapeQuiz' | 'combo'
export type ComposeModeId = 'atlas' | 'dissect' | 'assemble'
/** 记忆翻牌线：独立于认一认数字 / 颜色图形 */
export type MemoryModeId = 'numPair' | 'colorPair' | 'shapePair' | 'eqPair'

export interface SenseModeMeta {
  id: string
  name: string
  emoji: string
  blurb: string
}

export const CALC_MODES: SenseModeMeta[] = [
  { id: 'count', name: '点数认数', emoji: '👆', blurb: '点亮每一个，再选数字' },
  { id: 'match', name: '找相同数量', emoji: '👯', blurb: '哪一组一样多？' },
  { id: 'split', name: '分一分', emoji: '✂️', blurb: '一堆分成两堆' },
  { id: 'merge', name: '合并相加', emoji: '➕', blurb: '合起来是多少' },
  { id: 'takeaway', name: '拿走减法', emoji: '➖', blurb: '拿走几个还剩几' },
  { id: 'challenge', name: '快速闯关', emoji: '🏁', blurb: '连续 5 题拿贴纸' },
  /** 始终可进；放链尾避免打乱旧存档解锁下标 */
  { id: 'eqPick', name: '口算接龙', emoji: '🧮', blurb: '看算式，点出得数（无限时）' },
]

export const REC_MODES: SenseModeMeta[] = [
  { id: 'hello', name: '数字来报到', emoji: '👋', blurb: '点大数字看苹果' },
  { id: 'countPick', name: '数一数选数字', emoji: '🔢', blurb: '数完选出数字' },
  { id: 'takeN', name: '按数取物', emoji: '🧺', blurb: '看见数字拿够苹果' },
  { id: 'neighbors', name: '数字邻居', emoji: '↔️', blurb: '前后邻居是谁' },
  { id: 'split', name: '分一分·组成', emoji: '🧩', blurb: '几和几组成它' },
  { id: 'family', name: '加加减减一家人', emoji: '👨‍👩‍👧', blurb: '合拆加减是一家' },
  { id: 'compare', name: '比多少', emoji: '📊', blurb: '多几个？' },
  { id: 'challenge', name: '认一认大闯关', emoji: '⭐', blurb: '混合 5 题巩固' },
]

export const CMP_MODES: SenseModeMeta[] = [
  { id: 'size', name: '比大小', emoji: '⚖️', blurb: '哪个更大？一样大吗？' },
  { id: 'length', name: '比长短', emoji: '📏', blurb: '哪根更长？' },
  { id: 'height', name: '比高低', emoji: '🗼', blurb: '谁更高？谁更矮？' },
  { id: 'challenge', name: '比一比大闯关', emoji: '🏁', blurb: '大小长短高低混合练' },
]

/** 颜色 / 图形线：两路汇合，不并入 REC_UNLOCK_ORDER */
export const ATTR_MODES: SenseModeMeta[] = [
  { id: 'colorIntro', name: '颜色来报到', emoji: '🎨', blurb: '滑卡认识十二种颜色' },
  { id: 'colorQuiz', name: '认颜色', emoji: '🟥', blurb: '看色块，点出名字' },
  { id: 'shapeIntro', name: '图形来报到', emoji: '🔷', blurb: '滑卡认识八种图形' },
  { id: 'shapeQuiz', name: '认图形', emoji: '△', blurb: '看图形，点出名字' },
  { id: 'combo', name: '颜色图形组合', emoji: '🌈', blurb: '红三角形是哪一个？' },
]

/** 拼图形：三模式全开，不依赖其它轨 */
export const COMPOSE_MODES: SenseModeMeta[] = [
  { id: 'atlas', name: '图鉴', emoji: '📖', blurb: '看看大图形能拆成什么' },
  { id: 'dissect', name: '拆一拆', emoji: '✂️', blurb: '大图能分成几块？' },
  { id: 'assemble', name: '拼一拼', emoji: '🧩', blurb: '转一转，拖进轮廓' },
]

/** 记忆翻牌：与 REC / ATTR 进度独立 */
export const MEMORY_MODES: SenseModeMeta[] = [
  { id: 'numPair', name: '数字配对', emoji: '🃏', blurb: '翻牌：数字对上苹果数量' },
  { id: 'colorPair', name: '颜色配对', emoji: '🎨', blurb: '翻牌：找出相同颜色' },
  { id: 'shapePair', name: '图形配对', emoji: '🔷', blurb: '翻牌：找出相同图形' },
  { id: 'eqPair', name: '算式配对', emoji: '➗', blurb: '翻牌：算式对上得数' },
]

/** 认一认附加玩法：热身 / 观察 / 探究 / 续挖 */
export type ExtraModeId =
  | 'digitTap'
  | 'spotDiff'
  | 'shadowMatch'
  | 'explore'
  | 'colorMix'
  | 'oddOne'
  | 'shopping'
  | 'rhythm'
  | 'softFall'
  | 'whoMissing'
  | 'peekFind'
  | 'orderNums'
  | 'oddEven'
  | 'magicHat'

export const EXTRA_MODES: SenseModeMeta[] = [
  { id: 'digitTap', name: '点点出数字', emoji: '💥', blurb: '大钮一点，数字蹦出来' },
  { id: 'spotDiff', name: '找不同', emoji: '👀', blurb: '两边哪里数量不一样？' },
  { id: 'shadowMatch', name: '影子配对', emoji: '🌑', blurb: '影子是哪个图形？' },
  { id: 'explore', name: '探究卡', emoji: '📖', blurb: '慢慢看，想听再点喇叭' },
  { id: 'colorMix', name: '调色', emoji: '🧪', blurb: '点两色，调出目标色' },
  { id: 'oddOne', name: '谁不一样', emoji: '🔍', blurb: '四个里找出不一样的' },
  { id: 'shopping', name: '购物清单', emoji: '🛒', blurb: '记住清单，点够数量' },
  { id: 'rhythm', name: '跟节奏', emoji: '🎵', blurb: '看亮的顺序，照着点' },
  { id: 'softFall', name: '接算式', emoji: '☄️', blurb: '慢慢落下来，点出得数' },
  { id: 'whoMissing', name: '谁来过', emoji: '🙈', blurb: '看一看，谁不见了？' },
  { id: 'peekFind', name: '偷看找', emoji: '🕵️', blurb: '亮一下再盖上，找出它' },
  { id: 'orderNums', name: '数字排队', emoji: '📶', blurb: '从小到大排好队' },
  { id: 'oddEven', name: '奇偶分家', emoji: '2️⃣', blurb: '单数一边，双数一边' },
  { id: 'magicHat', name: '帽子藏宝', emoji: '🎩', blurb: '放进拿出，还剩几？' },
]

/** extra 路由 slug ↔ id */
export const EXTRA_SLUG: Record<ExtraModeId, string> = {
  digitTap: 'digit-tap',
  spotDiff: 'spot-diff',
  shadowMatch: 'shadow-match',
  explore: 'explore',
  colorMix: 'color-mix',
  oddOne: 'odd-one',
  shopping: 'shopping',
  rhythm: 'rhythm',
  softFall: 'soft-fall',
  whoMissing: 'who-missing',
  peekFind: 'peek-find',
  orderNums: 'order-nums',
  oddEven: 'odd-even',
  magicHat: 'magic-hat',
}

export function extraIdFromSlug(slug: string): ExtraModeId | null {
  const hit = (Object.entries(EXTRA_SLUG) as [ExtraModeId, string][]).find(([, s]) => s === slug)
  return hit ? hit[0] : null
}

export const MEMORY_SLUG: Record<MemoryModeId, string> = {
  numPair: 'num-pair',
  colorPair: 'color-pair',
  shapePair: 'shape-pair',
  eqPair: 'eq-pair',
}

export function memoryIdFromSlug(slug: string): MemoryModeId | null {
  const hit = (Object.entries(MEMORY_SLUG) as [MemoryModeId, string][]).find(([, s]) => s === slug)
  return hit ? hit[0] : null
}

/** 认一认地图：附加玩法分区（热身 / 观察 / 玩玩） */
export interface ExtraGroup {
  id: string
  title: string
  blurb: string
  tone: 'warm' | 'eye' | 'play'
  ids: ExtraModeId[]
}

export const EXTRA_GROUPS: ExtraGroup[] = [
  {
    id: 'warmup',
    title: '热身一下',
    blurb: '动手点一点，认识数字',
    tone: 'warm',
    ids: ['digitTap', 'explore'],
  },
  {
    id: 'observe',
    title: '小眼睛',
    blurb: '观察 · 找不同 · 记一记',
    tone: 'eye',
    ids: ['spotDiff', 'shadowMatch', 'oddOne', 'whoMissing', 'peekFind'],
  },
  {
    id: 'play',
    title: '玩玩乐',
    blurb: '调色 · 节奏 · 排队 · 奇偶',
    tone: 'play',
    ids: ['colorMix', 'shopping', 'rhythm', 'orderNums', 'oddEven'],
  },
]

/** 挂在算一算地图的「口算小游戏」（从认一认 extras / 记忆线挑出） */
export interface CalcSideLink {
  id: string
  name: string
  emoji: string
  blurb: string
  path: string
}

export const CALC_SIDE_LINKS: CalcSideLink[] = [
  {
    id: 'eqPick',
    name: '口算接龙',
    emoji: '🧮',
    blurb: '看算式，点出得数',
    path: '/sense/calc/eqPick',
  },
  {
    id: 'eqPair',
    name: '算式配对',
    emoji: '➗',
    blurb: '翻牌：算式对上得数',
    path: '/sense/memory/eq-pair',
  },
  {
    id: 'softFall',
    name: '接算式',
    emoji: '☄️',
    blurb: '慢慢落下来，点出得数',
    path: '/sense/extra/soft-fall',
  },
  {
    id: 'magicHat',
    name: '帽子藏宝',
    emoji: '🎩',
    blurb: '放进拿出，还剩几？',
    path: '/sense/extra/magic-hat',
  },
]

export const CALC_GROUPS: { title: string; blurb: string; ids: CalcModeId[] }[] = [
  { title: '点数与一样多', blurb: '先认数量', ids: ['count', 'match'] },
  { title: '分合加减', blurb: '分开 · 合起来 · 拿走', ids: ['split', 'merge', 'takeaway'] },
  { title: '闯关巩固', blurb: '连续练习拿贴纸', ids: ['challenge'] },
]

export function modesByIds<T extends SenseModeMeta>(all: T[], ids: string[]): T[] {
  return ids
    .map((id) => all.find((m) => m.id === id))
    .filter((m): m is T => !!m)
}

export const CALC_UNLOCK_ORDER = CALC_MODES.map((m) => m.id) as CalcModeId[]
export const REC_UNLOCK_ORDER = REC_MODES.map((m) => m.id) as RecModeId[]
export const CMP_UNLOCK_ORDER = CMP_MODES.map((m) => m.id) as CmpModeId[]
export const COMPOSE_UNLOCK_ORDER = COMPOSE_MODES.map((m) => m.id) as ComposeModeId[]
