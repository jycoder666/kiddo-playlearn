import { SENSE_STICKERS } from '../../composables/useSenseStickers'

export interface FriendOfDay {
  id: string
  name: string
  emoji: string
}

const FALLBACK: FriendOfDay = { id: 'bunny', name: '小兔', emoji: '🐰' }

function daySeed(d = new Date()): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

/** 按日稳定抽一只贴纸角色（未解锁也展示默认小兔） */
export function friendOfDay(
  owned: Record<string, boolean>,
  d = new Date(),
): FriendOfDay {
  const unlocked = SENSE_STICKERS.filter((s) => owned[s.id])
  const pool = unlocked.length ? unlocked : [FALLBACK]
  const i = daySeed(d) % pool.length
  const hit = pool[i]!
  return { id: hit.id, name: hit.name, emoji: hit.emoji }
}
