import { reactive } from 'vue'

export type CalcMax = 5 | 10

const KEY = 'kiddo-playlearn:calc-prefs:v1'

interface Prefs {
  /** 口算/练习得数上限：5=一位数优先，10=十以内 */
  max: CalcMax
}

function load(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { max: 10 }
    const p = JSON.parse(raw)
    return { max: p.max === 5 ? 5 : 10 }
  } catch {
    return { max: 10 }
  }
}

const state = reactive(load())

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ max: state.max }))
  } catch {
    /* ignore */
  }
}

export function useCalcPrefs() {
  function setMax(max: CalcMax) {
    state.max = max
    save()
  }
  return { prefs: state, setMax }
}
