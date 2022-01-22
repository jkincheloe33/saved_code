import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

import { breakpoints, colors, shadows } from '@assets'
import { useResizeContext } from '@contexts'

// prettier-ignore
const Input = styled.textarea`
  background-color: transparent;
  border: 0;
  color: ${colors.gray1};
  font-size: 16px;
  height: ${p => `${p.height}px` ?? 'auto'};
  overflow: ${p => p.grow ? 'hidden' : 'auto'};
  resize: none;
  width: 100%;
  -webkit-appearance: none;

  &::placeholder {
    color: ${colors.gray3};
  }

  &:focus {
    outline: none;
  }

  ${p => p.shadow && `
    box-shadow: ${shadows.input};

    &:focus {
      box-shadow: ${shadows.inputFocus};
    }
  `}
`

const TextArea = ({ className, grow = false, onChange, onSubmit, placeholder, rows = 1, shadow = false, value, ...props }) => {
  const [height, setHeight] = useState(null)
  const { windowWidth } = useResizeContext()

  const ref = useRef(null)

  // tracks if a user hits enter without also pressing shift...JK
  const handleEnter = e => {
    if (onSubmit && e.key === 'Enter' && !e.shiftKey && windowWidth >= breakpoints.largeDesktop) {
      e?.preventDefault()
      onSubmit(e)
    }
  }

  // sets the textarea height dynamically when text wraps...JK
  const handleInput = e => {
    if (grow) {
      // needed to reset the scrollHeight...JK
      ref.current.style.height = 0
      ref.current.style.height = `${e.target.scrollHeight}px`
    }
  }

  useEffect(() => {
    if (ref.current && grow && value.length > 0) {
      setHeight(ref.current.scrollHeight)
    } else {
      ref.current.style.height = 'auto'
    }
  }, [grow, value])

  return (
    <Input
      {...props}
      className={className}
      grow={grow}
      height={height}
      onChange={onChange}
      onInput={handleInput}
      onKeyPress={handleEnter}
      placeholder={placeholder}
      ref={ref}
      rows={rows}
      shadow={shadow}
      value={value}
    />
  )
}

TextArea.propTypes = {
  className: PropTypes.string,
  grow: PropTypes.bool,
  onChange: PropTypes.func,
  onSubmit: PropTypes.func,
  placeholder: PropTypes.string,
  rows: PropTypes.number,
  shadow: PropTypes.bool,
  value: PropTypes.string,
}

export default TextArea
