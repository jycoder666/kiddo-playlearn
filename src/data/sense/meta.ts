export type CalcModeId = 'count' | 'match' | 'split' | 'merge' | 'takeaway' | 'challenge'
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
export type MemoryModeId = 'numPair'

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
]

export const CALC_UNLOCK_ORDER = CALC_MODES.map((m) => m.id) as CalcModeId[]
export const REC_UNLOCK_ORDER = REC_MODES.map((m) => m.id) as RecModeId[]
export const CMP_UNLOCK_ORDER = CMP_MODES.map((m) => m.id) as CmpModeId[]
export const COMPOSE_UNLOCK_ORDER = COMPOSE_MODES.map((m) => m.id) as ComposeModeId[]
