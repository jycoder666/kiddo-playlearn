export function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 1～10 内分散摆放，尽量不重叠 */
export function scatterPositions(count: number, w = 100, h = 100): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = []
  const pad = 8
  const minDist = count > 6 ? 14 : 18
  for (let n = 0; n < count; n++) {
    let placed = false
    for (let tryN = 0; tryN < 40; tryN++) {
      const x = pad + Math.random() * (w - pad * 2)
      const y = pad + Math.random() * (h - pad * 2)
      if (out.every((p) => Math.hypot(p.x - x, p.y - y) >= minDist)) {
        out.push({ x, y })
        placed = true
        break
      }
    }
    if (!placed) {
      const col = n % 5
      const row = Math.floor(n / 5)
      out.push({ x: 12 + col * 18, y: 18 + row * 28 })
    }
  }
  return out
}

/** 有序拆法 a+b=N，a,b≥1 */
export function bondsOf(n: number): Array<{ a: number; b: number }> {
  const list: Array<{ a: number; b: number }> = []
  for (let a = 1; a < n; a++) list.push({ a, b: n - a })
  return list
}

export function bondKey(a: number, b: number) {
  return `${a}+${b}`
}

/** 易混数字对 */
export const CONFUSE_PAIRS: Record<number, number> = {
  6: 9,
  9: 6,
  2: 5,
  5: 2,
  3: 8,
  8: 3,
}

/** 生成含正确答案的数字选项（保证不重复）；错2次后可缩到2选1 */
export function numberChoices(correct: number, count = 4, narrow = false): number[] {
  const ans = Math.min(10, Math.max(1, Math.round(correct)))
  if (narrow) {
    const other = CONFUSE_PAIRS[ans] ?? (ans === 1 ? 2 : ans - 1)
    return shuffle([ans, other])
  }
  const set = new Set<number>([ans])
  const confuse = CONFUSE_PAIRS[ans]
  if (confuse != null && confuse !== ans) set.add(confuse)
  // 优先贴近答案的干扰项，避免远数字凑数
  const near = [ans - 1, ans + 1, ans - 2, ans + 2, ans - 3, ans + 3]
  for (const n of near) {
    if (set.size >= count) break
    if (n >= 1 && n <= 10) set.add(n)
  }
  while (set.size < count) {
    set.add(randInt(1, 10))
  }
  return shuffle([...set]).slice(0, count)
}
