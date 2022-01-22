import { forwardRef } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

import { shadows, colors } from '@assets'

const Wrapper = styled.div`
  background-color: ${p => colors[p.backgroundColor] ?? colors.white};
  border-radius: ${p => p.borderRadius ?? '20px'};
  box-shadow: ${p => (p.shadow ? shadows.card : 'none')};
  height: auto;
  overflow: hidden;
  width: 100%;
`

const Card = forwardRef(({ backgroundColor, borderRadius, children, className, shadow = true, ...props }, ref) => (
  <Wrapper {...props} backgroundColor={backgroundColor} borderRadius={borderRadius} className={className} ref={ref} shadow={shadow}>
    {children}
  </Wrapper>
))

Card.propTypes = {
  backgroundColor: PropTypes.string,
  borderRadius: PropTypes.string,
  children: PropTypes.any,
  className: PropTypes.string,
  shadow: PropTypes.bool,
}

Card.displayName = 'Card'

export default Card
