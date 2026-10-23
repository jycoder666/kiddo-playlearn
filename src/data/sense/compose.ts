import { pick, shuffle } from './util'

export type ComposePairId = 'square2tri' | 'rect2tri' | 'square4' | 'eqTri4'
export type PieceKind = 'rtri' | 'square' | 'eqtri'

export interface ComposeSlot {
  id: string
  /** 相对舞台 0～100（拼盘吸附中心） */
  x: number
  y: number
  kind: PieceKind
  /** 允许的规范角（度） */
  angles: number[]
  w: number
  h: number
  /**
   * 图鉴/提示用：相对 outline 的绝对分区多边形，保证边贴边不重叠。
   * 有此字段时预览层铺满 outline 再 clip，不用小盒旋转拼接。
   */
  fillClip?: string
}

export interface ComposePair {
  id: ComposePairId
  title: string
  blurb: string
  speak: string
  answerLabel: string
  outline: 'square' | 'rect' | 'eqtri'
  outlineW: number
  outlineH: number
  slots: ComposeSlot[]
  pieceColors: string[]
}

export const COMPOSE_PAIRS: ComposePair[] = [
  {
    id: 'square2tri',
    title: '正方形',
    blurb: '可以分成两个一样的三角形',
    speak: '正方形可以分成两个一样的三角形',
    answerLabel: '2 个三角形',
    outline: 'square',
    outlineW: 200,
    outlineH: 200,
    pieceColors: ['#f08a3a', '#4a90d9'],
    slots: [
      {
        id: 'a',
        x: 33,
        y: 66,
        kind: 'rtri',
        angles: [0, 180],
        w: 100,
        h: 100,
        fillClip: 'polygon(0% 0%, 100% 100%, 0% 100%)',
      },
      {
        id: 'b',
        x: 67,
        y: 33,
        kind: 'rtri',
        angles: [180, 0],
        w: 100,
        h: 100,
        fillClip: 'polygon(0% 0%, 100% 0%, 100% 100%)',
      },
    ],
  },
  {
    id: 'rect2tri',
    title: '长方形',
    blurb: '也可以分成两个一样的三角形',
    speak: '长方形也可以分成两个一样的三角形',
    answerLabel: '2 个三角形',
    outline: 'rect',
    outlineW: 240,
    outlineH: 140,
    pieceColors: ['#5cb85c', '#8e6cc9'],
    slots: [
      {
        id: 'a',
        x: 33,
        y: 66,
        kind: 'rtri',
        angles: [0, 180],
        w: 120,
        h: 70,
        fillClip: 'polygon(0% 0%, 100% 100%, 0% 100%)',
      },
      {
        id: 'b',
        x: 67,
        y: 33,
        kind: 'rtri',
        angles: [180, 0],
        w: 120,
        h: 70,
        fillClip: 'polygon(0% 0%, 100% 0%, 100% 100%)',
      },
    ],
  },
  {
    id: 'square4',
    title: '大正方形',
    blurb: '可以分成四个小正方形',
    speak: '大正方形可以分成四个小正方形',
    answerLabel: '4 个小正方形',
    outline: 'square',
    outlineW: 200,
    outlineH: 200,
    pieceColors: ['#e85d4c', '#f0c14a', '#3db8b0', '#f0a0c0'],
    /** 2×2 铺满 outline，无缝；吸附中心取各格中点 */
    slots: [
      {
        id: 'tl',
        x: 25,
        y: 25,
        kind: 'square',
        angles: [0, 90, 180, 270],
        w: 100,
        h: 100,
        fillClip: 'polygon(0% 0%, 51% 0%, 51% 51%, 0% 51%)',
      },
      {
        id: 'tr',
        x: 75,
        y: 25,
        kind: 'square',
        angles: [0, 90, 180, 270],
        w: 100,
        h: 100,
        fillClip: 'polygon(49% 0%, 100% 0%, 100% 51%, 49% 51%)',
      },
      {
        id: 'bl',
        x: 25,
        y: 75,
        kind: 'square',
        angles: [0, 90, 180, 270],
        w: 100,
        h: 100,
        fillClip: 'polygon(0% 49%, 51% 49%, 51% 100%, 0% 100%)',
      },
      {
        id: 'br',
        x: 75,
        y: 75,
        kind: 'square',
        angles: [0, 90, 180, 270],
        w: 100,
        h: 100,
        fillClip: 'polygon(49% 49%, 100% 49%, 100% 100%, 49% 100%)',
      },
    ],
  },
  {
    id: 'eqTri4',
    title: '大三角形',
    blurb: '可以分成四个小三角形',
    speak: '大三角形可以分成四个小等边三角形',
    answerLabel: '4 个小三角形',
    outline: 'eqtri',
    outlineW: 220,
    outlineH: 190,
    pieceColors: ['#4a90d9', '#f08a3a', '#5cb85c', '#8e6cc9'],
    /**
     * 大三角顶点 (50% 4%) / (4% 94%) / (96% 94%)，
     * 中点连线：上、中（倒）、左下、右下，互不重叠。
     */
    slots: [
      {
        id: 'top',
        x: 50,
        y: 34,
        kind: 'eqtri',
        angles: [0],
        w: 112,
        h: 98,
        fillClip: 'polygon(50% 4%, 26.5% 50%, 73.5% 50%)',
      },
      {
        id: 'mid',
        x: 50,
        y: 64,
        kind: 'eqtri',
        angles: [180],
        w: 112,
        h: 98,
        fillClip: 'polygon(26.5% 48.5%, 73.5% 48.5%, 50% 94%)',
      },
      {
        id: 'bl',
        x: 27,
        y: 79,
        kind: 'eqtri',
        angles: [0],
        w: 112,
        h: 98,
        fillClip: 'polygon(4% 94%, 27.5% 48.5%, 50.5% 94%)',
      },
      {
        id: 'br',
        x: 73,
        y: 79,
        kind: 'eqtri',
        angles: [0],
        w: 112,
        h: 98,
        fillClip: 'polygon(96% 94%, 72.5% 48.5%, 49.5% 94%)',
      },
    ],
  },
]

