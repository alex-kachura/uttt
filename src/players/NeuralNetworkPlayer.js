import * as tf from '@tensorflow/tfjs'

import Player from './Player'

const MODEL_URL = 'http://localhost:3000/model_js_v1/tensorflowjs_model.pb'
const WEIGHTS_URL = 'http://localhost:3000/model_js_v1/weights_manifest.json'

export default class NeuralNetworkPlayer extends Player {
  constructor(policyValue) {
    super()

    this.policyValue = policyValue

    tf.loadFrozenModel(MODEL_URL, WEIGHTS_URL)
      .then((model) => {
        this.model = model
      })
  }

  getAction(environment) {
    const { scoredActions } = this.policyValue.evaluatePosition(environment)
    const selectedAction = selectFinalAction(scoredActions)

    return {
      selectedAction,
      scoredActions,
    }
  }

  getProbabilities(environment) {
    const input = environment.getStateAsNdArray()
    this.model.execute({ input })

    return []
  }
}

const selectFinalAction = (actions) => {
  const probs = actions.map((action) => action.probability)
  const idxmax = Math.max(probs)

  return actions[idxmax]
}
