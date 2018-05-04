import React, { Component, Fragment } from 'react'
import classnames from 'classnames'
import isEmpty from 'lodash/isEmpty'
import range from 'lodash/range'
import indexOf from 'lodash/indexOf'
import every from 'lodash/every'

// import { XWon, OWon, draw } from '../../mocks'
import { Action, X, O, DRAW, EMPTY } from './Action'
import Player from './Player'
import Toggle from '../Toggle/Toggle'
import Modal from '../Modal/Modal'
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
  [O, <i className="fal fa-circle" />],
  [DRAW, <i className="fal fa-handshake" />]
])

let utttKey = 0 // used to remount the React component
let player

export default class UltimateTicTacToe extends Component {
  constructor(...args) {
    super(...args)

    this.state = this.getInitialState()

    this.toggleHints = this.toggleHints.bind(this)
    this.startNewGame = this.startNewGame.bind(this)
    this.openChooseSideModal = this.openChooseSideModal.bind(this)
    this.closeChooseSideModal = this.closeChooseSideModal.bind(this)
    this.openWinnerModal = this.openWinnerModal.bind(this)
    this.closeWinnerModal = this.closeWinnerModal.bind(this)
  }

  getInitialState(playAs = X, isHintsShown = true) {
    const game = new Array(STATE_SIZE).fill(EMPTY)

    game[TURN_INDEX] = X

    return {
      game,
      playAs,
      isHintsShown,
      isChooseSideModalShown: false,
      isWinnerModalShown: false,
      lastIndex: -1
    }
  }

  componentDidMount() {
    player = new Player(this)
  }

  startNewGame() {
    utttKey++
    this.setState(this.getInitialState(this.state.playAs, this.state.isHintsShown), () => {
      if (this.state.playAs === O) {
        this.computerTurn()
      }
    })
  }

  execute(game, action) {
    if (this.assertActionLegality(game, action)) {
      const { gameIndex, smallGameOffset, smallGameIndex, largeGameIndex } = this.extractIndices(action)
      const mark = game[TURN_INDEX]

      game[gameIndex] = mark
      game[TURN_INDEX] = mark === O ? X : O
      this.setResult(game, mark, smallGameOffset, largeGameIndex)
      this.setConstraint(game, smallGameIndex)

      if (gameIndex < 81) {
        this.setState({
          lastIndex: gameIndex
        })
      }

      return game
    } else {
      return false
    }
  }

  isTerminated(game) {
    return game[RESULT_INDEX]
  }

  isResultXWon(game) {
    return game[RESULT_INDEX] === X
  }

  isResultOWon(game) {
    return game[RESULT_INDEX] === O
  }

  isResultDraw(game) {
    return game[RESULT_INDEX] === DRAW
  }

  isTurnX(game) {
    return game[TURN_INDEX] === X
  }

  isTurnO(game) {
    return game[TURN_INDEX] === O
  }

  getPossibleActions(game) {
    return this.getPossibleIndices(game).map((index) => {
      const { rowIndex, colIndex } = this.convertToRC(index)

      return new Action(rowIndex, colIndex, this.state.game[TURN_INDEX])
    })
  }

  convertToRC(index) {
    const rowIndex = 3 * (Math.floor(index / 27)) + Math.floor((index % 9) / 3)
    const colIndex = 3 * (Math.floor((index % 27) / 9)) + index % 3

    return { rowIndex, colIndex }
  }

  extractIndices(action) {
    const smallGameOffset = 27 * (Math.floor(action.rowIndex / 3)) + 9 * (Math.floor(action.colIndex / 3))
    const smallGameIndex = 3 * (action.rowIndex % 3) + action.colIndex % 3
    const gameIndex = smallGameOffset + smallGameIndex
    const largeGameIndex = Math.floor(smallGameOffset / 9)

    return { gameIndex, smallGameOffset, smallGameIndex, largeGameIndex }
  }

  getPossibleIndices(game) {
    let indices = []

    if (game[CONSTRAINT_INDEX]) {
      const offset = 9 * (game[CONSTRAINT_INDEX] - 1)

      indices = this.getEmptyIndices(game, offset)
    } else {
      range(81, 90).forEach((v, i) => {
        if (game[v] === EMPTY) {
          indices = indices.concat(this.getEmptyIndices(game, 9 * i))
        }
      })
    }

    return indices
  }