export function pairById(id: ComposePairId): ComposePair {
  return COMPOSE_PAIRS.find((p) => p.id === id)!
}

/** 规范到 0～359 */
export function normAngle(deg: number): number {
  return ((Math.round(deg) % 360) + 360) % 360
}

export function angleMatch(current: number, allowed: number[], tol = 8): boolean {
  const c = normAngle(current)
  return allowed.some((a) => {
    const d = Math.min(Math.abs(normAngle(a) - c), 360 - Math.abs(normAngle(a) - c))
    return d <= tol
  })
}

export interface DissectQ {
  pairId: ComposePairId
  answer: string
  choices: string[]
}

export function makeDissectRound(): DissectQ[] {
  /**
   * 选项只描述「分成几块什么形」，不写「正方形/长方形分成…」，
   * 避免问长方形时出现「正方形分成…」这种易混干扰。
   */
  const specific: Record<ComposePairId, string> = {
    square2tri: '2 个三角形',
    rect2tri: '2 个三角形',
    square4: '4 个小正方形',
    eqTri4: '4 个小三角形',
  }
  const extraWrong = ['3 个三角形', '4 个圆', '2 个小正方形', '1 个三角形']
  return shuffle(
    COMPOSE_PAIRS.map((p) => {
      const answer = specific[p.id]
      const pool = shuffle([
        ...Object.values(specific).filter((x) => x !== answer),
        ...extraWrong,
      ])
      const choices = [answer]
      for (const d of pool) {
        if (choices.length >= 4) break
        if (!choices.includes(d)) choices.push(d)
      }
      return {
        pairId: p.id,
        answer,
        choices: shuffle(choices),
      }
    }),
  )
}

/** 拼盘小块外形；eqtri 按角度选用正立/倒立，避免绕盒心旋转导致错位 */
export function pieceClip(kind: PieceKind, angle = 0): string {
  if (kind === 'rtri') return 'polygon(8% 8%, 92% 92%, 8% 92%)'
  if (kind === 'eqtri') {
    const a = normAngle(angle)
    if (a > 90 && a < 270) return 'polygon(6% 8%, 94% 8%, 50% 94%)'
    return 'polygon(50% 6%, 94% 92%, 6% 92%)'
  }
  return 'inset(6% 6% 6% 6%)'
}

export function outlineClip(outline: ComposePair['outline']): string {
  if (outline === 'eqtri') return 'polygon(50% 4%, 96% 94%, 4% 94%)'
  if (outline === 'rect') return 'inset(0)'
  /** 正方形/大方块：不内缩，避免四宫格之间露底缝 */
  return 'inset(0)'
}
