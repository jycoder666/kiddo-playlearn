import type { ItemType } from './levels'

/** 九宫格按行排列：左上 上 右上 / 左 中 右 / 左下 下 右下 */
export const GRID_ORDER = ['LU', 'U', 'RU', 'L', 'C', 'R', 'LD', 'D', 'RD'] as const

export const DIR_LABEL: Record<string, string> = {
  U: '上', D: '下', L: '左', R: '右',
  LU: '左上', RU: '右上', LD: '左下', RD: '右下',
  C: '正中间',
}

export const DIR_VEC: Record<string, [number, number]> = {
  U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0],
  LU: [-1, -1], RU: [1, -1], LD: [-1, 1], RD: [1, 1],
  C: [0, 0],
}

export const DIR_ANGLE: Record<string, number> = {
  U: 0, RU: 45, R: 90, RD: 135, D: 180, LD: 225, L: 270, LU: 315,
}

export const BODY_LABEL: Record<string, string> = {
  hand_L: '左手', hand_R: '右手', ear_L: '左耳朵', ear_R: '右耳朵',
}

/** 北↑固定：东=右、西=左、南=下、中=家 */
export const MAP_LABEL: Record<string, string> = { E: '东', S: '南', W: '西', N: '北', C: '中' }

/** L5 纠错提示：按本题方位给对应说法 */
export const MAP_HINT: Record<string, string> = {
  N: '北在上面', S: '南在下面', E: '东在右边', W: '西在左边', C: '家在正中间',
}

/** L5 地标名（反向找物） */
export const LANDMARK_LABEL: Record<string, string> = {
  school: '学校', lake: '湖', home: '家', shop: '商店', park: '公园',
}

/** 3×3 中的列/行（0..2），中格为 [1,1] */
export function cellOf(code: string): [number, number] {
  const [dx, dy] = DIR_VEC[code] ?? [0, 0]
  return [1 + dx, 1 + dy]
}

export function answerLabel(type: ItemType, code: string): string {
  if (type === 'map') return MAP_LABEL[code] ?? code
  if (type === 'mapfind') return LANDMARK_LABEL[code] ?? code
  if (type === 'body') return BODY_LABEL[code] ?? code
  return DIR_LABEL[code] ?? code
}

/** map / mapfind 纠错时用的方位提示键 */
export function mapHintKey(type: ItemType, correct: string, meta: Record<string, string>): string {
  if (type === 'mapfind') return meta.dir || 'N'
  return correct
}
