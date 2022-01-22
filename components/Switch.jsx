import PropTypes from 'prop-types'
import styled, { css, keyframes } from 'styled-components'

import { colors } from '@assets'

const squishLeft = keyframes`
 0% { animation-timing-function: cubic-bezier(0.7 ,0, 0.5, 0.5); border-radius: 50%; transform: scaleY(1) translateX(13px); }
 50% { animation-timing-function: linear; border-radius: 7px; transform: scaleY(0.75) translateX(6.5px); }
 100% { animation-timing-function: cubic-bezier(0.5, 0.5, 0.7, 1); border-radius: 50%; transform: scaleY(1) translateX(0); }
`

const squishRight = keyframes`
 0% { animation-timing-function: cubic-bezier(0.7 ,0, 0.5, 0.5); border-radius: 50%; transform: scaleY(1) translateX(0); }
 50% { animation-timing-function: linear; border-radius: 7px; transform: scaleY(0.75) translateX(6.5px); }
 100% { animation-timing-function: cubic-bezier(0.5, 0.5, 0.7, 1); border-radius: 50%; transform: scaleY(1) translateX(13px); }
`

const Input = styled.input`
  display: none;
`

// prettier-ignore
const Slider = styled.span`
  background-color: ${p => (p.checked ? colors[p.color] : colors.gray3)};
  border-radius: 50px;
  height: 100%;
  left: 0;
  pointer-events: none;
  position: absolute;
  top: 0;
  transition: 400ms;
  width: 100%;

  &::before {
    animation: ${squishLeft} 400ms forwards;
    background-color: ${colors.white};
    border-radius: 50%;
    bottom: 3px;
    content: '';
    height: 16px;
    left: 3px;
    position: absolute;
    width: 16px;
  }

  ${p => p.checked && css`
    &::before {
      animation: ${squishRight} 400ms forwards;
    }
  `}
`

const StyledSwitch = styled.label`
  cursor: pointer;
  display: inline-block;
  height: 22px;
  position: relative;
  width: 35px;
`

const Switch = ({ color = 'blurple', id, onChange, value }) => (
  <StyledSwitch color={color} id={`${id}-label`}>
    <Slider checked={value} color={color} />
    <Input checked={value} id={id} onChange={onChange} type='checkbox' />
  </StyledSwitch>
)

Switch.propTypes = {
  color: PropTypes.string,
  id: PropTypes.string,
  onChange: PropTypes.func,
  value: PropTypes.bool,
}

export default Switch
