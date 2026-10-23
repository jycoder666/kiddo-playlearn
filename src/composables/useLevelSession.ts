import { computed, ref } from 'vue'
import type { LevelItem } from '../data/levels'
import type { IncompleteRun, Outcome } from './useProgress'

/**
 * 关卡内状态机：Presenting/AwaitingAnswer → Correct | Hint1 | Hint2 | Demo → Next | LevelResult
 * wrongCount 0/1/2 对应 出题/纠错1阶(重说)/纠错2阶(高亮)；第 3 次错进入 Demo。
 * 自主答对 = 未到高亮阶即答对（重听后答对仍算自主）。
 */
export type Phase = 'awaiting' | 'correct' | 'demo' | 'result'

export function useLevelSession(items: LevelItem[], passRate: number, resume: IncompleteRun | null) {
  const index = ref(resume ? Math.min(resume.itemIndex, items.length) : 0)
  const answers = ref<Outcome[]>(resume ? [...resume.answers] : [])
  const demoCount = ref(resume?.demoCount ?? 0)
  const wrongCount = ref(0)
  const phase = ref<Phase>(index.value >= items.length ? 'result' : 'awaiting')

  const current = computed(() => items[index.value])
  const total = computed(() => items.length)

  function answer(code: string): 'correct' | 'wrong' | 'demo' | 'ignored' {
    if (phase.value !== 'awaiting' || !current.value) return 'ignored'
    if (code === current.value.correct) {
      answers.value.push(wrongCount.value <= 1 ? 'self' : 'helped')
      phase.value = 'correct'
      return 'correct'
    }
    wrongCount.value++
    if (wrongCount.value >= 3) {
      answers.value.push('demo')
      demoCount.value++
      phase.value = 'demo'
      return 'demo'
    }
    return 'wrong'
  }

  function next() {
    if (phase.value !== 'correct' && phase.value !== 'demo') return
    index.value++
    wrongCount.value = 0
    phase.value = index.value >= total.value ? 'result' : 'awaiting'
  }

  function restart() {
    index.value = 0
    answers.value = []
    demoCount.value = 0
    wrongCount.value = 0
    phase.value = 'awaiting'
  }

  const selfCount = computed(() => answers.value.filter((a) => a === 'self').length)
  const selfRate = computed(() => (total.value ? selfCount.value / total.value : 0))
  const passed = computed(() => selfRate.value >= passRate)
  const stars = computed(() => {
    if (answers.value.length < total.value) return 0
    if (selfRate.value >= 0.9 && demoCount.value <= 1) return 3
    if (passed.value) return 2
    return 1
  })

  const snapshot = (levelId: number, extra?: Partial<IncompleteRun>): IncompleteRun => ({
    levelId,
    itemIndex: answers.value.length,
    answers: answers.value,
    demoCount: demoCount.value,
    order: items.map((it) => it.itemId),
    ...extra,
  })

  return {
    index, answers, demoCount, wrongCount, phase, current, total,
    selfCount, selfRate, passed, stars,
    answer, next, restart, snapshot,
  }
}
