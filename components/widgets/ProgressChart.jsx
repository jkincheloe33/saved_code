import { createRef, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors } from '@assets'
import { Card, Title } from '@components'

import DonutChart from './DonutChart'

const TAB_PADDING_X = 7
const TAB_PADDING_Y = 5

const Chart = styled.div`
  flex: 0 0 62%;
  position: relative;
  margin-top: -20px;

  circle {
    transition: all 250ms ease;
  }
`

const Content = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: 25px;
`

const Dot = styled.div`
  background-color: ${p => colors[p.color]};
  border-radius: 50%;
  height: 9px;
  left: ${TAB_PADDING_X}px;
  position: absolute;
  width: 9px;
`

const Percentage = styled(Title)`
  display: inline-block;
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
`

const Tab = styled.div`
  align-items: center;
  background-color: ${p => (p.active ? colors[p.background] : colors.gray8)};
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  padding: ${TAB_PADDING_Y}px 0 ${TAB_PADDING_Y}px ${TAB_PADDING_X}px;
  position: relative;
  transition: background-color 250ms ease;
  width: 100%;

  &:not(:last-of-type) {
    margin-bottom: 10px;
  }
`

const Tabs = styled.div`
  flex: 0 0 33%;
`

const Value = styled(Title)`
  transform: ${p => (p.active ? `translateX(${p.width}px)` : `translateX(${TAB_PADDING_X * 2}px)`)};
  transition: transform 250ms ease;
`

const Wrapper = styled(Card)`
  padding: 25px;
`

const ProgressChart = ({ values }) => {
  const [active, setActive] = useState(null)
  const [tab, setTab] = useState(0)
  const [valueRefs, setValueRefs] = useState(null)
  const tabRef = useRef(null)
  // creats an array of refs to assign to each value...JK
  const refs = useRef(values.map(() => createRef()))

  useEffect(() => {
    if (tabRef.current && refs.current && refs.current[0].current) {
      setTab(tabRef.current)
      setValueRefs(refs.current)
    }
  }, [])

  const getPercentage = rating => `${100 * rating}%`

  /**
   * dynamically calculates translateX when a Tab is active...JK
   *
   * @param {Object} tab   the tab ref object to grab the clientWidth
   * @param {Object} value the value ref object to grab the clientWidth
   * @returns {Number}     number used to move the Value component when active
   */
  const handlePosition = (tab, value) => {
    const tabWidth = tab.clientWidth
    const valueWidth = value.clientWidth
    return tabWidth / 2 - valueWidth / 2 - TAB_PADDING_X
  }

  return (
    <Wrapper>
      <Title justifyContent='left' fontSize='18px'>
        Values Distribution
      </Title>
      <Content>
        <Chart>
          {values[active] && <Percentage fontSize='22px'>{getPercentage(values[active].rating)}</Percentage>}
          <DonutChart active={active} values={values} />
        </Chart>
        <Tabs ref={tabRef}>
          {values.map((value, i) => (
            <Tab active={active === i} background={value.backgroundColor} key={i} onClick={() => setActive(i)}>
              <Dot color={value.backgroundColor} />
              <Value
                active={active === i}
                color={active === i ? value.activeText : 'gray1'}
                justifyContent='left'
                fontSize='16px'
                ref={refs.current[i]}
                width={valueRefs && handlePosition(tab, valueRefs[i].current)}
              >
                {value.text}
              </Value>
            </Tab>
          ))}
        </Tabs>
      </Content>
    </Wrapper>
  )
}

ProgressChart.propTypes = {
  values: PropTypes.arrayOf(
    PropTypes.shape({
      activeText: PropTypes.string.isRequired,
      backgroundColor: PropTypes.string.isRequired,
      rating: PropTypes.number.isRequired,
      text: PropTypes.string.isRequired,
    })
  ).isRequired,
}

export default ProgressChart
