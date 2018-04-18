export const X = 'X'.charCodeAt(0) // 88
export const O = 'O'.charCodeAt(0) // 79
export const DRAW = '='.charCodeAt(0) // 61
export const EMPTY = 0

export class Action {
  constructor(rowIndex = null, colIndex = null, turn = null/*, probability = null*/) {
    this.rowIndex = rowIndex
    this.colIndex = colIndex
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
