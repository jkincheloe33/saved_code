import { useRef } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, shadows } from '@assets'
import { handleClickOut } from '@utils'

const TIMING = 500

// prettier-ignore
const Content = styled.div`
  background-color: ${colors.white};
  border-radius: 20px;
  box-shadow: ${shadows.card};
  max-height: 90vh;
  overflow-x: hidden;
  overflow-y:  ${p => p.noScroll ? 'hidden' : 'auto'};
  position: relative;
  transition: all ${TIMING}ms cubic-bezier(0.88, 0.03, 0.09, 0.98);
  width: 100%;
`

// prettier-ignore
const Wrapper = styled.div`
  align-items: center;
  box-shadow: ${shadows.modal};
  display: flex;
  justify-content: flex-end;
  opacity: ${p => p.open ? 1 : 0};
  overflow: auto;
  pointer-events: ${p => p.open ? 'auto' : 'none'};
  position: fixed;
  right: ${p => p.positionX};
  top: ${p => p.positionY};
  transform: ${p => p.transform} translateY(-30px);
  transition: all ${TIMING}ms cubic-bezier(0.88, 0.03, 0.09, 0.98);
  width: 416px;
  z-index: 5;

  ${p => p.open && `
    transform: ${p.transform} translateY(-10px);
  `}
`

const NavDropdown = ({
  children,
  className,
  handleClose,
  id,
  navRefs = [],
  noScroll = false,
  open,
  positionX = '50px',
  positionY = '75px',
  transform = '',
}) => {
  const ref = useRef(null)

  handleClickOut([ref, ...navRefs], () => {
    handleClose()
  })

  return (
    <Wrapper className={className} open={open} positionX={positionX} positionY={positionY} transform={transform}>
      <Content id={id} noScroll={noScroll} open={open} ref={ref}>
        {children}
      </Content>
    </Wrapper>
  )
}

NavDropdown.propTypes = {
  children: PropTypes.any,
  className: PropTypes.string,
  handleClose: PropTypes.func,
  id: PropTypes.string,
  navRefs: PropTypes.array,
  noScroll: PropTypes.bool,
  open: PropTypes.bool,
  positionX: PropTypes.string,
  positionY: PropTypes.string,
  transform: PropTypes.string,
}

export default NavDropdown