  getEmptyIndices(game, offset) {
    return range(offset, offset + 9).filter(i => game[i] === EMPTY)
  }

  hasWinningPosition(game, mark, offset) {
    return !!this.getLineIndices(game, mark, offset).length
  }

  /* this method checks whether given state has winning position and returns them as an array */
  getLineIndices(game, mark, offset) {
    const result = []

    if (mark === game[offset + 4]) {
      if (mark === game[offset + 0] && mark === game[offset + 8]) result.push(offset + 4, offset + 0, offset + 8)
      if (mark === game[offset + 2] && mark === game[offset + 6]) result.push(offset + 4, offset + 2, offset + 6)
      if (mark === game[offset + 1] && mark === game[offset + 7]) result.push(offset + 4, offset + 1, offset + 7)
      if (mark === game[offset + 3] && mark === game[offset + 5]) result.push(offset + 4, offset + 3, offset + 5)
    }
    if (mark === game[offset + 0]) {
      if (mark === game[offset + 1] && mark === game[offset + 2]) result.push(offset + 0, offset + 1, offset + 2)
      if (mark === game[offset + 3] && mark === game[offset + 6]) result.push(offset + 0, offset + 3, offset + 6)
    }
    if (mark === game[offset + 8]) {
      if (mark === game[offset + 2] && mark === game[offset + 5]) result.push(offset + 8, offset + 2, offset + 5)
      if (mark === game[offset + 6] && mark === game[offset + 7]) result.push(offset + 8, offset + 6, offset + 7)
    }

    return result
  }

  /* game is considered as full when all positions are taken */
  isFull(game, offset) {
    return every(range(offset, offset + 9), i => game[i] !== EMPTY)
  }

  setConstraint(game, index) {
    if (game[81 + index]) { // if finished
      game[CONSTRAINT_INDEX] = 0 // 0 denotes no constraint
    } else {
      game[CONSTRAINT_INDEX] = index + 1 // [1..9] means there is constraint
    }

    const offset = (game[CONSTRAINT_INDEX] - 1) * 9

    if (this.hasWinningPosition(game, X, offset) || this.hasWinningPosition(game, O, offset)) {
      game[CONSTRAINT_INDEX] = 0
    }
  }

  /* result is assigned to a game when either of players won or all positions are taken */
  setResult(game, mark, smallGameOffset, largeGameIndex) {
    // check small game
    if (this.hasWinningPosition(game, mark, smallGameOffset)) {
      game[81 + largeGameIndex] = mark
    } else if (this.isFull(game, smallGameOffset)) {
      game[81 + largeGameIndex] = DRAW
    }
    // check large game
    if (this.hasWinningPosition(game, mark, 81)) {
      game[RESULT_INDEX] = mark
    } else if (this.isFull(game, 81)) {
      game[RESULT_INDEX] = DRAW
    }
  }

  assertActionLegality(game, action) {
    if (isEmpty(action)) {
      return false
    }

    const { gameIndex, largeGameIndex } = this.extractIndices(action)
    const errors = []

    if (this.isTerminated(game)) {
      errors.push(`environment is terminated`)
    }
    if (game[TURN_INDEX] !== action.turn) {
      errors.push(`environment expects action with turn=${game[TURN_INDEX]}, but selected action has turn=${action.turn}`)
    }
    if (!(0 <= action.rowIndex && action.rowIndex < 9)) {
      errors.push(`rowIndex value = ${action.rowIndex} is out of the scope of the board`)
    }
    if (!(0 <= action.colIndex && action.colIndex < 9)) {
      errors.push(`colIndex value = ${action.colIndex} is out of the scope of the board`)
    }
    if (game[CONSTRAINT_INDEX] !== 0 && largeGameIndex !== game[CONSTRAINT_INDEX] - 1) {
      errors.push(`next move is under constraint=${game[CONSTRAINT_INDEX] -
      1}, but selected action points to ${largeGameIndex}`)
    }
    if (game[81 + largeGameIndex]) {
      errors.push(`selected sub-game=${largeGameIndex} is finished`)
    }
    if (game[gameIndex]) {
      errors.push(`cell (rowIndex=${action.rowIndex}, colIndex=${action.colIndex}) is already taken`)
    }

    errors.map(error => console.log('%c' + error, 'color:#990033'))

    return !errors.length
  }

