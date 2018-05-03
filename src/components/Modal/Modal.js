import React from 'react'
import classNames from 'classnames'

import './Modal.css'

const KEY_ESC = 27

class Modal extends React.Component {
  constructor(...args) {
    super(...args)

    this.handleKeyDown = this.handleKeyDown.bind(this)
  }

  componentDidMount() {
    if (this.props.isShown) {
      this.addListeners()
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.isShown && !prevProps.isShown) {
      this.addListeners()
    } else if (!this.props.isShown && prevProps.isShown) {
      this.removeListeners()
    }

    if (this.props.onReady) {
      this.props.onReady()
    }
  }

  componentWillUnmount() {
    this.removeListeners()
  }

  addListeners() {
    document.addEventListener('keydown', this.handleKeyDown, true)
  }

  removeListeners() {
    document.removeEventListener('keydown', this.handleKeyDown, true)
  }

  handleKeyDown(event) {
    if (event.keyCode === KEY_ESC) {
      this.props.onClose()
    }
  }

  render() {
    const { children, isShown, className, onClose } = this.props

    if (!isShown) return null

    return (
      <div className="modal" onClick={onClose}>
        <div className={classNames("modal__window", className)} onClick={(evt) => evt.stopPropagation()}>

          {children}

          <div className="modal__close" onClick={onClose}><i className="fal fa-times" /></div>
        </div>
      </div>
    )
  }
}

export default Modal
