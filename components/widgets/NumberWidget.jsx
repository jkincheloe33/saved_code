import { useEffect, useMemo, useState } from 'react'
import moment from 'moment'
import numbro from 'numbro'
import styled from 'styled-components'

import { Text, Title } from '@components'
import { api } from '@services'
import { numberFormatter, WidgetType } from '@utils'

const Details = styled(Text)`
  padding-top: 10px;
`

const NumberWidget = ({
  dateRange,
  description,
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
  // valueColor and valueFormat are the possible properties for options JSON object...JK
  const [{ options, value }, setWidgetData] = useState({})
  // options returns as JSON, so we need to parse if it exists...JK
  const valueOptions = useMemo(() => options && JSON.parse(options), [options])

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
      <Title color={valueOptions?.valueColor ?? 'digitalBlue'} fontSize='40px' id={`number-widget-${id}`} justifyContent='flex-start'>
        {/* ternary needed to give time to fetch the number, but render a zero temporarily so that the widget container can calculate height...JK */}
        {value ? (valueOptions?.valueFormat ? numbro(value).format(valueOptions.valueFormat) : numberFormatter(value)) : 0}
      </Title>
      {name && (
        <Text color='gray1' fontSize='18px' fontWeight={600}>
          {name}
        </Text>
      )}
      {description && <Details fontSize='14px'>{description}</Details>}
    </div>
  )
}

NumberWidget.propTypes = WidgetType

export default NumberWidget
