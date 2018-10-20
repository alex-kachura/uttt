import random from 'lodash/random'

import Player from './Player'

export default class RandomPlayer extends Player {
  getAction(environment) {
    const actions = environment.getLegalActions(environment.state.game)

    return actions[random(actions.length - 1)]
  }
}
