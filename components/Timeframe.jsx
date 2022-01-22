import { createRef, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colorType, colors, shadows } from '@assets'
import { Text } from '@components'
import { useResizeContext } from '@contexts'
import { uId } from '@utils'

// the amount of px added to the pill on either side of the Date/range text...JK
const HORIZONTAL = 20
// distance for Pill from left/top/bottom of Wrapper...JK
const POSITION = 3
const WIDTH = HORIZONTAL * 2 - POSITION // 37

const Date = styled(Text)`
  cursor: pointer;
  letter-spacing: 0.12em;
  position: relative;
  text-align: center;
  text-transform: uppercase;
  transition: color 250ms cubic-bezier(0.71, 0.01, 0.27, 0.99);
`

const Wrapper = styled.div`
  background-color: ${p => colors[p.bgColor] ?? colors.white};
  border-radius: 20px;
  box-shadow: ${p => (p.shadow ? shadows.card : 'none')};
  display: flex;
  justify-content: space-between;
  padding: 12px 20px;
  position: relative;

  &::before {
    background-color: ${colors.blurple};
    border-radius: 20px;
    content: '';
    height: calc(100% - ${POSITION * 2}px);
    left: 0;
    position: absolute;
    top: ${POSITION}px;
    // Date range distance from left of Wrapper minus half of the extra width added to the ::befor width...JK
    transform: ${p => (p.index === 0 ? `translateX(${POSITION}px)` : `translateX(${p.x - WIDTH / 2}px)`)};
    transition: all 250ms cubic-bezier(0.71, 0.01, 0.27, 0.99);
    width: ${p => p.pillWidth + WIDTH - 2}px;
    z-index: 0;
  }
`

const Timeframe = ({ active, bgColor, fontWeight, ranges, setActive, shadow = true }) => {
  const [windowOffset, setWindowOffset] = useState(0)
  const [rangeRefs, setRangeRefs] = useState(null)
  const containerRef = useRef(null)
  // creats an array of refs to assign to each range...JK
  const refs = useRef(ranges.map(() => createRef()))
  const { windowWidth } = useResizeContext()

  useEffect(() => {
    if (refs.current && refs.current[0].current) {
      setRangeRefs(refs.current)
    }
  }, [])

  useEffect(() => {
    // gets the distance of Wrapper from the left of the window...JK
    if (containerRef && containerRef.current) setWindowOffset(containerRef.current.getBoundingClientRect().x)
  }, [windowWidth])

  return (
    <Wrapper
      bgColor={bgColor}
      id='patient-voice-timeline'
      index={active}
      // width of active Date range...JK
      pillWidth={rangeRefs && rangeRefs[active].current.clientWidth}
      ref={containerRef}
      shadow={shadow}
      // distance from left of container - distance from Wrapper to left of the window...JK
      x={rangeRefs && rangeRefs[active].current.getBoundingClientRect().x - windowOffset}
    >
      {ranges.map((range, i) => (
        <Date
          color={active === i ? 'white' : 'darkBlue'}
          fontSize='14px'
          fontWeight={fontWeight}
          id={uId('timeline-date')}
          key={i}
          onClick={() => setActive(i)}
          ref={refs.current[i]}
        >
          {range}
        </Date>
      ))}
    </Wrapper>
  )
}

Timeframe.propTypes = {
  active: PropTypes.number,
  bgColor: PropTypes.oneOf(colorType),
  fontWeight: PropTypes.number,
  ranges: PropTypes.arrayOf(PropTypes.string),
  setActive: PropTypes.func,
  shadow: PropTypes.bool,
}

export default Timeframe
