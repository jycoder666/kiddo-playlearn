import { useSettings } from './useSettings'

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (ctx) return ctx
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  return ctx
}

function tones(notes: [freq: number, start: number, dur: number][], type: OscillatorType = 'sine', gain = 0.18) {
  if (useSettings().muted) return
  const ac = audio()
  if (!ac) return
  if (ac.state === 'suspended') void ac.resume()
  const now = ac.currentTime
  for (const [freq, start, dur] of notes) {
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.type = type
    osc.frequency.value = freq
    g.gain.setValueAtTime(0, now + start)
    g.gain.linearRampToValueAtTime(gain, now + start + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, now + start + dur)
    osc.connect(g).connect(ac.destination)
    osc.start(now + start)
    osc.stop(now + start + dur + 0.05)
  }
}

export function useSfx() {
  return {
    correct: () => tones([[784, 0, 0.18], [1047, 0.12, 0.3]], 'triangle'),
    gentle: () => tones([[440, 0, 0.22], [392, 0.14, 0.28]], 'sine', 0.12),
    bump: () => tones([[220, 0, 0.15], [247, 0.1, 0.15]], 'sine', 0.12),
    fanfare: () =>
      tones([[523, 0, 0.2], [659, 0.15, 0.2], [784, 0.3, 0.2], [1047, 0.45, 0.5]], 'triangle'),
    tap: () => tones([[660, 0, 0.08]], 'sine', 0.08),
  }
}
