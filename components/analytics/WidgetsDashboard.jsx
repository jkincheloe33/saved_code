import { createRef, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

import { colors, devices } from '@assets'
import { Card, HorizontalPercentBarChart, LineChart, Loader, NumberWidget, PercentTotalWidget, Title } from '@components'
import { WIDGET_TYPES } from '@utils'

const ChartWrapper = styled.div`
  margin: 0 22.5px;
  opacity: ${p => (p.visible ? 1 : 0)};
  // account for 22.5px left/right margin...JK
  width: 100% - 45px;
`

const Close = styled(Title)`
  cursor: pointer;
  position: absolute;
  right: 20px;
  top: 0;
`

const Container = styled.div`
  border-left: 0.5px solid ${colors.gray7};
  height: 100%;
  overflow-y: scroll;
  padding: 25px 0 0 12.5px;
`

const InnerWrapper = styled.div`
  display: flex;
  flex-flow: column wrap;
  height: ${p => p.height}px;
  opacity: ${p => (p.visible ? 1 : 0)};
  // needed to calculate offsetTop for children...JK
  position: relative;

  // This creates empty space to help widgets wrap properly...KA
  &::before,
  &::after {
    content: '';
    flex-basis: 100%;
    order: 2;
    width: 0;
  }
`

// prettier-ignore
const OverlayWrapper = styled.div`
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  width: 100%;

  ${p => p.absolute && `
    background-color: ${colors.white};
    border-radius: 20px;
    // account for 25px top offset...JK
    height: calc(100% - 25px);
    left: 35px;
    position: absolute;
    top: 25px;
    // account for 35px left offset and 22.5px margin-right from widgets...JK
    width: calc(100% - 57.5px);
  `}
`

const SubLine = styled.div`
  height: 100%;
  overflow: auto;
  padding: 50px 13px 13px;
  width: 100%;
`

const SubWidget = styled.div`
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  overflow: auto;
  position: relative;
  width: 100%;
`

// prettier-ignore
const WidgetCard = styled(Card)`
  cursor: ${p => p.clickable ? 'pointer' : 'auto'};
  display: flex;
  flex-direction: column;
  margin-bottom: 45px;
  max-width: 375px;
  padding: 20px;

  ${p => p.sub && `
    max-width: none;
    width: 100%;
  `}
`

// prettier-ignore
const WidgetWrapper = styled.div`
  margin: 0 22.5px;
  max-width: 500px;
  width: calc(50% - 45px);

  &:nth-child(2n + 1) {
    order: 1;
  }

  &:nth-child(2n) {
    order: 2;
  }

  ${p => p.sub && `
    max-width: none;
    width: 100%;
  `}

  @media (${devices.xxlDesktop}) {
    width: calc(33.3% - 45px);

    &:nth-child(3n + 1) {
      order: 1;
    }

    &:nth-child(3n + 2) {
      order: 2;
    }

    &:nth-child(3n) {
      order: 3;
    }

    ${p => p.sub && 'width: 100%;'}
  }
`

const Wrapper = styled.div`
  height: 100%;
  position: relative;
`

const WidgetsDashboard = ({
  activeTab,
  dateRange,
  endDate,
  filterGroups,
  filterTraits,
  fromDate,
  reports,
  setSelectedReport,
  startDate,
  widgets,
}) => {
  const [basicWidgets, setBasicWidgets] = useState([])
  const [height, setHeight] = useState(1300) // default value needed to force widgets to wrap on load...JK
  const [lineCharts, setLineCharts] = useState([])
  const [loading, setLoading] = useState(true)
  const [subWidget, setSubWidget] = useState(null)
  // used to track when widgets are finished fetching data...JK
  const [widgetLoadingState, setWidgetLoadingState] = useState(null)

  // tracks if widget data is still loading...JK
  const notReady = (widgetLoadingState && !Object.values(widgetLoadingState).every(bool => bool)) || !widgetLoadingState

  // props shared across all the widgets...JK
  const sharedData = {
    dateRange,
    endDate,
    filterGroups,
    filterTraits,
    startDate,
  }

  // enum to match widget types to components...JK
  const WIDGET_COMPONENTS = {
    [WIDGET_TYPES.LINE_CHART]: LineChart,
    [WIDGET_TYPES.PERCENTAGE_TOTAL]: PercentTotalWidget,
    [WIDGET_TYPES.NUMBER]: NumberWidget,
    [WIDGET_TYPES.PERCENT_BAR_CHART]: HorizontalPercentBarChart,
  }

  // creats an array of refs to assign to each widget...JK
  const refs = useMemo(() => (basicWidgets.length ? basicWidgets.map(() => createRef()) : []), [basicWidgets])

  const renderSubWidget = () => {
    const Component = WIDGET_COMPONENTS?.[subWidget.widgetType]

    if (Component) {
      if (Component === LineChart) {
        return (
          <SubLine>
            <LineChart {...subWidget} {...sharedData} />
          </SubLine>
        )
      }

      return (
        <WidgetWrapper id={`sub-widget-${subWidget.id}`} sub>
          <WidgetCard sub>{Component && <Component {...subWidget} fromDate={fromDate} />}</WidgetCard>
        </WidgetWrapper>
      )
    }

    return null
  }

  // this is needed to reset the default height and loading state for the widgets container in order to force widgets to wrap...JK
  useEffect(() => {
    setBasicWidgets([])
    setLineCharts([])
    setSubWidget(null)
    setWidgetLoadingState(null)
    setHeight(1300)
  }, [activeTab])

  useEffect(() => {
    // only display widgets that aren't hidden...JK
    const visible = widgets.filter(w => !w.hidden)
    const basic = visible.filter(({ widgetType }) => widgetType !== WIDGET_TYPES.LINE_CHART)
    const line = visible.filter(({ widgetType }) => widgetType === WIDGET_TYPES.LINE_CHART)

    // separate out LineCharts from all other widgets due to styling and data structure...JK
    setLineCharts(line)
    setBasicWidgets(basic)
    setLoading(false)

    // if there are line charts but no basic widgets, the widgetLoadingState would remain null. we need to set it to true here in order to remove the loader and display the Line Charts...JK
    if (line.length && basic.length === 0) setWidgetLoadingState(true)
  }, [widgets])

  useEffect(() => {
    // creates or resets the widgetLoading state each time the tab or filters change...JK
    if (basicWidgets.length) {
      // creates an object of numbered keys the same length of the basicWidgets array and sets their values to false...JK
      const loadingObject = basicWidgets.reduce((acc, _, i) => ({ ...acc, [i]: false }), {})
      setWidgetLoadingState(loadingObject)
    }
  }, [basicWidgets, dateRange, filterGroups, filterTraits])

  useEffect(() => {
    // check to see that every component is mounted has finished fetching data from api...JK
    if (refs?.[0]?.current && widgetLoadingState && Object.values(widgetLoadingState).every(bool => bool)) {
      // calculates each widget's offsetTop + clientHeight. whichever number is the highest will be the widget that's lowest on the page
      // this number is what we will use for `setHeight`...JK
      const offsets = refs.map(ref => ref.current.offsetTop + ref.current.clientHeight)
      setHeight(Math.max(...offsets) + 30)
    }
  }, [refs, widgetLoadingState])

  return (
    <Wrapper>
      <Container>
        {loading ? (
          <OverlayWrapper>
            <Loader />
          </OverlayWrapper>
        ) : (
          <>
            {basicWidgets.length > 0 && (
              <InnerWrapper height={height} visible={!subWidget}>
                {basicWidgets.map((w, i) => {
                  const Component = WIDGET_COMPONENTS?.[w.widgetType]

                  return (
                    <WidgetWrapper id={`basic-widget-${w.id}`} key={w.id} ref={refs[i]}>
                      <WidgetCard clickable={!!w.onClick}>
                        {Component && (
                          <Component
                            {...w}
                            {...sharedData}
                            fromDate={fromDate}
                            index={i}
                            reports={reports}
                            setSelectedReport={setSelectedReport}
                            setSubWidget={setSubWidget}
                            setWidgetLoadingState={setWidgetLoadingState}
                            widgets={widgets}
                          />
                        )}
                      </WidgetCard>
                    </WidgetWrapper>
                  )
                })}
              </InnerWrapper>
            )}
            <ChartWrapper visible={!subWidget}>
              {lineCharts.length > 0 &&
                lineCharts.map(lc => (
                  <LineChart
                    {...lc}
                    {...sharedData}
                    key={lc.id}
                    reports={reports}
                    setSelectedReport={setSelectedReport}
                    setSubWidget={setSubWidget}
                    widgets={widgets}
                  />
                ))}
            </ChartWrapper>
          </>
        )}
      </Container>
      {notReady && (
        <OverlayWrapper absolute>
          <Loader />
        </OverlayWrapper>
      )}
      {subWidget && (
        <OverlayWrapper absolute>
          <SubWidget>
            {renderSubWidget()}
            <Close color='blurple' onClick={() => setSubWidget(null)}>
              Close
            </Close>
          </SubWidget>
        </OverlayWrapper>
      )}
    </Wrapper>
  )
}

WidgetsDashboard.propTypes = {
  activeTab: PropTypes.object,
  dateRange: PropTypes.object,
  endDate: PropTypes.any,
  filterGroups: PropTypes.array,
  filterTraits: PropTypes.array,
  fromDate: PropTypes.string,
  reports: PropTypes.array,
  setSelectedReport: PropTypes.func,
  startDate: PropTypes.any,
  widgets: PropTypes.array,
}

export default WidgetsDashboard