  playAs(playAs) {
    this.setState({ playAs }, this.startNewGame)
  }

  handleCellClick(rowIndex, colIndex) {
    let game = [...this.state.game]
    const action = new Action(rowIndex, colIndex, game[TURN_INDEX])

    if (this.isTerminated(game)) this.openWinnerModal()

    game = this.execute(game, action)

    if (game) {
      this.setState({ game }, this.computerTurn)
      if (this.isTerminated(game)) this.openWinnerModal()
    }
  }

  computerTurn() {
    let game = [...this.state.game]
    const action = player.getAction()

    game = this.execute(game, action)

    if (game) {
      this.setState({ game })
      if (this.isTerminated(game)) this.openWinnerModal()
    }
  }

  toggleHints() {
    this.setState({ isHintsShown: !this.state.isHintsShown })
  }

  openChooseSideModal() {
    this.setState({ isChooseSideModalShown: true })
  }

  closeChooseSideModal() {
    this.setState({ isChooseSideModalShown: false });
  }

  openWinnerModal() {
    this.setState({ isWinnerModalShown: true })
  }

  closeWinnerModal() {
    this.setState({ isWinnerModalShown: false });
  }

  render() {
    const { game, isHintsShown, isWinnerModalShown, isChooseSideModalShown, lastIndex } = this.state
    const turn = game[TURN_INDEX]
    const result = game[RESULT_INDEX]
    const isTerminated = this.isTerminated(game)
    const possibleIndices = this.getPossibleIndices(game)

    return (
      <div className="uttt" key={utttKey}>
        <button className="btn btn-primary" onClick={this.openChooseSideModal}>New Game</button>

        <div
          className={classnames("game big-field field", {
            playerXTurn: turn === X,
            playerOTurn: turn === O,
            finished: isTerminated
          })}
        >
          {
            game.slice(81, 90).map((v, i) => {
              return (
                <div
                  key={i}
                  className={classnames("big-cell cell", {
                    top: i < 3,
                    middle: 3 <= i && i < 6,
                    bottom: 6 <= i,
                    left: !(i % 3),
                    center: !((i - 1) % 3),
                    right: !((i - 2) % 3),
                    playerX: v === X,
                    playerO: v === O,
                    draw: v === DRAW
                  })}
                >
                  <div className="small-field field">
                    {
                      game.slice(i * 9, i * 9 + 9).map((w, j) => {
                        const index = i * 9 + j
                        const { rowIndex, colIndex } = this.convertToRC(index)

                        return (
                          <div
                            key={index}
                            className={classnames("small-cell cell", {
                              top: j < 3,
                              middle: 3 <= j && j < 6,
                              bottom: 6 <= j,
                              left: !(j % 3),
                              center: !((j - 1) % 3),
                              right: !((j - 2) % 3),
                              possible: !isTerminated && indexOf(possibleIndices, index) > -1,
                              playerX: v === EMPTY && w === X,
                              playerO: v === EMPTY && w === O,
                              lastPlayed: index === lastIndex
                            })}
                            onClick={() => this.handleCellClick(rowIndex, colIndex)}
                          >
                            {mapCodeToIcon.get(w) || (isHintsShown && !isTerminated && player && player.getProbability(index)) || null}
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

        <Toggle checked={isHintsShown} onChange={this.toggleHints}>Show AI hints</Toggle>

        <Modal className="winner-modal" isShown={isWinnerModalShown} onClose={this.closeWinnerModal}>
          {
            result === DRAW ?
              <Fragment>Draw!</Fragment> :
              <Fragment>{mapCodeToIcon.get(result)} wins!</Fragment>
          }
        </Modal>

        <Modal className="choose-side-modal" isShown={isChooseSideModalShown} onClose={this.closeChooseSideModal}>
          <button className="btn play-as play-as-X" onClick={() => this.playAs(X)}>
            Play as {mapCodeToIcon.get(X)}</button>
          <button className="btn play-as play-as-O" onClick={() => this.playAs(O)}>
            Play as {mapCodeToIcon.get(O)}</button>
        </Modal>
      </div>
    )
  }
}
