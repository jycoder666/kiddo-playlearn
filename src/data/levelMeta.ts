export interface LevelMeta {
  id: number
  name: string
  passRate: number
  sticker: string
  stickerEmoji: string
  stickerName: string
  intro?: string
}

export const LEVELS: LevelMeta[] = [
  { id: 1, name: '上下左右', passRate: 0.75, sticker: 'sticker_l1.png', stickerEmoji: '🐾', stickerName: '兔爪贴纸' },
  { id: 2, name: '左手右手', passRate: 0.75, sticker: 'sticker_l2.png', stickerEmoji: '🎈', stickerName: '气球贴纸', intro: '小兔和你一样朝前看' },
  { id: 3, name: '斜着走', passRate: 0.7, sticker: 'sticker_l3.png', stickerEmoji: '↗️', stickerName: '斜箭头贴纸' },
  { id: 4, name: '正中间', passRate: 0.75, sticker: 'sticker_l4.png', stickerEmoji: '🎯', stickerName: '靶心贴纸' },
  { id: 5, name: '东南西北', passRate: 0.7, sticker: 'sticker_l5.png', stickerEmoji: '🧭', stickerName: '指南针贴纸', intro: '地图上面是北' },
]

export const LEVEL_COUNT = LEVELS.length

export function getLevelMeta(id: number): LevelMeta | undefined {
  return LEVELS.find((l) => l.id === id)
}
