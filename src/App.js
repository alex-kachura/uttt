import React, { Component } from 'react'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faToggleOff, faToggleOn } from '@fortawesome/pro-regular-svg-icons'
import { faCircle, faHandshake, faTimes } from '@fortawesome/pro-light-svg-icons'

import './App.css'
import UltimateTicTacToe from './components/UltimateTicTacToe/UltimateTicTacToe'

library.add(faToggleOn, faToggleOff, faTimes, faCircle, faHandshake)

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Ultimate Tic-Tac-Toe</h1>
        </header>
        <main className="App-content">
          <p>
            This is an implementation of the AlphaZero player in JavaScript for the Ultimate Tic-Tac-Toe game with a
            neural network running in the browser. Read more in our blog:{' '}
            <a
              href="https://blog.deepsense.ai/"
              target="_blank"
              rel="noopener noreferrer"
            >{'https://blog.deepsense.ai/'}</a>
          </p>
          <UltimateTicTacToe />
        </main>
      </div>
    )
  }
}

export default App
