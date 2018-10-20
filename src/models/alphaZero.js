import range from 'lodash/range'
import clamp from 'lodash/clamp'
import sum from 'lodash/sum'

import PolicyValueNet from './policyValueNet'
import { torch } from 'environment/mocks'

export class PolicyValue {
  constructor() {
    this.neural_network = PolicyValueNet()
    this.device = torch.device('cpu')
  }

  evaluatePosition(environment) {
    // assuming that neural network already running on CUDA
    const state = environment.get_state_as_numpy()
    // const input_data = torch.from_numpy(state).unsqueeze_(0).to(this.device, torch.float32)
    const input_data = []
    this.neural_network.eval()

    let logits_map
    let state_value
    try {
      torch.set_grad_enabled(false)
    } finally {
      const a = this.neural_network(input_data)
      logits_map = a.logits_map
      state_value = a.state_value
    }

    logits_map = logits_map.cpu().numpy()[0]
    state_value = state_value.cpu().numpy()[0][0]
    // postprocess answer: create probability distribution from logits
    const possible_actions = environment.get_possible_actions()
    const logits = possible_actions.map((action) => logits_map[action.row_index][action.col_index])
    const probas = clamp_action_probas(softmax(logits))

    possible_actions.forEach((action, i) => {
      action.probability = probas[i]
    })

    return {
      possible_actions,
      state_value,
    }
  }

  cuda(gpu_id) {
    let device_str
    let device
    try {
      torch.cuda.device(gpu_id)
    } finally {
      device_str = `cuda:${gpu_id}`
      device = torch.device(device_str)
      this.neural_network.to(device)
      this.device = device
    }
  }

  save_model(path) {
    torch.save(this.neural_network.state_dict(), path)
  }

  load_model(path) {
    this.neural_network.load_state_dict(torch.load(path, 'cpu'))
  }
}


export class Tree {
  constructor(root_node) {
    this.root_node = root_node
  }
}

export class Node {
  constructor(environment, action) {
    this.environment = environment
    this.action = action
    this.child_nodes = []
    this.visit_count = 0
    this.state_value = null
    this.state_value_sum = 0
    this.state_value_mean = 0
  }

  evaluateAndExpand(policy_value) {
    //assigning value to a leaf node
    if (this.environment.isTerminated()) {
      if (this.environment.isResultDraw()) {
        this.state_value = 0
      } else if (this.environment.isResultXWon() || this.environment.isResultOWon()) {
        this.state_value = -1
      } else {
        throw new Error(`unexpected result in leaf_node.environment = ${this.environment}`)
      }
    } else {
      const { possible_actions, state_value } = policy_value.evaluatePosition(this.environment)

      this.state_value = state_value
      possible_actions.forEach((action) => {
        const child_environment = this.environment.clone()
        child_environment.execute(action)
        const child_node = Node(child_environment, action)
        this.child_nodes.push(child_node)
      })
    }
  }

  is_evaluated() {
    return this.state_value !== null
  }

  is_leaf_node() {
    return this.child_nodes.length === 0
  }

  __str__() {
    return [
      'Node:',
      JSON.stringify(this.environment),
      JSON.stringify(this.action),
      `len(child_nodes) = ${this.child_nodes.length}`,
      `visit_count = ${this.visit_count}`,
      `state_value = ${this.state_value}`,
      `state_value_sum = ${this.state_value_sum}`,
      `state_value_mean = ${this.state_value_mean}`,
      `is_evaluated? = ${this.is_evaluated()}`,
      `is_leaf_node? = ${this.is_leaf_node()}`,
      '---Node---\n',
    ].join('\n')
  }
}


const clamp_action_probas = (probas_array, minv = 1e-3, maxv = 0.999) => {
  return probas_array.map((proba) => clamp(proba, minv, maxv))
}


const softmax = (x) => {
  if (x.length === 0) {
    return []
  }

  const maxX = Math.max(x)
  const e_x = x.map((item) => Math.exp(item - maxX))
  return e_x / sum(e_x)
}


const selection_value = (node, exploration_strength, num_moves) => {
  //each node stores values from the perspective of the current player
  const Q = -node.state_value_mean
  const U = exploration_strength * num_moves * node.action.probability / (node.visit_count + 1)

  return Q + U
}


const select_child_node = (node, exploration_strength) => {
  const num_moves = node.child_nodes.length
  const scores = node.child_nodes.map((child_node) => selection_value(child_node, exploration_strength, num_moves))
  const idx = Math.max(scores)

  return node.child_nodes[idx]
}


const backup = (selected_path, state_value) => {
  //backup values upwards the tree
  selected_path.reverse().forEach((node, i) => {
    node.visit_count += 1
    const sign = i & 1 ? -1 : 1
    node.state_value_sum += sign * state_value
    node.state_value_mean = node.state_value_sum / node.visit_count
  })
}


const simulate_game = (policy_value, node, exploration_strength) => {
  //traverse the tree downwards with neural networks' guidance
  const selected_path = []
  while (!node.is_leaf_node()) {
    selected_path.push(node)
    node = select_child_node(node, exploration_strength)
  }
  //node = leaf node
  if (!node.is_evaluated()) {
    node.evaluateAndExpand(policy_value)
  }

  selected_path.push(node)
  //back-propagation
  backup(selected_path, node.state_value)
}


const get_scored_actions = (root_node, temperature = 1) => {
  // computes probability distribution over actions
  const counts = root_node.child_nodes.map((child_node) => child_node.visit_count)
  const oneTemp = 1 / temperature
  const exponentiated_counts = counts.map((count) => Math.pow(count, oneTemp))
  const probas = clamp_action_probas(exponentiated_counts / exponentiated_counts.sum())
  const scored_actions = root_node.child_nodes.map((child_node) => child_node.action)

  scored_actions.forEach((action, i) => {
    action.probability = probas[i]
  })

  return scored_actions
}


export const monteCarloTreeSearch = (policy_value, tree, num_simulations, exploration_strength) => {
  range(1, num_simulations + 1).forEach(() => simulate_game(
    policy_value,
    tree.root_node,
    exploration_strength,
  ))

  return get_scored_actions(tree.root_node)
}
