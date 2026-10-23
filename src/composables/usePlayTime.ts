import { computed, reactive } from 'vue'

const KEY = 'kiddo-playlearn:play-time:v1'

interface State {
  /** 累计毫秒（仅数感岛游玩页） */
  ms: number
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ms: 0 }
    const p = JSON.parse(raw)
    return { ms: Math.max(0, Number(p.ms) || 0) }
  } catch {
    return { ms: 0 }
  }
}

const state = reactive(load())

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ms: state.ms }))
  } catch {
    /* ignore */
  }
}

let lastTick = 0
let timer: ReturnType<typeof setInterval> | null = null

/** 在数感玩法页挂载时调用；卸载时停 */
export function startPlayTimeTick() {
  if (timer) return
  lastTick = Date.now()
  timer = setInterval(() => {
    const now = Date.now()
    const dt = now - lastTick
    lastTick = now
    if (dt > 0 && dt < 5000) {
      state.ms += dt
      save()
    }
  }, 15000)
}

export function stopPlayTimeTick() {
  if (!timer) return
  clearInterval(timer)
  timer = null
  const now = Date.now()
  const dt = now - lastTick
  if (dt > 0 && dt < 60000) {
    state.ms += dt
    save()
  }
}

export function usePlayTime() {
  const label = computed(() => {
    const totalMin = Math.floor(state.ms / 60000)
    if (totalMin < 1) return '不到 1 分钟'
    if (totalMin < 60) return `${totalMin} 分钟`
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return m ? `${h} 小时 ${m} 分` : `${h} 小时`
  })
  return { ms: computed(() => state.ms), label }
}
