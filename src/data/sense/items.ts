/** 计数物皮肤：有 PNG 用图，否则 emoji 占位（用户后续补 assets/art/） */
export type ItemSkin = 'apple' | 'banana' | 'carrot' | 'bunny' | 'chick' | 'bear'

export interface ItemSkinDef {
  id: ItemSkin
  emoji: string
  file: string
  label: string
}

export const ITEM_SKINS: ItemSkinDef[] = [
  { id: 'apple', emoji: '🍎', file: 'item_apple.png', label: '苹果' },
  { id: 'banana', emoji: '🍌', file: 'item_banana.png', label: '香蕉' },
  { id: 'carrot', emoji: '🥕', file: 'item_carrot.png', label: '胡萝卜' },
  { id: 'bunny', emoji: '🐰', file: 'item_bunny.png', label: '小兔' },
  { id: 'chick', emoji: '🐥', file: 'item_chick.png', label: '小鸡' },
  { id: 'bear', emoji: '🐻', file: 'item_bear.png', label: '小熊' },
]

export function getSkin(id?: ItemSkin): ItemSkinDef {
  return ITEM_SKINS.find((s) => s.id === id) ?? ITEM_SKINS[0]
}

export function randomSkin(): ItemSkinDef {
  return ITEM_SKINS[Math.floor(Math.random() * ITEM_SKINS.length)]
}
