import { O, X } from './marks'

export default class Action {
  constructor(r = null, c = null, turn = null, probability = null) {
    this.r = r
    this.c = c
    this.turn = turn
    this.probability = probability
  }

  isTurnX() {
    return this.turn === X
  }

  isTurnO() {
    return this.turn === O
  }
}
