import { forwardRef } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors } from '@assets'
import { useSpacingContext } from '@contexts'

const Wrapper = styled.div`
  height: ${p => (p.fixed ? `calc(100vh - ${p.spacingTop}px - ${p.spacingBottom}px)` : '100%')};
  overflow: ${p => (p.noScroll ? 'hidden' : 'auto')};

  scrollbar-color: ${colors.gray3}99;

  &::-webkit-scrollbar {
    display: block;
    width: 6px;
    -webkit-appearance: none;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${colors.gray3}99;
    border-radius: 5px;
  }
`

const DynamicContainer = forwardRef(({ fixed = false, children, className, noScroll = false, outer = false, ...props }, ref) => {
  const { footerHeight, innerHeaderHeight, mobileHeaderHeight } = useSpacingContext()

  return (
    <Wrapper
      {...props}
      className={className}
      fixed={fixed}
      noScroll={noScroll}
      ref={ref}
      spacingBottom={outer ? footerHeight : 0}
      spacingTop={outer ? mobileHeaderHeight : innerHeaderHeight}
    >
      {children}
    </Wrapper>
  )
})

DynamicContainer.displayName = 'DynamicContainer'

DynamicContainer.propTypes = {
  children: PropTypes.any,
  className: PropTypes.string,
  fixed: PropTypes.bool,
  noScroll: PropTypes.bool,
  outer: PropTypes.bool,
}

export default DynamicContainer
