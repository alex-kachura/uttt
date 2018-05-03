import React from 'react'

import './Toggle.css'

const Toggle = ({ filled, children, ...inputProps }) =>
  <label className="toggle">
    <input type="checkbox" {...inputProps} />
    <i className="far fa-toggle-on" />
    {
      filled ?
        <i className="far fa-toggle-on flipped" /> :
        <i className="far fa-toggle-off" />
    }
    {children ? <div className="children">{children}</div> : null}
  </label>

export default Toggle
