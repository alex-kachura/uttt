import React, { Component } from 'react'

import logo from './deepsense.webp'
import './App.css'
import UltimateTicTacToe from './components/UltimateTicTacToe/UltimateTicTacToe'

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Ultimate Tic-Tac-Toe</h1>
          <span className="dummy" />
        </header>
        <main>
          <UltimateTicTacToe />
        </main>
      </div>
    )
  }
}

export default App
