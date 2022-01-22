import { useEffect } from 'react'
import { useRouter } from 'next/router'
import styled from 'styled-components'
import PropTypes from 'prop-types'

import { colors, RightArrowGrayIcon } from '@assets'
import { Image, Paragraph, Text } from '@components'

const Bar = styled.div`
  background-color: ${colors.blue};
  border-radius: 15px;
  height: 74px;
  opacity: ${p => (p.active ? 1 : 0)};
  transform: translateX(${p => (p.active ? 0 : '-20px')});
  transition: all 700ms cubic-bezier(0.52, 0.01, 0.35, 1);
  width: 4px;
`

const NoResults = styled(Text)`
  padding: 20px;
  text-align: center;
`

const ReportsCard = styled.div`
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;
  padding-bottom: 45px;
  position: relative;

  &::before {
    background-color: ${colors.lightBlue}4D;
    border-radius: 12px;
    content: '';
    height: 114px;
    left: 0;
    position: absolute;
    top: 0;
    transform: translateY(${p => p.activeRow * 100}%);
    transition: transform 500ms cubic-bezier(0.52, 0.01, 0.35, 1);
    width: 100%;
    z-index: 0;
  }
`

const ReportInfo = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  margin-right: 30px;
  transform: translateX(${p => (p.active ? '15px' : 0)});
  transition: transform 700ms cubic-bezier(0.52, 0.01, 0.35, 1);
`

const ReportRow = styled.div`
  align-items: center;
  display: flex;
  padding: 20px;
  // needed to sit on top of white background pseudo element...JK
  position: relative;

  img {
    margin: auto;
  }

  ${Paragraph} {
    padding-top: 8px;
  }
`

const Wrapper = styled.div`
  height: 100%;
`

const ReportsListWidget = ({
  activeReportTab,
  activeTab,
  hasWidgets = false,
  reports,
  selectedReport,
  setActiveReportTab,
  setSelectedReport,
}) => {
  const { query, replace } = useRouter()

  const handleReportOpen = (reportId, index) => {
    setSelectedReport(reports.filter(r => r.id === reportId)[0])
    setActiveReportTab(index)
  }

  // used to set the first report as active if there are no widgets...JK
  useEffect(() => {
    // no widgets, has reports and there is no query.report...JK
    if (!hasWidgets && reports.length && (!query || query.report === undefined)) handleReportOpen(reports[0].id, 0)
    // if selectedReport is truthy here, that means it was set via query params and we don't need to set it to null...JK
    else if (!selectedReport) {
      setSelectedReport(null)
      setActiveReportTab(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasWidgets, reports])

  useEffect(() => {
    if (query?.report && reports.length && reports.every(({ dashboardId }) => dashboardId === activeTab?.id)) {
      // checks to see if query.report exists and if it does, set it as the selectedReport and clean the url...CY
      const queryReport = reports.find(
        // match report by name or id...JK
        ({ id, name, isReport }) => (query.report.toLowerCase() === name.toLowerCase() || query.report == id) && isReport
      )
      if (queryReport) {
        // filter out hidden reports and find the position of the query report in the array. used to setActiveReportTab...JK
        const index = reports.filter(r => !r.hidden).indexOf(queryReport)

        setSelectedReport(queryReport)
        // if active dashboard has widgets, we add 1 to the index. otherwise just set the index or -1 if report is not visible...JK
        setActiveReportTab(hasWidgets ? index + 1 : index ?? -1)
      }
      replace('/analytics')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, reports])

  return (
    <Wrapper>
      <ReportsCard activeRow={activeReportTab}>
        {hasWidgets && (
          <ReportRow
            id='report-dashboard'
            key='dashboard-tab'
            onClick={() => {
              setSelectedReport(null)
              setActiveReportTab(0)
            }}
          >
            <Bar active={activeReportTab === 0} />
            <ReportInfo active={activeReportTab === 0}>
              <Text color='gray1' fontWeight={700}>
                Dashboard
              </Text>
              <Paragraph color='gray3' maxLines={2}>
                {activeTab?.description ?? `An overview of current data related to ${activeTab?.name}`}
              </Paragraph>
            </ReportInfo>
            <Image alt='dashboard-id' src={RightArrowGrayIcon} />
          </ReportRow>
        )}
        {reports.length > 0 ? (
          reports
            .filter(r => !r.hidden)
            .map(({ description, id, name }, i) => {
              const index = hasWidgets ? i + 1 : i

              return (
                <ReportRow id={`report-${id}`} key={id} onClick={() => handleReportOpen(id, index)}>
                  <Bar active={activeReportTab === index} />
                  <ReportInfo active={activeReportTab === index}>
                    <Text color='gray1' fontWeight={700}>
                      {name}
                    </Text>
                    <Paragraph color='gray3' maxLines={2}>
                      {description}
                    </Paragraph>
                  </ReportInfo>
                  <Image alt={`${id}-arrow`} src={RightArrowGrayIcon} />
                </ReportRow>
              )
            })
        ) : (
          <NoResults>No reports available</NoResults>
        )}
      </ReportsCard>
    </Wrapper>
  )
}

ReportsListWidget.propTypes = {
  activeReportTab: PropTypes.number,
  activeTab: PropTypes.object,
  hasWidgets: PropTypes.bool,
  reports: PropTypes.array,
  selectedReport: PropTypes.object,
  setActiveReportTab: PropTypes.func,
  setSelectedReport: PropTypes.func,
}

export default ReportsListWidget
