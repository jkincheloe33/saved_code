import { useEffect, useState } from 'react'
import moment from 'moment'
import styled from 'styled-components'

import { colors } from '@assets'
import { Text } from '@components'
import { api } from '@services'
import { WidgetType } from '@utils'

const Bar = styled.div`
  background-color: ${colors.gray8};
  border-radius: 30px;
  display: block;
  height: 10px;
  margin-top: 15px;
  overflow: hidden;
  position: relative;
  width: 100%;

  &::after {
    // theme color or other css color options...JK
    background-color: ${p => (colors[p.color] ? `${colors[p.color]}` : p.color)};
    border-radius: 30px;
    content: '';
    height: 100%;
    left: -100%;
    position: absolute;
    top: 0;
    transform: translateX(${p => p.value * 100}%);
    transition: transform 250ms ease;
    width: 100%;
  }
`

const Header = styled(Text)`
  display: block;
  margin-bottom: 30px;
`

const Row = styled.div`
  position: relative;

  &:not(:last-of-type) {
    margin-bottom: 50px;
  }

  &::before {
    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-bottom: 9px solid ${p => (colors[p.color] ? `${colors[p.color]}` : p.color)};
    content: '';
    left: calc(${p => p.targetLow * 100}% - 7px);
    position: absolute;
    top: 100%;
  }
`

const HorizontalPercentBarChart = ({
  dateRange,
  endDate,
  filterGroups,
  filterTraits,
  id,
  index,
  name,
  onClick,
  reports,
  setSelectedReport,
  setSubWidget,
  setWidgetLoadingState,
  startDate,
  widgets,
}) => {
  const [widgetData, setWidgetData] = useState([])

  const getReportWidgetData = () => {
    const { isReport, isWidget, reportId } = { ...onClick }
    const subWidget = isWidget && reportId && widgets?.find(w => w.id == reportId)

    if (isReport && reportId && reports) setSelectedReport(reports.find(r => r.id == reportId))
    if (subWidget) setSubWidget(subWidget)
  }

  useEffect(() => {
    const getWidget = async () => {
      const {
        data: { success, widgetResults },
      } = await api.post('/analytics/runWidget', {
        endDate,
        filterGroups: filterGroups.map(fg => fg.id),
        filterTraits: filterTraits.map(ft => ft.id),
        startDate,
        widgetId: id,
      })
      if (success) {
        setWidgetData(widgetResults)
        // set this widgets loading state to true...JK
        setWidgetLoadingState && setWidgetLoadingState(wls => ({ ...wls, [index]: true }))
      }
    }

    if (startDate && moment(startDate)?.year() > 1900 && endDate && moment(endDate)?.year() > 1900) getWidget()

    // cleanup to prevent memory leak by reseting default state...JK
    return () => setWidgetData([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, filterGroups, filterTraits, id])

  return (
    <div onClick={() => (onClick ? getReportWidgetData() : {})}>
      <Header color='gray1' fontSize='18px' fontWeight={600} noClamp>
        {name}
      </Header>
      {widgetData.length > 0 &&
        widgetData.map(({ seriesName, seriesOptions, targetLow, value }, i) => {
          const { barColor, targetColor } =
            seriesOptions && JSON.parse(seriesOptions)
              ? JSON.parse(seriesOptions)
              : { barColor: colors.digitalBlue, targetColor: colors.mint }

          const color = value >= targetLow ? targetColor : barColor

          return (
            <Row color={color} key={i} targetLow={targetLow}>
              <Text color='gray1'>{`${seriesName} (${value * 100}%)`}</Text>
              <Bar color={color} value={value} />
            </Row>
          )
        })}
    </div>
  )
}

HorizontalPercentBarChart.propTypes = WidgetType

export default HorizontalPercentBarChart
