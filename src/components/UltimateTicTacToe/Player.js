import random from 'lodash/random'
import indexOf from 'lodash/indexOf'
import * as tf from '@tensorflow/tfjs'

const MODEL_URL = 'http://localhost:3000/model_js_v1/tensorflowjs_model.pb'
const WEIGHTS_URL = 'http://localhost:3000/model_js_v1/weights_manifest.json'

export default class Player {
  constructor(uttt) {
    this.uttt = uttt

    tf.loadFrozenModel(MODEL_URL, WEIGHTS_URL)
      .then((model) => {
        this.model = model
      })
  }

  updateState() {
    this.state = [...this.uttt.state.game]

    const input = this.uttt.getStateAsNdArray()
    this.model.execute({ input })
  }

  getAction() {
    this.updateState()

    const actions = this.uttt.getLegalActions(this.state)

    return actions[random(actions.length - 1)]
  }

  getProbability(index) {
    this.updateState()

    return indexOf(this.uttt.getLegalIndices(this.state), index) > -1 ?
      `${Math.floor(Math.random() * 99) + 1}%` :
      null
  }
}
