import { reactive } from 'vue'

const KEY = 'kiddo-playlearn:sense-stickers:v1'

export interface SenseStickerDef {
  id: string
  name: string
  emoji: string
}

/** 数感岛贴纸：通关附加玩法/口算等解锁 */
export const SENSE_STICKERS: SenseStickerDef[] = [
  { id: 'digitTap', name: '蹦蹦数字', emoji: '💥' },
  { id: 'spotDiff', name: '火眼金睛', emoji: '👀' },
  { id: 'shadowMatch', name: '影子猎人', emoji: '🌑' },
  { id: 'explore', name: '慢慢看', emoji: '📖' },
  { id: 'eqPick', name: '口算小将', emoji: '🧮' },
  { id: 'colorMix', name: '调色小手', emoji: '🎨' },
  { id: 'worksheet', name: '练习达人', emoji: '📝' },
  { id: 'oddOne', name: '谁不一样', emoji: '🔍' },
  { id: 'shopping', name: '小小采购', emoji: '🛒' },
  { id: 'rhythm', name: '节奏小手', emoji: '🎵' },
  { id: 'softFall', name: '接算式', emoji: '☄️' },
  { id: 'whoMissing', name: '谁来过', emoji: '🙈' },
  { id: 'peekFind', name: '偷看找', emoji: '🕵️' },
  { id: 'orderNums', name: '数字排队', emoji: '📶' },
  { id: 'oddEven', name: '奇偶分家', emoji: '2️⃣' },
  { id: 'magicHat', name: '帽子藏宝', emoji: '🎩' },
  { id: 'eqPair', name: '算式配对', emoji: '➗' },
]

interface State {
  owned: Record<string, boolean>
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { owned: {} }
    const p = JSON.parse(raw)
    return { owned: { ...(p.owned || {}) } }
  } catch {
    return { owned: {} }
  }
}

const state = reactive(load())

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ owned: state.owned }))
  } catch {
    /* ignore */
  }
}

export function unlockSenseSticker(id: string) {
  if (!SENSE_STICKERS.some((s) => s.id === id)) return
  if (state.owned[id]) return
  state.owned[id] = true
  save()
}

export function useSenseStickers() {
  return { owned: state.owned, stickers: SENSE_STICKERS }
}
