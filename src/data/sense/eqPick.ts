import { numberChoices, pick, randInt, shuffle } from './util'

export type EqOp = '+' | '−'

export interface EqPickQ {
  a: number
  b: number
  op: EqOp
  answer: number
  choices: number[]
  label: string
}

/** 十以内加减：得数与加数均 ≤ max */
export function makeEqPickQuiz(count = 8, max = 10): EqPickQ[] {
  const out: EqPickQ[] = []
  for (let i = 0; i < count; i++) {
    const op = pick(['+', '−'] as const)
    let a: number
    let b: number
    let answer: number
    if (op === '+') {
      a = randInt(1, Math.max(1, max - 1))
      b = randInt(1, max - a)
      answer = a + b
    } else {
      a = randInt(2, max)
      b = randInt(1, a - 1)
      answer = a - b
    }
    out.push({
      a,
      b,
      op,
      answer,
      choices: numberChoices(answer, 4),
      label: `${a} ${op} ${b}`,
    })
  }
  return shuffle(out)
}
