import { pick, shuffle } from './util'

export type ColorId =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'cyan'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'brown'
  | 'gray'
  | 'black'
  | 'white'

export type ShapeId =
  | 'circle'
  | 'ellipse'
  | 'square'
  | 'rect'
  | 'triangle'
  | 'diamond'
  | 'trapezoid'
  | 'star'

export interface ColorDef {
  id: ColorId
  name: string
  hex: string
}

export interface ShapeDef {
  id: ShapeId
  name: string
}

export const COLORS: ColorDef[] = [
  { id: 'red', name: '红', hex: '#e85d4c' },
  { id: 'orange', name: '橙', hex: '#f08a3a' },
  { id: 'yellow', name: '黄', hex: '#f0c14a' },
  { id: 'green', name: '绿', hex: '#5cb85c' },
  { id: 'cyan', name: '青', hex: '#3db8b0' },
  { id: 'blue', name: '蓝', hex: '#4a90d9' },
  { id: 'purple', name: '紫', hex: '#8e6cc9' },
  { id: 'pink', name: '粉', hex: '#f0a0c0' },
  { id: 'brown', name: '棕', hex: '#a67c52' },
  { id: 'gray', name: '灰', hex: '#9aa0a6' },
  { id: 'black', name: '黑', hex: '#3a3a3a' },
  { id: 'white', name: '白', hex: '#f7f4ef' },
]

export const SHAPES: ShapeDef[] = [
  { id: 'circle', name: '圆' },
  { id: 'ellipse', name: '椭圆' },
  { id: 'square', name: '正方形' },
  { id: 'rect', name: '长方形' },
  { id: 'triangle', name: '三角形' },
  { id: 'diamond', name: '菱形' },
  { id: 'trapezoid', name: '梯形' },
  { id: 'star', name: '五角星' },
]

/** 易混对：出题优先塞干扰 */
export const COLOR_CONFUSE: Partial<Record<ColorId, ColorId[]>> = {
  red: ['orange'],
  orange: ['red', 'yellow'],
  yellow: ['orange'],
  blue: ['cyan'],
  cyan: ['blue', 'green'],
  purple: ['pink'],
  pink: ['purple'],
  gray: ['black'],
  black: ['gray'],
  green: ['cyan'],
}

export const SHAPE_CONFUSE: Partial<Record<ShapeId, ShapeId[]>> = {
  circle: ['ellipse'],
  ellipse: ['circle'],
  square: ['rect'],
  rect: ['square'],
  triangle: ['diamond'],
  diamond: ['triangle', 'square'],
  trapezoid: ['rect'],
  star: ['triangle'],
}

export function colorById(id: ColorId): ColorDef {
  return COLORS.find((c) => c.id === id)!
}

export function shapeById(id: ShapeId): ShapeDef {
  return SHAPES.find((s) => s.id === id)!
}

function fillChoices<T extends string>(
  correct: T,
  all: T[],
  confuse: Partial<Record<T, T[]>>,
  count: number,
): T[] {
  const set = new Set<T>([correct])
  for (const c of confuse[correct] || []) {
    if (set.size >= count) break
    set.add(c)
  }
  const rest = shuffle(all.filter((x) => !set.has(x)))
  for (const x of rest) {
    if (set.size >= count) break
    set.add(x)
  }
  return shuffle([...set])
}

export interface ColorQuizQ {
  kind: 'color'
  answer: ColorId
  choices: ColorId[]
}

export interface ShapeQuizQ {
  kind: 'shape'
  answer: ShapeId
  choices: ShapeId[]
  /** 认图形用中性色，避免颜色干扰 */
  fill: string
}

export interface ComboQuizQ {
  kind: 'combo'
  color: ColorId
  shape: ShapeId
  choices: Array<{ color: ColorId; shape: ShapeId }>
}

export type AttrQuizQ = ColorQuizQ | ShapeQuizQ | ComboQuizQ

export function makeColorQuiz(count = 9): ColorQuizQ[] {
  const ids = shuffle(COLORS.map((c) => c.id))
  const picks = ids.slice(0, Math.min(count, ids.length))
  while (picks.length < count) picks.push(pick(ids))
  return picks.map((answer) => ({
    kind: 'color' as const,
    answer,
    choices: fillChoices(
      answer,
      COLORS.map((c) => c.id),
      COLOR_CONFUSE,
      4,
    ),
  }))
}

export function makeShapeQuiz(count = 9): ShapeQuizQ[] {
  const ids = shuffle(SHAPES.map((s) => s.id))
  const picks = ids.slice(0, Math.min(count, ids.length))
  while (picks.length < count) picks.push(pick(ids))
  const neutral = ['#7a8a99', '#6b7c8a', '#8a9aaa']
  return picks.map((answer, i) => ({
    kind: 'shape' as const,
    answer,
    fill: neutral[i % neutral.length],
    choices: fillChoices(
      answer,
      SHAPES.map((s) => s.id),
      SHAPE_CONFUSE,
      4,
    ),
  }))
}

export function comboLabel(color: ColorId, shape: ShapeId) {
  return `${colorById(color).name}${shapeById(shape).name}`
}

export function makeComboQuiz(count = 9): ComboQuizQ[] {
  const out: ComboQuizQ[] = []
  for (let n = 0; n < count; n++) {
    const color = pick(COLORS).id
    const shape = pick(SHAPES).id
    const choices: Array<{ color: ColorId; shape: ShapeId }> = [{ color, shape }]
    const confColors = COLOR_CONFUSE[color] || []
    const confShapes = SHAPE_CONFUSE[shape] || []
    // 同色异形
    if (confShapes[0]) choices.push({ color, shape: confShapes[0] })
    // 同形异色
    if (confColors[0]) choices.push({ color: confColors[0], shape })
    // 易混色同形 / 随机补齐
    while (choices.length < 4) {
      const c = pick(COLORS).id
      const s = pick(SHAPES).id
      if (choices.some((x) => x.color === c && x.shape === s)) continue
      choices.push({ color: c, shape: s })
    }
    out.push({
      kind: 'combo',
      color,
      shape,
      choices: shuffle(choices.slice(0, 4)),
    })
  }
  return out
}
