export const X = 'X'.charCodeAt(0) // 88
export const O = 'O'.charCodeAt(0) // 79
export const DRAW = '='.charCodeAt(0) // 61
export const EMPTY = 0

export class Action {
  constructor(r = null, c = null, turn = null/*, probability = null*/) {
    this.r = r
    this.c = c
    this.turn = turn
    // this.probability = probability
  }

  isTurnX() {
    return this.turn === X
  }

  isTurnO() {
    return this.turn === O
  }
}
