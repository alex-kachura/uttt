import * as tf from '@tensorflow/tfjs'

import Player from './Player'
import { monteCarloTreeSearch, Tree, Node } from 'models/alphaZero'

const MODEL_URL = 'http://localhost:3000/model_js_v1/tensorflowjs_model.pb'
const WEIGHTS_URL = 'http://localhost:3000/model_js_v1/weights_manifest.json'

export default class AlphaZeroPlayer extends Player {
  constructor(numSimulations, explorationStrength, policyValue) {
    super()

    this.numSimulations = numSimulations
    this.explorationStrength = explorationStrength
    this.policyValue = policyValue
    this.tree = null

    tf.loadFrozenModel(MODEL_URL, WEIGHTS_URL)
      .then((model) => {
        this.model = model
      })
  }

  getAction(environment) {
    if (!this.tree) {
      this.tree = createTree(environment)
    }

    const scoredActions = monteCarloTreeSearch(
      this.policyValue,
      this.tree,
      this.numSimulations,
      this.explorationStrength,
    )

    const selectedAction = selectFinalAction(scoredActions)

    return {
      selectedAction,
      scoredActions,
    }
  }

  updateKnowledge(environment, takenAction) {
    if (this.tree) {
      const node = findNodeWithTakenAction(this.tree, takenAction)

      if (node) {
        this.tree.root_node = node
      } else {
        this.tree = null
      }
    } else {
      this.tree = createTree(environment)
    }
  }

  getProbabilities(environment) {
    const input = environment.getStateAsNdArray()
    this.model.execute({ input })

    return []
  }
}

const createTree = (environment) => {
  const node = Node(environment.clone())
  return new Tree(node)
}

const selectFinalAction = (actions) => {
  const probs = actions.map((action) => action.probability)
  const idxmax = Math.max(probs)

  return actions[idxmax]
}

const areEqual = (action1, action2) => {
  return action1.rowIndex === action2.rowIndex && action1.colIndex === action2.colIndex
}

const findNodeWithTakenAction = (tree, taken_action) => {
  for (const node in tree.root_node.child_nodes) {
    if (tree.root_node.child_nodes.hasOwnProperty(node)) {
      if (node.action.turn === taken_action.turn) {
        if (areEqual(node.action, taken_action)) {
          return node
        }
      }
    }
  }

  return null
}
