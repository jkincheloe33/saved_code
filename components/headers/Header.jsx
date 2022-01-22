import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices } from '@assets'
import { Card } from '@components'
import { useSpacingContext } from '@contexts'

const Content = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  max-width: 1920px;
  width: 100%;

  @media (${devices.largeDesktop}) {
    ${p => !p.inner && 'padding: 0 20px;'}
  }

  @media (${devices.xxlDesktop}) {
    ${p => !p.inner && 'padding: 0 50px;'}
  }
`

// prettier-ignore
const Wrapper = styled(Card)`
  align-items: center;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  display: flex;
  justify-content: center;
  left: 0;
  min-height: 68px;
  padding: ${p => (p.inner ? '10px 25px' : '10px 20px')};
  position: fixed;
  top: 0;
  z-index: 5;

  @media (${devices.largeDesktop}) {
    padding: 20px 0;

    ${p => p.inner && `
      background-color: ${p.dark ? colors.white : 'transparent'};
      border-bottom: 1px solid ${colors.gray8};
      border-radius: 0;
      box-shadow: none;
      padding: 10px 20px;
    `}
  }
`

const Header = ({ children, dark = false, inner }) => {
  const ref = useRef(null)
  const { innerHeaderHeight, mobileHeaderHeight, setInnerHeaderHeight, setMobileHeaderHeight } = useSpacingContext()

  // due to the kill child setTimeout when closing a modal, we need to track height changes to trigger useEffect...JK
  const height = ref?.current?.clientHeight

  useEffect(() => {
    // since we are listening to height changes and the header heights are the same everywhere, only set innerHeaderHeight and mobileHeaderHeight when they equal 0...JK
    if (ref.current && (innerHeaderHeight === 0 || mobileHeaderHeight === 0)) {
      if (inner) setInnerHeaderHeight(ref.current.clientHeight)
      else setMobileHeaderHeight(ref.current.clientHeight)
    }
  }, [height, inner, innerHeaderHeight, mobileHeaderHeight, setInnerHeaderHeight, setMobileHeaderHeight])

  return (
    <Wrapper dark={dark} inner={inner} ref={ref}>
      <Content inner={inner}>{children}</Content>
    </Wrapper>
  )
}

Header.propTypes = {
  children: PropTypes.any,
  dark: PropTypes.bool,
  inner: PropTypes.bool,
  setSpacing: PropTypes.func,
}

export default Header
