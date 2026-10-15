import { computed, ref } from 'vue'
import { useSettings } from './useSettings'

const supported =
  typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

const failed = ref(!supported)
const speaking = ref(false)
let voice: SpeechSynthesisVoice | null = null
let watchdog: number | undefined

function pickVoice() {
  const voices = window.speechSynthesis.getVoices()
  voice =
    voices.find((v) => /zh[-_]CN/i.test(v.lang)) ??
    voices.find((v) => /^zh/i.test(v.lang) && !/HK|TW/i.test(v.lang)) ??
    null
}

if (supported) {
  pickVoice()
  window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice)
}

function cancel() {
  if (!supported) return
  window.clearTimeout(watchdog)
  window.speechSynthesis.cancel()
  speaking.value = false
}

function speak(text: string) {
  const settings = useSettings()
  if (!supported || settings.muted || !text) return
  try {
    cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'
    if (voice) u.voice = voice
    u.rate = 0.9
    u.pitch = 1.15
    let started = false
    u.onstart = () => {
      started = true
      speaking.value = true
      failed.value = false
    }
    u.onend = () => (speaking.value = false)
    u.onerror = (e) => {
      speaking.value = false
      if (e.error !== 'interrupted' && e.error !== 'canceled') failed.value = true
    }
    window.speechSynthesis.speak(u)
    // 部分浏览器无报错也不出声：超时视为失败，切图文兜底
    watchdog = window.setTimeout(() => {
      if (!started) failed.value = true
    }, 2500)
  } catch {
    speaking.value = false
    failed.value = true
  }
}

export function useSpeech() {
  const settings = useSettings()
  const iconFallback = computed(() => settings.muted || failed.value)
  return { supported, failed, speaking, iconFallback, speak, cancel }
}
