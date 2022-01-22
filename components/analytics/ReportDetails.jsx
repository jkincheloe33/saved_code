import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import styled from 'styled-components'
import { AgGridColumn, AgGridReact } from '@ag-grid-community/react'
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model'

import { CheckmarkIcon5, colors, shadows } from '@assets'
import { Loader, Paragraph, Select, Text, Title } from '@components'
import { useToastContext, useUserContext } from '@contexts'
import { api } from '@services'
import { uId } from '@utils'

const Close = styled(Title)`
  cursor: pointer;
  margin-left: 20px;
`

const Dropdown = styled(Select)`
  background-color: ${colors.gray8};
  background-position: calc(100% - 15px) center;
  border: none;
  border-radius: 20px;
  margin: auto 0;
  padding: 10px 15px;
  width: 107px;
`

const GridWrapper = styled.div`
  height: 100%;
  padding-bottom: 10px;
  position: relative;
  width: 100%;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 30px;
  width: 100%;

  a {
    flex: 1;
    margin: auto 0 auto 30px;
    text-align: right;
  }
`

const LoaderWrapper = styled.div`
  align-items: center;
  background-color: ${colors.white}E6;
  border-radius: 20px;
  display: flex;
  height: calc(100% - 25px);
  justify-content: center;
  left: 35px;
  opacity: ${p => p.opacity};
  pointer-events: none;
  position: absolute;
  top: 25px;
  transition: opacity 250ms ease;
  width: calc(100% - 57.5px);
  z-index: 5;
`

const ReportButtons = styled.div`
  align-items: center;
  display: flex;
`

const ReportInfo = styled.div`
  flex: 1;
  padding-right: 25px;
`

const Wrapper = styled.div`
  border-left: 0.5px solid ${colors.gray7};
  height: 100%;
  padding: 25px 22.5px 45px 35px;
  position: relative;
`

const InnerWrapper = styled.div`
  background-color: ${colors.white};
  border-radius: 20px;
  box-shadow: ${shadows.card};
  display: flex;
  flex-direction: column;
  height: 100%;
`

