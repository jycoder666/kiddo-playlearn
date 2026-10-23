import { reactive, watch } from 'vue'

const KEY = 'direction-game:settings'

interface Settings {
  muted: boolean
  introSeen: boolean
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    return { muted: false, introSeen: false, ...(raw ? JSON.parse(raw) : {}) }
  } catch {
    return { muted: false, introSeen: false }
  }
}

const settings = reactive<Settings>(load())

watch(settings, () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    /* 存储不可用时仅本次有效 */
  }
})

export function useSettings() {
  return settings
}
