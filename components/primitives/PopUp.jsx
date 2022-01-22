import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, shadows } from '@assets'
import { handleClickOut } from '@utils'

const Content = styled.div`
  background-color: ${colors.white};
  border-radius: 20px 20px 0 0;
  box-shadow: ${shadows.card};
  max-height: 400px;
  overflow: auto;
  transform: ${p => (p.open ? 'translateY(0)' : 'translateY(110%)')};
  transition: transform 250ms cubic-bezier(0.93, 0.02, 0.07, 0.98);
`

const Wrapper = styled.div`
  bottom: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: flex-end;
  left: 0;
  overflow: hidden;
  pointer-events: ${p => (p.open ? 'auto' : 'none')};
  position: fixed;
  right: 0;
  top: 0;
  transition: background-color 250ms cubic-bezier(0.93, 0.02, 0.07, 0.98);
  width: 100%;
  z-index: 6;

  ${p => p.background && p.open && `background-color: ${colors.white}D9;`}
`

const PopUp = ({ background = false, children, className, handleClose = () => {}, isNested = false, open = false }) => {
  const ref = useRef(null)

  handleClickOut(ref, handleClose)

  useEffect(() => {
    if (open) {
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
    } else {
      if (!isNested) {
        document.documentElement.style.overflow = ''
        document.body.style.overflow = ''
      }
    }
  }, [isNested, open])

  return (
    <Wrapper background={background} className={className} open={open}>
      <Content open={open} ref={ref}>
        {children}
      </Content>
    </Wrapper>
  )
}

PopUp.propTypes = {
  background: PropTypes.bool,
  children: PropTypes.any,
  className: PropTypes.string,
  handleClose: PropTypes.func,
  isNested: PropTypes.bool,
  open: PropTypes.bool.isRequired,
}

export default PopUp
