import { useEffect, useMemo, useState } from 'react'
import moment from 'moment'
import styled from 'styled-components'

import { SemiCircleProgress, Text } from '@components'
import { api } from '@services'
import { numberFormatter, WidgetType } from '@utils'

const Container = styled.div`
  align-items: flex-end;
  display: flex;
  justify-content: space-between;
`

const PercentTotalWidget = ({
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
  // barColor and targetColor are the possible properties for options JSON object...JK
  const [{ numerator, denominator, options, target }, setWidgetData] = useState({})
  // options returns as JSON, so we need to parse if it exists...JK
  const valueOptions = useMemo(() => options && JSON.parse(options) && JSON.parse(options), [options])

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
        setWidgetData(widgetResults[0])
        setWidgetLoadingState && setWidgetLoadingState(wls => ({ ...wls, [index]: true }))
      }
    }

    if (startDate && moment(startDate)?.year() > 1900 && endDate && moment(endDate)?.year() > 1900) getWidget()

    // cleanup to prevent memory leak by reseting default state...JK
    return () => setWidgetData({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, filterGroups, filterTraits, id])

  return (
    <div onClick={() => (onClick ? getReportWidgetData() : {})}>
      <Text color='gray1' fontSize='18px' fontWeight={600} noClamp>
        {name}
      </Text>
      <Container>
        <Text color='gray1' fontSize='14px'>
          {numerator ? `${numberFormatter(numerator)} of ${numberFormatter(denominator)}` : 'No data'}
        </Text>
        <SemiCircleProgress
          diameter={171}
          id={`${id}-semicircle`}
          showValue
          stroke={valueOptions?.barColor ?? undefined}
          target={target}
          targetColor={valueOptions?.targetColor ?? undefined}
          value={numerator && denominator ? (numerator / denominator) * 100 : 0}
        />
      </Container>
    </div>
  )
}

PercentTotalWidget.propTypes = WidgetType

export default PercentTotalWidget
