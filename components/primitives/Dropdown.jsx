import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices, shadows } from '@assets'

const TIMING = 250

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;
  padding: 20px;
  position: relative;
  // allows you to have fixed elements relative to this Container...JK
  transform: translateZ(0);
  width: 100%;

  @media (${devices.tablet}) {
    padding: 30px;
  }
`

const Wrapper = styled.div`
  background-color: ${colors.white};
  border-radius: 20px;
  box-shadow: ${shadows.card};
  height: 60vh;
  opacity: ${p => (p.open ? 1 : 0)};
  overflow: hidden;
  pointer-events: ${p => (p.open ? 'auto' : 'none')};
  position: absolute;
  top: 53px;
  transition: all ${TIMING}ms ease;
  width: 90vw;

  ${p => p.small && 'max-width: 394px;'}

  @media (${devices.tablet}) {
    height: ${p => (p.full ? '65vh' : '50vh')};
    width: 722px;
  }
`

const Dropdown = ({ children, full = false, open = false, small = false }) => {
  return (
    <Wrapper full={full} open={open} small={small}>
      <Container>{children}</Container>
    </Wrapper>
  )
}

Dropdown.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  full: PropTypes.bool,
  open: PropTypes.bool,
  small: PropTypes.bool,
}

export default Dropdown
