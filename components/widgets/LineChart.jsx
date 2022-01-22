import { useEffect, useRef, useState } from 'react'
import { defaults, Line } from 'react-chartjs-2'
import moment from 'moment'
import numbro from 'numbro'
import styled from 'styled-components'

import { colors } from '@assets'
import { Card, Text, Title as TitleBase } from '@components'
import { api } from '@services'
import { WidgetType } from '@utils'

const colorOptions = ['blurple', 'skyBlue', 'berry', 'mint', 'yellow', 'lavender', 'fuschia', 'digitalBlue', 'orange', 'darkPurple'] // color list for up to 10 line/labels...JK
const X_SPACING = 28

const Container = styled.div`
  padding: 0 ${X_SPACING}px 22px;
  position: relative;
`

const Header = styled.div`
  border-bottom: 0.5px solid ${colors.gray5};
  padding: 22px 22px 25px;
`

// prettier-ignore
const InnerWrapper = styled.div`
  padding: 20px;
  position: relative;

  &::after,
  &::before {
    border: 10px solid ${colors.gray6};
    border-color: transparent ${colors.gray6} transparent transparent;
    border-width: 10px 10px 10px 0;
    content: '';
    position: absolute;
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
  }

  &::after {
    border-right-color: ${colors.white}c4;
    border-width: 9px 9px 9px 0;
    left: -9px;
    right: auto;
  }

  ${p => p.caretLocation === 'right' && `
    &::after,
    &::before {
      border-color: transparent transparent transparent ${colors.gray6};
      border-width: 10px 0 10px 10px;
      left: 100%;
      right: auto;
    }

    &::after {
      border-left-color: ${colors.white}c4;
      border-width: 9px 0 9px 9px;
      left: auto;
      right: -9px;
    }
  `}
`

const Location = styled(Text)`
  padding-left: 20px;
  position: relative;

  &::before {
    background-color: ${p => p.dotColor};
    border-radius: 50%;
    content: '';
    height: 8px;
    left: 0;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 8px;
  }
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  padding-bottom: 17px;

  &:last-of-type {
    padding-bottom: 0;
  }
`

const Title = styled(TitleBase)`
  margin-bottom: 5px;
`

const Tooltip = styled(Card)`
  background-color: ${colors.white};
  border: 1px solid ${colors.gray6};
  border-radius: 12px;
  left: 0;
  opacity: 0;
  overflow: visible;
  pointer-events: none;
  position: absolute;
  top: 0;
  transition: all 250ms cubic-bezier(0.83, 0, 0.16, 1);
  width: 285px;
`

const Wrapper = styled(Card)`
  cursor: ${p => (p.clickable ? 'pointer' : 'auto')};
  margin-bottom: 45px;
`

