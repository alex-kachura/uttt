import React, { Component } from 'react'

import './App.css'
import UltimateTicTacToe from './components/UltimateTicTacToe/UltimateTicTacToe'

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Ultimate Tic-Tac-Toe game</h1>
        </header>
        <main className="App-content">
          <p>
            This is an implementation of AlphaZero player in JavaScript for Ultimate Tic-Tac-Toe game with neural
             network running in the browser. Read more in our blog:{' '}
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
