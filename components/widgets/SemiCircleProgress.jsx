import CountUp from 'react-countup'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors } from '@assets'
import { Text } from '@components'

const Percentage = styled(Text)`
  bottom: ${p => (p.orientation === 'down' ? 'auto' : '10px')};
  left: 0;
  position: absolute;
  text-align: center;
  width: 100%;
`

const SVG = styled.svg`
  overflow: hidden;
  transform: ${p => p.rotation};

  textPath {
    fill: ${p => p.color};
    font-size: 27px;
  }
`

const TopCircle = styled.circle`
  transition: stroke-dashoffset 0.3s ease 0s, stroke-dasharray 0.3s ease 0s, stroke 0.3s;
`

const Wrapper = styled.div`
  align-self: flex-end;
  position: relative;
`

const SemiCircleProgress = ({
  background = colors.gray8,
  diameter = 104,
  direction = 'right',
  id,
  orientation = 'up',
  showValue = false,
  stroke = colors.digitalBlue,
  strokeWidth = 10,
  target,
  targetColor = colors.mint,
  value,
}) => {
  const radius = diameter / 2
  const radiusNoStroke = (diameter - 2 * strokeWidth) / 2
  const circumference = Math.round(Math.PI * radiusNoStroke * 10) / 10

  const percentage = value > 100 ? 100 : value < 0 ? 0 : value
  const semiCirclePercentage = percentage * (circumference / 100)
  // checks if progress is greater than the target...JK
  const targetHit = target && semiCirclePercentage / circumference > target

  let rotation
  if (orientation === 'down') {
    if (direction === 'left') {
      rotation = 'rotate(180deg) rotateY(180deg)'
    } else {
      rotation = 'rotate(180deg)'
    }
  } else {
    if (direction === 'right') {
      rotation = 'rotateY(180deg)'
    }
  }

  return (
    <Wrapper>
      <SVG
        color={targetHit ? colors[targetColor] ?? targetColor : colors[stroke] ?? stroke}
        height={diameter / 2}
        rotation={rotation}
        width={diameter}
      >
        <defs>
          <linearGradient id={`linear-${id}`} x1='0%' y1='0%' x2='100%' y2='0%'>
            <stop offset='0%' stopColor={colors[stroke] ?? stroke} />
            <stop offset='100%' stopColor={colors[stroke] ? `${colors[stroke]}B3` : stroke} />
          </linearGradient>
          <linearGradient id={`linearTarget-${id}`} x1='0%' y1='0%' x2='100%' y2='0%'>
            <stop offset='0%' stopColor={colors[targetColor] ?? targetColor} />
            <stop offset='100%' stopColor={colors[targetColor] ? `${colors[targetColor]}B3` : targetColor} />
          </linearGradient>
        </defs>
        <circle
          cx={radius}
          cy={radius}
          r={radiusNoStroke}
          fill='none'
          stroke={background}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
        />
        <TopCircle
          cx={radius}
          cy={radius}
          r={radiusNoStroke}
          fill='none'
          // checking targetHit here because you can't dynamically change linearGradient stop colors...JK
          stroke={targetHit ? `url(#linearTarget-${id})` : `url(#linear-${id})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={semiCirclePercentage}
        />
        {/* this path is a circle the same size as the other circles and is needed for textPath to follow (textPaths cannot be aligned along a circle element) */}
        {target && (
          <>
            <path
              d={`
            M ${radius}, ${radius}
            m -${radiusNoStroke}, 0
            a ${radiusNoStroke}, ${radiusNoStroke} 0 1, 0 ${radiusNoStroke * 2}, 0
            a ${radiusNoStroke}, ${radiusNoStroke} 0 1, 0 -${radiusNoStroke * 2}, 0
          `}
              id='marker'
              style={{ fill: 'none' }}
            />
            <text textAnchor='middle' dy='-5'>
              {/* since #marker is a full circle, 50% is the starting point. So we divide the target by 2, multiply that by 100 and then add 50%...JK */}
              <textPath startOffset={`${50 + (target / 2) * 100}%`} xlinkHref='#marker'>
                ▾
              </textPath>
            </text>
          </>
        )}
      </SVG>
      {showValue && (
        <CountUp start={0} end={percentage} decimals={1} delay={0} duration={0.3}>
          {({ countUpRef }) => (
            <Percentage color='gray1' fontSize='30px' fontWeight={600} orientation={orientation}>
              <span ref={countUpRef} />%
            </Percentage>
          )}
        </CountUp>
      )}
    </Wrapper>
  )
}

SemiCircleProgress.propTypes = {
  background: PropTypes.string,
  diameter: PropTypes.number,
  direction: PropTypes.oneOf(['left', 'right']),
  id: PropTypes.string,
  orientation: PropTypes.oneOf(['up', 'down']),
  showValue: PropTypes.bool,
  stroke: PropTypes.string,
  strokeWidth: PropTypes.number,
  target: PropTypes.string,
  targetColor: PropTypes.string,
  value: PropTypes.number,
}

export default SemiCircleProgress
