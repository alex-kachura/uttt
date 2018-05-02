import random from 'lodash/random'
import indexOf from 'lodash/indexOf'

export default class Player {
  constructor(uttt) {
    this.uttt = uttt
  }

  updateState() {
    this.state = [...this.uttt.state.game]
  }

  getAction() {
    this.updateState()

    const actions = this.uttt.getPossibleActions(this.state)

    return actions[random(actions.length - 1)]
  }

  getProbability(index) {
    this.updateState()

    return indexOf(this.uttt.getPossibleIndices(this.state), index) > -1 ? `${index}%` : null
  }
}
