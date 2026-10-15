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

export const CALC_UNLOCK_ORDER = CALC_MODES.map((m) => m.id) as CalcModeId[]
export const REC_UNLOCK_ORDER = REC_MODES.map((m) => m.id) as RecModeId[]
