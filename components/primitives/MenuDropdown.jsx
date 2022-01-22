import { useRef } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices } from '@assets'
import { Card } from '@components'
import { handleClickOut } from '@utils'

const Dropdown = styled(Card)`
  align-items: center;
  display: flex;
  flex-direction: column;
  min-width: 400px;
  padding: 24px;
  width: auto;
`

// prettier-ignore
const DropdownWrapper = styled.div`
  align-items: center;
  background: ${colors.white}D9;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  height: calc(100% - 20px);
  left: 20px;
  opacity: ${p => (p.open ? 1 : 0)};
  padding: 13px;
  pointer-events: ${p => (p.open ? 'auto' : 'none')};
  position: absolute;
  top: 10px;
  transition: opacity 100ms ease;
  width: calc(100% - 40px);
  z-index: 6;

  @media (${devices.largeDesktop}) {
    ${p => p.expanded && `
      height: 100%;
      left: 0;
      top: 0;
      width: 100%;
    `}
    
  }
`

const MenuDropdown = ({ children, expanded, open, setIsMenuOpen }) => {
  const ref = useRef(null)

  handleClickOut(ref, () => {
    if (open) setIsMenuOpen(false)
  })

  return (
    <DropdownWrapper expanded={expanded} open={open}>
      <Dropdown ref={ref}>{children}</Dropdown>
    </DropdownWrapper>
  )
}

MenuDropdown.propTypes = {
  children: PropTypes.any,
  expanded: PropTypes.bool,
  open: PropTypes.bool,
  setIsMenuOpen: PropTypes.func,
}

export default MenuDropdown
