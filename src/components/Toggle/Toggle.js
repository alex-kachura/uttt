import React from 'react'
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome'

import './Toggle.css'

const Toggle = ({ filled, children, ...inputProps }) =>
  <label className="toggle">
    <input type="checkbox" {...inputProps} />
    <Icon icon={['far', 'toggle-on']} />
    {
      filled ?
        <Icon icon={['far', 'toggle-on']} className="flipped" /> :
        <Icon icon={['far', 'toggle-off']} />
    }
    {children ? <div className="children">{children}</div> : null}
  </label>

export default Toggle
