import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors } from '@assets'

const Svg = styled.svg`
  transform: ${p => (p.flip ? 'scaleX(-1)' : 'scaleX(1)')};
`

const Arrow = ({ className, color, flip = false, ...props }) => (
  <Svg {...props} className={className} fill='none' flip={flip} height='16' width='9' xmlns='http://www.w3.org/2000/Svg'>
    <path
      fillRule='evenodd'
      clipRule='evenodd'
      d='M2.472 8.172l5.806 5.912c.383.39.331.978-.116 1.313-.447.334-1.12.289-1.504-.101L.257 8.777a.843.843 0 010-1.212l6.4-6.517C7.042.66 7.716.614 8.163.95c.447.334.5.922.116 1.312L2.472 8.172z'
      fill={colors[color] || '#A3A9B5'}
    />
  </Svg>
)

Arrow.propTypes = {
  className: PropTypes.string,
  color: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  flip: PropTypes.bool,
}

export default Arrow
