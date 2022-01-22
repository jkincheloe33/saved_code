import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, colorType } from '@assets'

const Circle = styled.circle`
  fill: transparent;
  stroke-dashoffset: 0;
  stroke-width: ${p => p.strokeWidth}px;
`

const CircleProgress = styled(Circle)`
  stroke-dashoffset: ${p => p.offset};
  transition: all 2000ms cubic-bezier(0.81, 0.02, 0.08, 0.98);
`

const Svg = styled.svg`
  border-radius: 50%;
  transform: rotate(270deg);
`

const ProgressCircle = ({
  animate = false,
  colorOptions = { end: 'skyBlue', start: 'mint' },
  currentProgress,
  id,
  ratio,
  strokeWidth = 2,
  totalProgress,
}) => {
  const diameter = ratio / 2
  // before we calculate the radius and circumference, we need to account for the stroke width...JK
  const radius = (ratio - strokeWidth * 2) / 2
  const circumference = radius * 2 * Math.PI

  return (
    <Svg width={ratio} height={ratio} xmlns='http://www.w3.org/2000/svg'>
      <defs>
        <linearGradient id={`linear-${id}`} x1='0%' y1='0%' x2='100%' y2='0%'>
          <stop offset='60%' stopColor={colors[colorOptions.start]} />
          <stop offset='100%' stopColor={colors[colorOptions.end]} />
        </linearGradient>
      </defs>
      <Circle
        r={radius}
        cx={diameter}
        cy={diameter}
        stroke={`${colors.gray3}20`}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeWidth={strokeWidth}
      />
      <CircleProgress
        r={radius}
        cx={diameter}
        cy={diameter}
        offset={animate ? circumference - circumference * (currentProgress / totalProgress) : circumference}
        stroke={`url(#linear-${id})`}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeLinecap='round'
        strokeWidth={strokeWidth}
      />
    </Svg>
  )
}

ProgressCircle.propTypes = {
  animate: PropTypes.bool,
  colorOptions: PropTypes.shape({
    end: PropTypes.oneOf(colorType),
    start: PropTypes.oneOf(colorType),
  }),
  currentProgress: PropTypes.number.isRequired,
  id: PropTypes.string,
  ratio: PropTypes.number.isRequired,
  strokeWidth: PropTypes.number,
  totalProgress: PropTypes.number.isRequired,
}

export default ProgressCircle
