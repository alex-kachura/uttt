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
const TURN_INDEX = 90
const CONSTRAINT_INDEX = 91
const RESULT_INDEX = 92
const STATE_SIZE = 93
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
      const game = new Array(STATE_SIZE).fill(EMPTY)

      game[TURN_INDEX] = X

      this.state = { game }
    }
  }

  clone() {
    return new UltimateTicTacToe(clone(this.state))
  }

  execute(action) {
    if (this.assertActionLegality(action)) {
      let game = [...this.state.game]
      const { gameIndex, smallGameOffset, smallGameIndex, largeGameIndex } = this.extractIndices(action)
      const mark = game[TURN_INDEX]

      game[gameIndex] = mark
      game = this.updateResult(game, mark, smallGameOffset, largeGameIndex)
      game[TURN_INDEX] = mark === O ? X : O
      game = this.setConstraint(game, smallGameIndex)

      this.setState({ game })
    }
  }

  isTerminated() {
    return this.state.game[RESULT_INDEX]
  }

  isResultXWon() {
    return this.state.game[RESULT_INDEX] === X
  }

  isResultOWon() {
    return this.state.game[RESULT_INDEX] === O
  }

  isResultDraw() {
    return this.state.game[RESULT_INDEX] === DRAW
  }

  isTurnX() {
    return this.state.game[TURN_INDEX] === X
  }

  isTurnO() {
    return this.state.game[TURN_INDEX] === O
  }

  getPossibleActions() {
    return this.getPossibleIndices().map((index) => {
      const { rowIndex, colIndex } = this.convertToRC(index)

      return new Action(rowIndex, colIndex, this.state.game[TURN_INDEX])
    })
  }

  getState() {
    return clone(this.state.game)
  }

  convertToRC(gameIndex) {
    const rowIndex = 3 * (Math.floor(gameIndex / 27)) + Math.floor((gameIndex % 9) / 3)
    const colIndex = 3 * (Math.floor((gameIndex % 27) / 9)) + gameIndex % 3

    return { rowIndex, colIndex }
  }

  extractIndices(action) {
    const smallGameOffset = 27 * (Math.floor(action.rowIndex / 3)) + 9 * (Math.floor(action.colIndex / 3))
    const smallGameIndex = 3 * (action.rowIndex % 3) + action.colIndex % 3
    const gameIndex = smallGameOffset + smallGameIndex
    const largeGameIndex = Math.floor(smallGameOffset / 9)

    return { gameIndex, smallGameOffset, smallGameIndex, largeGameIndex }
  }

  getPossibleIndices() {
    let indices = []

    if (this.state.game[CONSTRAINT_INDEX]) {
      const offset = 9 * (this.state.game[CONSTRAINT_INDEX] - 1)
      indices = this.getEmptyIndices(offset)
    } else {
      range(81, 90).map((s, i) => {
        if (!this.state.game[s]) {
          indices = indices.concat(this.getEmptyIndices(9 * i))
        }
      })
    }

    return indices
  }

  getEmptyIndices(offset) {
    return range(offset, offset + 9).filter(i => !this.state.game[i])
  }

  hasWinningPosition(mark, offset) {
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

  isFull(offset) {
    /* game is considered as full when all positions are taken */
    return indexOf(range(offset, offset + 9).map(i => this.state.game[i] !== 0), 0) > -1
  }

  setConstraint(gameState, gameIndex) {
    const game = [...gameState]

    if (game[gameIndex + 81]) { // if finished
      game[CONSTRAINT_INDEX] = 0 // 0 denotes no constraint
    } else {
      game[CONSTRAINT_INDEX] = gameIndex + 1 // [1..9] means there is constraint
    }

    return game
  }

  updateResult(gameState, mark, smallGameOffset, largeGameIndex) {
    /* result is assigned to a game when either of players won or all positions are taken */
    const game = [...gameState]

    // check small game first
    let updated = false
    if (this.hasWinningPosition(mark, smallGameOffset)) {
      game[largeGameIndex + 81] = mark
      updated = true
    } else if (this.isFull(smallGameOffset)) {
      game[largeGameIndex + 81] = DRAW
      updated = true
    }
    // check large game if it was updated
    if (updated) {
      if (this.hasWinningPosition(mark, 81)) {
        game[RESULT_INDEX] = mark
      } else if (this.isFull(81)) {
        game[RESULT_INDEX] = DRAW
      }
    }

    return game
  }

  assertActionLegality(action) {
    const { gameIndex, /*smallGameOffset, smallGameIndex, */largeGameIndex } = this.extractIndices(action)
    const errors = []

    if (this.isTerminated()) {
      errors.push(`environment is terminated`)
    }
    if (this.state.game[TURN_INDEX] !== action.turn) {
      errors.push(`environment expects action with turn=${this.state.game[TURN_INDEX]}, but selected action has turn=${action.turn}`)
    }
    if (!(0 <= action.rowIndex && action.rowIndex < 9)) {
      errors.push(`rowIndex value = ${action.rowIndex} is out of the scope of the board`)
    }
    if (!(0 <= action.colIndex && action.colIndex < 9)) {
      errors.push(`colIndex value = ${action.colIndex} is out of the scope of the board`)
    }
    if (this.state.game[CONSTRAINT_INDEX] !== 0 && largeGameIndex !== this.state.game[CONSTRAINT_INDEX] - 1) {
      errors.push(`next move is under constraint=${this.state.game[CONSTRAINT_INDEX] -
      1}, but selected action points to ${largeGameIndex}`)
    }
    if (this.state.game[largeGameIndex + 81]) {
      errors.push(`selected sub-game=${largeGameIndex} is finished`)
    }
    if (this.state.game[gameIndex]) {
      errors.push(`cell (rowIndex=${action.rowIndex}, colIndex=${action.colIndex}) is already taken`)
    }

    if (errors.length) {
      errors.map(error => console.log('%c' + error, 'color:#A5003F'))
      return false
    } else {
      return true
    }
  }

  handleCellClick(rowIndex, colIndex) {
    this.execute(new Action(rowIndex, colIndex, this.state.game[TURN_INDEX]))
  }

  render() {
    const { game } = this.state
    const turn = game[TURN_INDEX]
    const constraint = game[CONSTRAINT_INDEX]
    const possibleIndices = this.getPossibleIndices()

    console.log('game:', game)
    console.log('turn:', turn)
    console.log('constraint:', constraint)
    console.log('possible indices:', possibleIndices)
    console.log('isFull:', this.isFull())
    console.log('isTerminated:', this.isTerminated())

    return (
      <div
        className={classnames("big_field field", {
          playerXTurn: turn === X,
          playerOTurn: turn === O
      })}
      >
        {
          game.slice(81, 90).map((v, i) => {
            const { rowIndex: ri, colIndex: ci } = this.convertToRC(i)

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
                  playerX: this.hasWinningPosition(X, i * 9),
                  playerO: this.hasWinningPosition(O, i * 9)
                })}
              >
                <div className="small_field field">
                  {
                    game.slice(i * 9, i * 9 + 9).map((code, j) => {
                      const index = i * 9 + j
                      const { rowIndex, colIndex } = this.convertToRC(index)

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
                            playerX: code === X,
                            playerO: code === O
                          })}
                          onClick={event => this.handleCellClick(rowIndex, colIndex, event)}
                        >
                          {/*{i} {ri} {ci}<br />{v} {code} {index}<br />{j} {rowIndex} {colIndex}*/}
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
