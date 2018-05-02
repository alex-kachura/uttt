import random from 'lodash/random'

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

    return `${index}%`
  }
}
