import { forwardRef } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { BubbleIcon } from '@assets'

const Wrapper = styled.div`
  background-image: url(${BubbleIcon});
  background-position: center center;
  background-size: cover;
  border-radius: 50%;
  cursor: pointer;
  height: ${p => p.ratio}px;
  left: 0;
  opacity: ${p => (p.remove ? 0 : 1)};
  pointer-events: ${p => (p.remove || p.complete ? 'none' : 'auto')};
  position: absolute;
  top: 0;
  width: ${p => p.ratio}px;
`

const Bubble = forwardRef(({ complete = false, handleClick, id, ratio = 100, remove = false }, ref) => {
  return <Wrapper complete={complete} id={id} onClick={handleClick} ratio={ratio} ref={ref} remove={remove} />
})

Bubble.propTypes = {
  complete: PropTypes.bool,
  handleClick: PropTypes.func.isRequired,
  id: PropTypes.string,
  ratio: PropTypes.number,
  remove: PropTypes.bool,
}

Bubble.displayName = 'Bubble'

export default Bubble