const ReportDetails = ({ dateRange, filterGroups, filterTraits, report: { description, hidden, id, name }, setSelectedReport }) => {
  const [columnApi, setColumnApi] = useState()
  const [exporting, setExporting] = useState(false)
  const [fields, setFields] = useState([])
  const [gridApi, setGridApi] = useState()
  const [isLoading, setIsLoading] = useState(false)

  const { setToastData } = useToastContext()
  const { user } = useUserContext()

  const handleExport = async e => {
    setExporting(true)
    const asCSV = e.includes('csv')
    const emailReport = e.includes('email')

    const { data } = await api.post(
      '/analytics/exportReport',
      {
        asCSV,
        clientTzOffset: new Date().getTimezoneOffset(),
        emailReport,
        endDate: dateRange?.endDate && moment(dateRange?.endDate).endOf('day'),
        filterGroups: filterGroups.map(fg => fg.id),
        filterTraits: filterTraits.map(ft => ft.id),
        startDate: dateRange.startDate && dateRange.key === 'Custom' ? moment(dateRange.startDate).startOf('day') : dateRange.startDate,
        reportId: id,
      },
      { responseType: 'blob' }
    )

    // Skip these steps if we're emailing the report..JC
    if (data.type !== 'application/json') {
      const url = window.URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href = url

      if (asCSV) link.setAttribute('download', `${name}_${moment().format('YYYYMMDD')}.csv`)
      else link.setAttribute('download', `${name}_${moment().format('YYYYMMDD')}.xlsx`)

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    setExporting(false)

    if (emailReport) {
      setToastData({
        callout: 'Check your email!',
        details: `Report sent to ${user?.email}`,
        gradient: {
          colors: [
            {
              color: 'mint',
              location: '30%',
            },
            {
              color: 'skyBlue',
              location: '100%',
            },
          ],
          position: 'to bottom',
        },
        icon: CheckmarkIcon5,
        id: 'report-details-toast',
      })
    }
  }

  const getDataSource = value => {
    return {
      rowCount: null,
      getRows: async params => {
        setIsLoading(true)

        const { endRow, startRow } = params

        const {
          data: { fields, reportResults, success },
        } = await api.post('/analytics/runReport', {
          endDate: value?.endDate && moment(value?.endDate).endOf('day'),
          endRow,
          filterGroups: filterGroups.map(fg => fg.id),
          filterTraits: filterTraits.map(ft => ft.id),
          reportId: id,
          startDate: value.startDate && value.key === 'Custom' ? moment(value?.startDate).startOf('day') : value?.startDate,
          startRow,
        })

        if (success) {
          setFields(fields)

          fields.forEach(f => {
            if (f.isDate) {
              reportResults.forEach(r => {
                r[f.name] = r[f.name] ? moment(r[f.name]).format('lll') : '-'
              })
            }
          })

          // setTimeout fixes a weird timing issue due to how long our query takes to run...KA
          setTimeout(() => (reportResults.length === 0 ? gridApi.showNoRowsOverlay() : gridApi.hideOverlay()), 100)

          const lastRow = reportResults.length < endRow - startRow ? startRow + reportResults.length : -1

          params.successCallback(reportResults, lastRow)
          setTimeout(() => columnApi?.autoSizeAllColumns(), 10)
        }
        setIsLoading(false)
      },
    }
  }

  // render anchor tag with image or text depending on type...JK
  const linkRenderer = ({ value }) => {
    const { link, src, target, type, value: displayText } = { ...value }

    if (src && type === 'image')
      return `<a href='${link}' rel='noreferrer' target='${target ?? '_blank'}'><img alt='Report Image' src='${src}' /></a>`
    return `<a href='${link}' rel='noreferrer' style='color: blue;' target='${target ?? '_blank'}'>${displayText}</a>`
  }

  useEffect(() => {
    if (
      columnApi &&
      gridApi &&
      dateRange?.startDate &&
      moment(dateRange?.startDate).year() > 1900 &&
      dateRange?.endDate &&
      moment(dateRange?.endDate).year() > 1900
    ) {
      gridApi.setDatasource(getDataSource(dateRange))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnApi, dateRange, filterGroups, filterTraits, gridApi, id])

  return (
    <Wrapper>
      <InnerWrapper>
        <Header>
          <ReportInfo>
            <Text color='gray1' fontSize='24px' fontWeight={700} noClamp>
              {name}
            </Text>
            <Paragraph color='gray3' fontSize='18px'>
              {description}
            </Paragraph>
          </ReportInfo>
          <ReportButtons>
            <Dropdown
              id='select-file-type'
              onChange={e => handleExport(e.target.value)}
              options={[
                { name: 'Download Excel', value: 'excel' },
                { name: 'Download CSV', value: 'csv' },
                ...(user.email
                  ? [
                      { name: 'Send Excel to me', value: 'excel-email' },
                      { name: 'Send CSV to me', value: 'csv-email' },
                    ]
                  : []),
              ]}
              title='Export'
              value=''
            />
            {
              // double equals needed to be truthy and not render a 0 when falsy...JK
              hidden == true && (
                <Close color='blurple' onClick={() => setSelectedReport(null)}>
                  Close
                </Close>
              )
            }
          </ReportButtons>
        </Header>
        <GridWrapper className='ag-theme-alpine' id='results-grid'>
          <AgGridReact
            cacheOverflowSize={2}
            defaultColDef={{ editable: false, resizable: true }}
            infiniteInitialRowCount={1}
            maxBlocksInCache={20}
            maxConcurrentDatasourceRequests={2}
            modules={[InfiniteRowModelModule]}
            onGridReady={params => {
              setGridApi(params.api)
              setColumnApi(params.columnApi)
            }}
            overlayNoRowsTemplate={'<div style="font-size: 24px">No results</div>'}
            paginationPageSize={25}
            rowBuffer={0}
            rowModelType='infinite'
          >
            {fields.map(({ isObject, name }) => {
              return isObject && name === 'link' ? (
                <AgGridColumn colId={uId(name)} cellRenderer={params => params?.value && linkRenderer(params)} field={name} key={name} />
              ) : (
                <AgGridColumn colId={uId(name)} field={name} key={name} />
              )
            })}
          </AgGridReact>
        </GridWrapper>
      </InnerWrapper>
      <LoaderWrapper opacity={isLoading || exporting ? 1 : 0}>
        <Loader />
      </LoaderWrapper>
    </Wrapper>
  )
}

ReportDetails.propTypes = {
  dateRange: PropTypes.object,
  filterGroups: PropTypes.array,
  filterTraits: PropTypes.array,
  report: PropTypes.shape({
    description: PropTypes.string,
    hidden: PropTypes.number,
    id: PropTypes.number,
    name: PropTypes.string,
  }),
  setSelectedReport: PropTypes.func,
}

export default ReportDetails
