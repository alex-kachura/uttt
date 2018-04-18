export const X = 'X'.charCodeAt(0) // 88
export const O = 'O'.charCodeAt(0) // 79
export const DRAW = '='.charCodeAt(0) // 61
export const EMPTY = 0

export class Action {
  constructor(row_index = null, col_index = null, turn = null/*, probability = null*/) {
    this.row_index = row_index
    this.col_index = col_index
    this.turn = turn
    // this.probability = probability
  }

  is_turn_X() {
    return this.turn === X
  }

  is_turn_O() {
    return this.turn === O
  }
}
