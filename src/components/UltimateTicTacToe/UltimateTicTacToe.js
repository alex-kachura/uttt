import React, { Component } from 'react'
import classnames from 'classnames'
import range from 'lodash/range'
import clone from 'lodash/clone'
import indexOf from 'lodash/indexOf'

import { Action, X, O, DRAW, EMPTY } from './Action'
import './UltimateTicTacToe.css'

// state encoding:
// [0..80] - small games
// [81..89] - large game
const _TURN_INDEX = 90
const _CONSTRAINT_INDEX = 91
const _RESULT_INDEX = 92
const _STATE_SIZE = 93
const mapCodeToIcon = new Map([
  [X, <i className="fal fa-times" />],
  [O, <i className="fal fa-circle" />]
])

export default class UltimateTicTacToe extends Component {
  constructor(...args) {
    super(...args)

    if (args.state) {
      this.state = args.state
    } else {
      const game = new Array(_STATE_SIZE).fill(EMPTY)

      game[_TURN_INDEX] = X

      this.state = { game }
    }
  }

  clone() {
    return new UltimateTicTacToe(clone(this.state))
  }

  execute(action) {
    this._assert_action_legality(action)

    const game = [...this.state.game]
    const { game_index, small_game_offset, small_game_index, large_game_index } = this._extract_indices(action)
    const mark = game[_TURN_INDEX]

    game[game_index] = mark

    //update result
    // check small game first
    let updated = false
    if (this._has_winning_position(mark, small_game_offset)) {
      game[large_game_index + 81] = mark
      updated = true
    } else if (this._is_full(small_game_offset)) {
      game[large_game_index + 81] = DRAW
      updated = true
    }
    // check large game if it was updated
    if (updated) {
      if (this._has_winning_position(mark, 81)) {
        game[_RESULT_INDEX] = mark
      } else if (this._is_full(81)) {
        game[_RESULT_INDEX] = DRAW
      }
    }

    game[_TURN_INDEX] = mark === O ? X : O

    // set constraint
    if (game[large_game_index + 81]) { // if finished
      game[_CONSTRAINT_INDEX] = 0 // 0 denotes no constraint
    } else {
      game[_CONSTRAINT_INDEX] = large_game_index + 1 // [1..9] means there is constraint
    }


    this.setState({ game })
  }

  is_terminated() {
    return this.state.game[_RESULT_INDEX]
  }

  is_result_X_won() {
    return this.state.game[_RESULT_INDEX] === X
  }

  is_result_O_won() {
    return this.state.game[_RESULT_INDEX] === O
  }

  is_result_draw() {
    return this.state.game[_RESULT_INDEX] === DRAW
  }

  is_turn_X() {
    return this.state.game[_TURN_INDEX] === X
  }

  is_turn_O() {
    return this.state.game[_TURN_INDEX] === O
  }

  get_possible_actions() {
    return this._get_possible_indices().map((index) => {
      const { row_index, col_index } = this._convert_to_rc(index)

      return new Action(row_index, col_index, this.state.game[_TURN_INDEX])
    })
  }

  get_state() {
    return clone(this.state.game)
  }

  _convert_to_rc(game_index) {
    const row_index = 3 * (Math.floor(game_index / 27)) + Math.floor((game_index % 9) / 3)
    const col_index = 3 * (Math.floor((game_index % 27) / 9)) + game_index % 3

    return { row_index, col_index }
  }

  _extract_indices(action) {
    const small_game_offset = 27 * (Math.floor(action.row_index / 3)) + 9 * (Math.floor(action.col_index / 3))
    const small_game_index = 3 * (action.row_index % 3) + action.col_index % 3
    const game_index = small_game_offset + small_game_index
    const large_game_index = Math.floor(small_game_offset / 9)

    return { game_index, small_game_offset, small_game_index, large_game_index }
  }

  _get_possible_indices() {
    let indices = []

    if (this.state.game[_CONSTRAINT_INDEX]) {
      const offset = 9 * (this.state.game[_CONSTRAINT_INDEX] - 1)
      indices = this._get_empty_indices(offset)
    } else {
      range(81, 90).map((s, i) => {
        if (!this.state.game[s]) {
          indices = indices.concat(this._get_empty_indices(9 * i))
        }
      })
    }

    return indices
  }

  _get_empty_indices(offset) {
    return range(offset, offset + 9).filter(i => !this.state.game[i])
  }

  _has_winning_position(mark, offset) {
    /* this method checks whether given state has winning position */
    const s = this.state.game
    return (
        mark === s[offset + 4] &&
        (
          mark === s[offset + 0] === s[offset + 8] ||
          mark === s[offset + 2] === s[offset + 6] ||
          mark === s[offset + 1] === s[offset + 7] ||
          mark === s[offset + 3] === s[offset + 5]
        )
      ) ||
      (
        mark === s[offset + 0] &&
        (
          mark === s[offset + 1] === s[offset + 2] ||
          mark === s[offset + 3] === s[offset + 6]
        )
      ) ||
      (
        mark === s[offset + 8] &&
        (
          mark === s[offset + 2] === s[offset + 5] ||
          mark === s[offset + 6] === s[offset + 7]
        )
      )
  }