const LineChart = ({
  dateRange,
  description,
  endDate,
  filterGroups,
  filterTraits,
  id,
  name,
  onClick,
  reports,
  setSelectedReport,
  setSubWidget,
  startDate,
  widgets,
}) => {
  const [caretLocation, setCaretLocation] = useState('left')
  const [lineData, setLineData] = useState(null)
  const [rows, setRows] = useState([])
  const [title, setTitle] = useState('')

  const ref = useRef(null)

  const getColor = i => ({
    backgroundColor: colors[colorOptions[i]],
    borderColor: colors[colorOptions[i]],
    pointHoverBorderColor: colors[colorOptions[i]],
  })

  // data comes back as one array, and this function restructures it to match the data needed for chart.js...JK
  const getLineData = data => {
    // get unique list of xAxis values (horizontal labels for the chart)...JK
    const columns = [...new Set(data.map(({ xAxis }) => xAxis))]
    // get unique list of seriesNames. the length of this array represents how many lines will be on the chart...JK
    const names = [...new Set(data.map(({ seriesName }) => seriesName))]

    const pointData = names.map(name => {
      // get each data set associated with a seriesName...JK
      const filtered = data.filter(d => d.seriesName === name)
      // get uniqe list of xAxis values for each seriesName (some series won't have the same amount of rows as others)...JK
      const filteredColumns = [...new Set(filtered.map(({ xAxis }) => xAxis))]

      // since some data sets won't have the same amount of rows, we need to add to the filtered array and give the yAxis a value of 0
      // example: if a location didn't log any signins for a given month, a record woudn't have been created for that month in the DB.
      // so we need to manually create that record here using the splice method to make sure it's inserted into the filtered array in the correct order...JK
      columns.forEach((column, i) => {
        if (filteredColumns.indexOf(column) === -1) filtered.splice(i, 0, { seriesName: name, yAxis: 0, xAxis: column })
      })

      // data structure that our LineChart component expects - { data: [1, 2, 3], label: 'Label Name'}...JK
      return { data: filtered.map(f => f.yAxis), label: name }
    })

    return { columns, series: pointData }
  }

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
        setLineData({ ...getLineData(widgetResults) })
      }
    }

    if (startDate && moment(startDate)?.year() > 1900 && endDate && moment(endDate)?.year() > 1900) getWidget()

    // cleanup to prevent memory leak by reseting default state...JK
    return () => {
      setCaretLocation('left')
      setLineData(null)
      setRows([])
      setTitle('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, filterGroups, filterTraits, id])

  return (
    <Wrapper clickable={!!onClick} onClick={() => (onClick ? getReportWidgetData() : {})}>
      <Header>
        <Title justifyContent='flex-start'>{name}</Title>
        <Text>{description}</Text>
      </Header>
      <Container>
        <Line
          data={
            lineData && {
              datasets: lineData.series.map(({ data, label }, i) => ({
                ...getColor(i),
                data,
                label,
                pointBackgroundColor: `${colors.white}00`,
                pointBorderColor: `${colors.white}00`,
                pointHoverBorderWidth: 3,
                pointHoverBackgroundColor: colors.white,
                pointHoverRadius: 10,
                pointRadius: 10,
                // beizer curve...JK
                tension: 0.35,
              })),
              labels: lineData.columns,
            }
          }
          options={{
            animation: {
              duration: 0,
            },
            plugins: {
              legend: {
                labels: {
                  boxWidth: 7,
                  boxHeight: 7,
                  // source: https://github.com/chartjs/Chart.js/issues/2651#issuecomment-234779882
                  // the legend points use the same styles as the graph points, this is the only way to override the default legend fillStyles...JK
                  generateLabels: function (chart) {
                    const labels = defaults.plugins.legend.labels.generateLabels(chart)
                    labels.length && labels.forEach((label, i) => (label.fillStyle = colors[colorOptions[i]]))
                    return labels
                  },
                  padding: 28,
                  usePointStyle: true,
                },
                onClick: null,
              },
              tooltip: {
                // disabled default chartjs tooltip and render our custom component...JK
                enabled: false,
                external: function (context) {
                  const chart = context.chart
                  const model = context.tooltip

                  // render a row in the tooltip with the values of the points you're hovering on the graph. can be 1 or more depending if two lines intersect...JK
                  const data =
                    model.dataPoints?.length &&
                    model.dataPoints.map(({ dataset, raw }, i) => (
                      <Row key={i}>
                        <Location color='coolGray' dotColor={dataset.backgroundColor} fontSize='14px'>
                          {dataset.label}
                        </Location>
                        <Text>{numbro(raw).format({ mantissa: 0, thousandSeparated: true })}</Text>
                      </Row>
                    ))

                  // changes the side the caret should be rendered on...JK
                  if (caretLocation !== model.xAlign) setCaretLocation(model.xAlign)
                  // check needed to prevent rows from being overwritten (this was causing an infinite loop while hovering over a point on the chart)...JK
                  if (JSON.stringify(rows) !== JSON.stringify(data) && data?.length) setRows(data)
                  // name of the column that you are hovering over...JK
                  if (model.title?.[0]) setTitle(model.title[0])

                  if (ref?.current) {
                    const element = ref.current

                    // hide/show tooltip depending on if you're hovering over a point...JK
                    if (model.opacity === 0) element.style.opacity = 0
                    else element.style.opacity = 1

                    // update tooltip location depending on which point you're hovering...JK
                    if (model.xAlign === 'left')
                      element.style.transform = `translate(${model.x + X_SPACING}px, ${
                        model.y - element.clientHeight / 2 + model.height / 2
                      }px)`

                    if (model.xAlign === 'right')
                      element.style.transform = `translate(${chart.width - element.clientWidth}px, ${
                        model.y - element.clientHeight / 2 + model.height / 2
                      }px)`
                  }
                },
              },
            },
          }}
        />
        <Tooltip ref={ref}>
          <InnerWrapper caretLocation={caretLocation}>
            <Row>
              <Text fontSize='14px' fontWeight={600}>
                {title}
              </Text>
              <Text fontSize='14px' fontWeight={600}>
                Value
              </Text>
            </Row>
            {rows?.length > 0 && rows}
          </InnerWrapper>
        </Tooltip>
      </Container>
    </Wrapper>
  )
}

LineChart.propTypes = WidgetType

export default LineChart
