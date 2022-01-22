import { useEffect, useMemo, useState } from 'react'
import moment from 'moment'
import styled from 'styled-components'

import { colors, CurvedCorner, devices, shadows } from '@assets'
import {
  DatePicker,
  DynamicContainer,
  Layout,
  RealmFilter,
  ReportDetails,
  ReportsListWidget,
  Text,
  Title,
  TraitFilter,
  WidgetsDashboard,
} from '@components'
import { useRouter } from 'next/router'
import { api } from '@services'
import { getDateRanges } from '@utils'

const Column = styled.div`
  display: none;
  flex: 0 0 395px;
  margin-right: 25px;
  padding: 25px 10px 0;

  @media (${devices.largeDesktop}) {
    display: block;
  }
`

const Container = styled(DynamicContainer)`
  background-color: ${colors.gray8};
  display: none;
  flex-direction: column;
  padding: 25px 25px 0;

  @media (${devices.largeDesktop}) {
    display: flex;
  }
`

const Content = styled.div`
  background-color: ${colors.white};
  box-shadow: ${shadows.card};
  display: flex;
  flex: 1;
  overflow: hidden;
  padding: 0 2.5px 0 15px;
  width: 100%;
`

const Filters = styled.div`
  display: flex;
  flex: 0 0 140px;
  flex-direction: column;
  // this allows the filters to sit over top the content box-shadow...JK
  position: relative;
`

const MainContent = styled.div`
  flex: 1;
`

const MobileWrapper = styled.main`
  display: block;
  padding-top: 100px;

  @media (${devices.largeDesktop}) {
    display: none;
  }
`

const Overlay = styled.div`
  background-color: ${colors.white}D9;
  bottom: 0;
  display: ${p => (p.showOverlay ? 'block' : 'none')};
  height: 100%;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  width: 100%;
  z-index: 1;
`

const FiltersWrapper = styled.div`
  align-items: center;
  background-color: ${colors.white};
  border-bottom: 0.5px solid ${colors.gray7};
  border-top-right-radius: 12px;
  border-top-left-radius: ${p => (p.notFirstTab ? '12px' : 0)};
  box-shadow: 0 -10px 15px ${colors.blue}12;
  display: flex;
  flex: 1;
  padding: 25px;
  transition: all 250ms ease;
`

const Tab = styled.div`
  border-radius: 12px 12px 0 0;
  box-shadow: ${p => (p.active ? `0 -10px 15px ${colors.blue}12` : `0 50px 15px ${colors.white}00`)};
  cursor: pointer;
  padding: 17px 25px;
  position: relative;
  transition: box-shadow 250ms cubic-bezier(0.96, 0.01, 0.04, 0.99);
`

// prettier-ignore
const TabBackground = styled.div`
  height: 100%;
  position: relative;
  width: 100%;

  &::before,
  &::after {
    background-image: url(${CurvedCorner});
    background-size: 12px 11px;
    bottom: -0.5px;
    height: 11px;
    position: absolute;
    width: 12px;
  }

  &::after {
    content: '';
    left: calc(100% - 1px);
  }

  ${p => p.notFirstTab && `
    &::before {
      content: '';
      right: calc(100% - 1px);
      transform: scaleX(-1);
    }
  `}
`

const TabBackgroundWrapper = styled.div`
  background-color: ${colors.white};
  border-radius: 12px 12px 0 0;
  height: 100%;
  left: 0;
  pointer-events: none;
  position: absolute;
  top: 0;
  transform: translateY(${p => (p.active ? 0 : '100%')});
  transition: transform 250ms cubic-bezier(0.96, 0.01, 0.04, 0.99);
  width: 100%;
  // needed to sit below Text...JK
  z-index: 0;
`

const TabText = styled(Text)`
  position: relative;
  z-index: 1;
`

const Tabs = styled.div`
  background-color: ${colors.gray8};
  display: flex;
  width: 100%;
`