  _is_full(offset) {
    /* game is considered as full when all positions are taken */
    return range(offset, offset + 9).every(i => !!this.state.game[i])
  }

  _set_constraint(large_game_index) {
    const game = [...this.state.game]

    if (game[large_game_index + 81]) { // if finished
      game[_CONSTRAINT_INDEX] = 0 // 0 denotes no constraint
    } else {
      game[_CONSTRAINT_INDEX] = large_game_index + 1 // [1..9] means there is constraint
    }

    this.setState({ game })
  }

  _update_result(mark, small_game_offset, large_game_index) {
    /* result is assigned to a game when either of players won or all positions are taken */
    const game = [...this.state.game]

    // check small game first
    let updated = false
    if (this._has_winning_position(mark, small_game_offset)) {
      game[large_game_index + 81] = mark
      updated = true
    } else if (this._is_full(small_game_offset)) {
      game[large_game_index + 81] = DRAW
      updated = true
    }
    // check large game if it was updated
    if (updated) {
      if (this._has_winning_position(mark, 81)) {
        game[_RESULT_INDEX] = mark
      } else if (this._is_full(81)) {
        game[_RESULT_INDEX] = DRAW
      }
    }

    this.setState({ game })
  }

  _assert_action_legality(action) {
    const { game_index, /*small_game_offset, small_game_index, */large_game_index } = this._extract_indices(action)

    if (this.is_terminated()) {
      console.error(`environment is terminated`)
    }
    if (this.state.game[_TURN_INDEX] !== action.turn) {
      console.error(`environment expects action with turn=${this.state.game[_TURN_INDEX]}, but selected action has turn=${action.turn}`)
    }
    if (!(0 <= action.row_index && action.row_index < 9)) {
      console.error(`row_index value = ${action.row_index} is out of the scope of the board`)
    }
    if (!(0 <= action.col_index && action.col_index < 9)) {
      console.error(`col_index value = ${action.col_index} is out of the scope of the board`)
    }
    if (this.state.game[_CONSTRAINT_INDEX] !== 0 && !large_game_index === this.state.game[_CONSTRAINT_INDEX] - 1) {
      console.error(`next move is under following constraint=${this.state.game[_CONSTRAINT_INDEX] - 1}, but selected action points to ${large_game_index}`)
    }
    if (this.state.game[large_game_index + 81]) {
      console.error(`selected subgame=${large_game_index} is finished`)
    }
    if (this.state.game[game_index]) {
      console.error(`(row_index=${action.row_index}, col_index=${action.col_index}) is already taken`)
    }
  }

  handleCellClick(row_index, col_index) {
    this.execute(new Action(row_index, col_index, this.state.game[_TURN_INDEX]))
  }

  render() {
    const { game } = this.state
    const possibleIndices = this._get_possible_indices()

    console.log('state:', game)
    console.log('_CONSTRAINT_INDEX:', game[_CONSTRAINT_INDEX])
    console.log('_TURN_INDEX:', game[_TURN_INDEX])
    console.log('possible indices:', possibleIndices)
    console.log('is_full:', this._is_full())
    console.log('is_terminated:', this.is_terminated())
    console.log('has_winning_position:', this._has_winning_position(X, 0))

    return (
      <div className="big_field field">
        {
          game.slice(81, 90).map((v, i) => {
            const { row_index: ri, col_index: ci } = this._convert_to_rc(i)

            return (
              <div
                key={i}
                className={classnames("big_cell cell", {
                  top: i < 3,
                  middle: 3 <= i && i < 6,
                  bottom: 6 <= i,
                  left: !(i % 3),
                  center: !((i - 1) % 3),
                  right: !((i - 2) % 3),
                  possible: false,
                  player1: v === X,
                  player2: v === O
                })}
              >
                <div className="small_field field">
                  {
                    game.slice(i * 9, i * 9 + 9).map((code, j) => {
                      const index = i * 9 + j
                      const { row_index, col_index } = this._convert_to_rc(index)

                      return (
                        <div
                          key={index}
                          className={classnames("small_cell cell", {
                            top: j < 3,
                            middle: 3 <= j && j < 6,
                            bottom: 6 <= j,
                            left: !(j % 3),
                            center: !((j - 1) % 3),
                            right: !((j - 2) % 3),
                            possible: indexOf(possibleIndices, index) > -1,
                            player1: code === X,
                            player2: code === O
                          })}
                          onClick={event => this.handleCellClick(row_index, col_index, event)}
                        >
                          {/*{i} {ri} {ci}<br />{v} {code} {index}<br />{j} {row_index} {col_index}*/}
                          {mapCodeToIcon.get(code) || null}
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            )
          })
        }
      </div>
    )
  }
}