const Analytics = () => {
  const [activeReportTab, setActiveReportTab] = useState(0)
  const [activeTab, setActiveTab] = useState(null)
  const [dateRange, setDateRange] = useState({ startDate: moment().subtract('30', 'd'), endDate: moment(), key: '30' })
  const [filterGroups, setFilterGroups] = useState([])
  // used to track when widgets are finished fetching data...JK
  const [filterLoadingState, setFilterLoadingState] = useState(null)
  const [filterTraits, setFilterTraits] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [showDateRange, setShowDateRange] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [tabs, setTabs] = useState([])
  const [widgets, setWidgets] = useState([])

  const {
    query: { dashboards, report },
    replace,
  } = useRouter()

  const handleFilterChange = async value => {
    if (value === 'Custom') {
      setShowDateRange(true)
      // custom date filter handles setting dateRange...JK
      return setDateRange({ startDate: undefined, endDate: undefined, key: value })
    } else if (value === 'Last Month') {
      // gets first and last days of previous month...JK
      setDateRange({
        startDate: values.prevMonthFirstDay,
        endDate: moment().subtract(1, 'months').endOf('month'),
        key: 'Last Month',
      })
    } else if (value === 'Last Quarter') {
      // gets first and last days of previous quarter...KA
      setDateRange({
        startDate: values.prevQuarterFirstDay,
        endDate: moment().subtract(1, 'quarter').endOf('quarter'),
        key: 'Last Quarter',
      })
    } else if (value === 'Month to Date') {
      // gets first day of the month and current date...JK
      setDateRange({ startDate: values.beginningOfMonth, endDate: moment(), key: 'Month to Date' })
    } else if (value === 'Quarter to Date') {
      // gets first day of the quarter and current date...KA
      setDateRange({ startDate: values.beginningOfQuarter, endDate: moment(), key: 'Quarter to Date' })
    } else {
      // subtracts (value) days from the current date...JK
      setDateRange({ startDate: moment().subtract(value, 'd'), endDate: moment(), key: value })
    }
    setShowDateRange(false)
  }

  // list of current filters stored in an array in order to pair each component with an index.
  // this index is used to track each component's loading state in the `filterLoadingState` state object...JK
  const filters = useMemo(
    () => [
      {
        Component: RealmFilter,
        data: {
          activeTab,
          filterGroups,
          full: true,
          setFilterGroups,
          setShowOverlay,
        },
      },
      {
        Component: TraitFilter,
        data: {
          dashboard: activeTab,
          filterTraits,
          setFilterTraits,
        },
      },
      {
        Component: DatePicker,
        data: {
          dates: dateRange,
          hidden: Boolean(activeTab?.dateRangeHidden),
          onChange: handleFilterChange,
          setDateRange,
          showDateRange,
          value: dateRange.key,
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTab, dateRange, filterGroups, filterTraits, showDateRange]
  )

  const { values } = getDateRanges()

  useEffect(() => {
    if (dashboards && tabs.length) {
      const existingDashboard = tabs.find(({ name }) => dashboards[0].toLowerCase() === name.toLowerCase())
      if (existingDashboard) {
        setActiveTab(existingDashboard)
        if (!report) replace('/analytics')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboards, tabs])

  useEffect(() => {
    const getDashboardList = async () => {
      const {
        data: { dashboards, success },
      } = await api.get('/analytics/getDashboardList')

      if (success) {
        setTabs(dashboards)
        // set active tab to first item in dashboard list...JK
        setActiveTab(dashboards[0])
        setIsLoading(false)
      }
    }

    getDashboardList()
  }, [])

  useEffect(() => {
    const getReports = async () => {
      const {
        data: { reports, success },
      } = await api.post('/analytics/getReportList', { id: activeTab.id })

      if (success) {
        setWidgets(reports.filter(r => r.isWidget))
        setReports(reports.filter(r => r.isReport))
      }
    }
    if (!isLoading) getReports()
  }, [activeTab, isLoading])

  // used to create the object for the filters to track the loading state in `filterLoadingState`
  useEffect(() => {
    // reset widgets, reports and filterLoadingState to prevent "flashing" of widgets...JK
    setWidgets([])
    setReports([])
    setFilterLoadingState(null)
    if (activeTab) {
      // this creates an object with keys that correspond with the filters array index...JK
      const loadingObject = filters?.reduce((acc, _, i) => ({ ...acc, [i]: false }), {})
      setFilterLoadingState(loadingObject)
      // check if active tab has a defaultDateRange, otherwise set to the 30 day default dateRange...JK
      if (activeTab.defaultDateRange) handleFilterChange(activeTab.defaultDateRange)
    } else handleFilterChange(values.last30Days)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  return (
    <>
      <Overlay showOverlay={showOverlay} />
      <Layout full head='Analytics' id='analytics' loading={isLoading}>
        <Container id='analytics-container' noScroll>
          <Filters>
            <Tabs>
              {tabs.length > 0 &&
                tabs.map((t, i) => (
                  <Tab key={t.id}>
                    <TabText
                      active={activeTab?.id === t.id}
                      color={activeTab?.id === t.id ? 'digitalBlue' : 'gray1'}
                      fontSize='18px'
                      id={`dashboard-tab-${t.id}`}
                      onClick={() => {
                        if (activeTab?.id !== t.id) {
                          setActiveReportTab(0)
                          setActiveTab(t)
                          setSelectedReport(null)
                        }
                      }}
                    >
                      {t.name}
                    </TabText>
                    <TabBackgroundWrapper active={activeTab?.id === t.id}>
                      <TabBackground notFirstTab={tabs?.[0]?.id !== tabs?.[i]?.id} />
                    </TabBackgroundWrapper>
                  </Tab>
                ))}
            </Tabs>
            <FiltersWrapper notFirstTab={activeTab?.id !== tabs?.[0]?.id}>
              {filters.map(({ Component, data }, i) => {
                return (
                  Component && (
                    <Component
                      {...data}
                      filterLoadingState={filterLoadingState}
                      index={i}
                      key={i}
                      setFilterLoadingState={setFilterLoadingState}
                    />
                  )
                )
              })}
            </FiltersWrapper>
          </Filters>
          <Content>
            <Column>
              <ReportsListWidget
                activeReportTab={activeReportTab}
                activeTab={activeTab}
                hasWidgets={widgets.length > 0}
                reports={reports}
                selectedReport={selectedReport}
                setActiveReportTab={setActiveReportTab}
                setSelectedReport={setSelectedReport}
              />
            </Column>
            {/* don't render MainContent until all filters' loading state are set to true...JK */}
            {filterGroups.length > 0 && filterLoadingState && Object.values(filterLoadingState).every(bool => bool) && (
              <MainContent>
                {selectedReport && (
                  <ReportDetails
                    dateRange={dateRange}
                    filterGroups={filterGroups}
                    filterTraits={filterTraits}
                    report={selectedReport}
                    setSelectedReport={setSelectedReport}
                  />
                )}
                {widgets.length > 0 && !selectedReport && (
                  <WidgetsDashboard
                    activeTab={activeTab}
                    dateRange={dateRange}
                    endDate={
                      // if key is not custom, an endDate will already be formatted by moment...JK
                      dateRange.key !== 'Custom'
                        ? dateRange.endDate.endOf('day')
                        : // if custom date range is set, format to the end of day...JK
                        dateRange.endDate
                        ? moment(dateRange.endDate).endOf('day')
                        : // pass undefined when user selects custom option but hasn't selected the dates yet...PS & JK
                          undefined
                    }
                    filterGroups={filterGroups}
                    filterTraits={filterTraits}
                    reports={reports}
                    setSelectedReport={setSelectedReport}
                    startDate={
                      dateRange.startDate && dateRange.key === 'Custom' ? moment(dateRange.startDate).startOf('day') : dateRange.startDate
                    }
                    widgets={widgets}
                  />
                )}
              </MainContent>
            )}
          </Content>
        </Container>
        <MobileWrapper>
          <Title>This page is not available on mobile</Title>
        </MobileWrapper>
      </Layout>
    </>
  )
}

export default Analytics
