import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { AgGridReact, AgGridColumn } from '@ag-grid-community/react'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import moment from 'moment'

import { colors } from '@assets'
import { LinkTraitsModal, Modal, TabBar, Select } from '@components'
import { api } from '@services'
import { getDateRanges, WIDGET_TYPES } from '@utils'

const ItemRow = styled.div`
  background-color: ${colors.white};
  border: 1px solid ${colors.gray8};
  display: flex;
  font-size: 20px;
  justify-content: space-between;
  padding: 20px;

  button {
    height: 30px;
    margin: auto 0;
  }
`

const Dropdown = styled(Select)`
  padding: 5px 0 5px 15px;
  width: 280px;
`

const ON_CLICK_TYPE = {
  IS_REPORT: 1,
  IS_WIDGET: 2,
}

const ON_CLICK_OPTIONS = [
  { name: 'Is Report', value: ON_CLICK_TYPE.IS_REPORT },
  { name: 'Is Widget', value: ON_CLICK_TYPE.IS_WIDGET },
]

const TAB_KEYS = {
  REPORT: 0,
  WIDGET: 1,
  TRAITS: 2,
}

const TABS = ['Report SQL', 'Widget SQL', 'Traits']

let lastNewId = 0

const AnalyticsEditor = () => {
  const [contextMenu, setContextMenu] = useState()
  const [currentTab, setCurrentTab] = useState(TAB_KEYS.REPORT)
  const [copyText, setCopyText] = useState('Copy Link')
  const [gridApi, setGridApi] = useState(null)
  const [isTraitsModalOpen, setIsTraitsModalOpen] = useState(false)
  const [isTraitTypesModalOpen, setIsTraitTypesModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [originalSelectedRecord, setOriginalSelectedRecord] = useState(null)
  const [relatedTraits, setRelatedTraits] = useState([])
  const [reports, setReports] = useState([])
  const [rowDashboard, setRowDashboard] = useState(null)
  const [selectedDashboard, setSelectedDashboard] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [reportList, setReportList] = useState([])
  const [traitTypes, setTraitTypes] = useState([])
  const [widgetType, setWidgetType] = useState(null)
  const [widgetOnClick, setWidgetOnClick] = useState(null)

  useEffect(() => {
    async function loadReports() {
      // On initial load, get the report list...EK
      const { data } = await api.post('/config/analytics/reports/list', { dashboardId: selectedDashboard.id })
      const onClick = data?.reportsForAccount[0]?.onClick

      setReports(data.reportsForAccount)
      setTimeout(() => {
        getRelatedItems(data?.reportsForAccount[0])
        setSelectedRecord(data?.reportsForAccount[0])
        setWidgetType(data?.reportsForAccount[0]?.widgetType)
        // check if onClick needs to be parsed...JK
        setWidgetOnClick(onClick && (typeof onClick === 'object' ? onClick : JSON.parse(onClick)))
      }, 0)
    }

    if (selectedDashboard) loadReports()
  }, [selectedDashboard])

  useEffect(() => {
    // allow empty string in order to set onClick to null on backend...JK
    if ((widgetOnClick || widgetOnClick === '') && selectedRecord) updateWidgetOnClick(widgetOnClick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetOnClick])

  useEffect(() => {
    if (widgetType && selectedRecord) updateWidgetType(widgetType)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetType])

  const onGridReady = async params => {
    setGridApi(params.api)

    const {
      data: { dashboards, msg, success },
    } = await api.get('/config/analytics/dashboards/list')
    if (success) setRowDashboard(dashboards)
    else alert(msg)
  }

  const getRelatedItems = async r => {
    const {
      data: { relatedTraits, success },
    } = await api.post('/config/analytics/relatedItems', { reportId: r?.id })
    if (success) setRelatedTraits(relatedTraits)
  }

  useEffect(() => {
    const getTraitTypes = async () => {
      const {
        data: { success, traitTypes },
      } = await api.post('/config/traitTypes/list')

      if (success) setTraitTypes(traitTypes)
    }

    if (isTraitTypesModalOpen) getTraitTypes()
  }, [isTraitTypesModalOpen])

  useEffect(() => {
    const getReports = async () => {
      const {
        data: { success, reportList },
      } = await api.post('/config/analytics/reports/listAll')
      if (success) setReportList(reportList)
    }

    if (isReportModalOpen) getReports()
  }, [isReportModalOpen])

  const newDashboard = async () => {
    setRowDashboard(rd => [
      {
        id: --lastNewId,
      },
      ...rd,
    ])
  }

  const newReport = async () => {
    // NOTE: I didn't apply the account Id.  This is controlled at the service level and applied to the user based on the url...EK
    const newReport = {
      id: --lastNewId,
      name: 'New Report',
      description: '',
    }

    const { data: insertRes } = await api.post('/config/analytics/reports/save', { dashboardId: selectedDashboard.id, inserted: newReport })
    newReport.id = insertRes.newId

    setReports([...reports, newReport])

    setTimeout(() => {
      // Select the newly created record...EK
      setSelectedRecord(newReport)
      setOriginalSelectedRecord(newReport)
    }, 0)
  }

  const handleCheckbox = key => params => {
    const newValue = params.node.data[key] == 1 ? 0 : 1
    params.node.setDataValue(key, newValue)
  }

  const handleRecordEdit = (property, value) => setSelectedRecord(prev => ({ ...prev, [property]: value }))

  const saveDashboard = async ({ data }) => {
    if (data.id < 0) {
      const {
        data: { newId },
      } = await api.post('/config/analytics/dashboards/save', { inserted: data })

      const newRow = gridApi.getRowNode(data.id)
      if (newRow) newRow.setDataValue('id', newId)
    } else {
      await api.post('/config/analytics/dashboards/save', { updated: data })
    }
  }

  const saveFieldRecordEdits = async () => {
    // Compare edit vs original to see if there are changes to be made...EK
    if (JSON.stringify(selectedRecord) !== JSON.stringify(originalSelectedRecord)) {
      await api.post('/config/analytics/reports/save', { updated: selectedRecord })
      setOriginalSelectedRecord(selectedRecord)

      // Merge back into the list array...EK
      let indexOfRecord = reports.findIndex(r => r.id === selectedRecord.id)
      setReports([...reports.slice(0, indexOfRecord), selectedRecord, ...reports.slice(indexOfRecord + 1)])
    }

    // ELSE: No changes detected...EK
  }

  const deleteDashboard = async () => {
    if (!selectedDashboard) return alert('No record selected to delete.')

    if (selectedDashboard.id < 0) {
      setRowDashboard(rowDashboard.filter(r => r.id !== selectedDashboard.id))
    } else {
      if (confirm(`About to Delete '${selectedDashboard.name}'.  Are you sure you want to do this?`)) {
        const {
          data: { msg, success },
        } = await api.post('/config/analytics/dashboards/save', { deleted: selectedDashboard })

        if (success) {
          setRowDashboard(rowDashboard.filter(r => r.id !== selectedDashboard.id))
          setSelectedDashboard(null)
        } else alert('UNABLE TO DELETE: ' + msg)
      }
    }
  }

  const deleteReport = async () => {
    if (selectedRecord == null) {
      alert('No record selected to delete.')
    }

    if (confirm(`About to Delete '${selectedRecord.name}'.  Are you sure you want to do this?`)) {
      let { data: deletedRes } = await api.post('/config/analytics/reports/save', { deleted: selectedRecord })
      if (deletedRes.success) {
        const newReportList = reports.filter(r => r.id !== selectedRecord.id)
        setReports(newReportList)
        setSelectedRecord(newReportList[0])
        setOriginalSelectedRecord(newReportList[0])
      } else {
        alert(deletedRes.msg)
      }
    }
  }

  const unLinkReport = async () => {
    if (selectedRecord == null) {
      alert('No record selected to delete.')
    }

    if (confirm(`About to Unlink '${selectedRecord.name}' from ${selectedDashboard.name}.  Are you sure you want to do this?`)) {
      let {
        data: { msg, success },
      } = await api.post('/config/analytics/reports/unlink', {
        dashboardId: selectedDashboard.id,
        reportId: selectedRecord.id,
      })
      if (success) {
        const newReportList = reports.filter(r => r.id !== selectedRecord.id)
        setReports(newReportList)
        setSelectedRecord(newReportList[0])
        setOriginalSelectedRecord(newReportList[0])
      } else {
        alert(msg)
      }
    }
  }

  const _runReport = async () => {
    try {
      const {
        data: { success, msg, reportResults },
      } = await api.post('/analytics/runReport', {
        reportId: selectedRecord.id,
        startDate: moment().subtract('30', 'd').startOf('day'),
      })
      if (success) {
        console.log(`${selectedRecord.name} Report Results Below`)
        console.table(reportResults)
      } else {
        alert(msg)
      }
    } catch (error) {
      console.error(error)
      alert('The report did not run correctly and threw an error. Check browser console for error info.')
    }
  }

  const _runWidget = async () => {
    try {
      const {
        data: { success, msg, widgetResults },
      } = await api.post('/analytics/runWidget', { widgetId: selectedRecord.id, startDate: moment().subtract('30', 'd').startOf('day') })
      if (success) {
        console.log(`${selectedRecord.name} Widget Results Below`)
        console.table(widgetResults)
      } else {
        alert(msg)
      }
    } catch (error) {
      console.error(error)
      alert('The report did not run correctly and threw an error. Check browser console for error info.')
    }
  }

  const _exportReport = async (asCSV = false) => {
    let { data } = await api.post(
      '/analytics/exportReport',
      { clientTzOffset: new Date().getTimezoneOffset(), reportId: selectedRecord.id, asCSV },
      { responseType: 'blob' }
    )
    const url = window.URL.createObjectURL(new Blob([data]))
    const link = document.createElement('a')
    link.href = url

    if (asCSV === true) {
      link.setAttribute('download', `${selectedRecord.name}_export.csv`)
    } else {
      link.setAttribute('download', `${selectedRecord.name}_export.xlsx`)
    }

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const linkTrait = async item => {
    const {
      data: { newLinkId, success },
    } = await api.post('/config/analytics/linkTrait', { reportId: selectedRecord.id, traitId: item.id })

    if (success) setRelatedTraits(rt => [...rt, { ...item, id: newLinkId, traitId: item.id }])
  }

  const linkTraitType = async item => {
    const data = {
      id: selectedDashboard.id,
      filterTraitTypeId: item.id,
    }

    const { data: success } = await api.post('/config/analytics/dashboards/save', { updated: data })

    if (success) {
      // Merge into dashboard list, update selected...JC
      const indexOfDashboard = rowDashboard.findIndex(r => r.id === selectedDashboard.id)
      const updatedDashboard = { ...selectedDashboard, filterTraitTypeId: item.id, filterTraitTypeName: item.name }

      setRowDashboard([...rowDashboard.slice(0, indexOfDashboard), updatedDashboard, ...rowDashboard.slice(indexOfDashboard + 1)])
      setSelectedDashboard(updatedDashboard)
    }
  }

  const unlinkTrait = async id => {
    const {
      data: { success },
    } = await api.post('/config/analytics/unlinkTrait', { id })

    if (success) setRelatedTraits(rg => rg.filter(t => t.id !== id))
  }

  const unlinkTraitType = async () => {
    const data = {
      id: selectedDashboard.id,
      filterTraitTypeId: null,
    }

    const { data: success } = await api.post('/config/analytics/dashboards/save', { updated: data })

    if (success) {
      // Merge into the dashboard list, update selected...JC
      const indexOfDashboard = rowDashboard.findIndex(r => r.id === selectedDashboard.id)
      const updatedDashboard = { ...selectedDashboard, filterTraitTypeId: null, filterTraitTypeName: null }

      setRowDashboard([...rowDashboard.slice(0, indexOfDashboard), updatedDashboard, ...rowDashboard.slice(indexOfDashboard + 1)])
      setSelectedDashboard(updatedDashboard)
    }
  }

  const renderTraitsTab = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <button onClick={() => setIsTraitsModalOpen(true)}>Add Trait</button>
        {relatedTraits.map(({ id, name, traitId, traitTypeName }) => (
          <ItemRow key={id}>
            <div style={{ flexDirection: 'column' }}>
              {name} ({traitId})<div style={{ fontSize: '14px' }}>{traitTypeName}</div>
            </div>
            <button onClick={() => unlinkTrait(id)}>Unlink</button>
          </ItemRow>
        ))}
      </div>
    )
  }

  const updateWidgetOnClick = async type => {
    if (selectedRecord.widgetOnClick !== type) {
      // check if object needs to be stringified before saving...JK
      const updated = { ...selectedRecord, onClick: typeof type === 'object' ? JSON.stringify(type) : type }
      await api.post('/config/analytics/reports/save', { updated })

      setOriginalSelectedRecord(updated)
      setSelectedRecord(updated)

      // Merge back into the list array...EK
      let indexOfRecord = reports.findIndex(r => r.id === selectedRecord.id)
      setReports([...reports.slice(0, indexOfRecord), updated, ...reports.slice(indexOfRecord + 1)])
    }
  }

  const updateWidgetType = async type => {
    if (selectedRecord.widgetType !== type) {
      const updated = { ...selectedRecord, widgetType: Number(type) }
      await api.post('/config/analytics/reports/save', { updated })

      setOriginalSelectedRecord(updated)
      setSelectedRecord(updated)

      // Merge back into the list array...EK
      let indexOfRecord = reports.findIndex(r => r.id === selectedRecord.id)
      setReports([...reports.slice(0, indexOfRecord), updated, ...reports.slice(indexOfRecord + 1)])
    }
  }

  const copyLink = () => {
    setCopyText('Copied')
    setTimeout(() => setCopyText('Copy Link'), 1000)
    navigator.clipboard.writeText(
      `${window.location.origin}/analytics/${encodeURIComponent(selectedDashboard.name)}?report=${encodeURIComponent(selectedRecord.name)}`
    )
  }

  const linkReport = async report => {
    const {
      data: { success },
    } = await api.post('/config/analytics/reports/link', { dashboardId: selectedDashboard.id, reportId: report.id })

    if (success) setReports([...reports, report])
  }

  const renderDefaultDateRange = ({ data }) => {
    return (
      <Dropdown
        defaultValue={data?.defaultDateRange ?? ''}
        onChange={e => saveDashboard({ data: { ...data, defaultDateRange: e.target.value } })}
        options={getDateRanges()?.options}
        title='Select Default Date Range'
      />
    )
  }

  const renderWidgetOnClick = () => {
    // object structure needs to be { reportId: number, isReport: bool, isWidget: bool }...JK
    const onClick = (e, state) => {
      const target = e.target.value
      const isReport = target == ON_CLICK_TYPE.IS_REPORT
      const isWidget = target == ON_CLICK_TYPE.IS_WIDGET

      return { ...state, isReport, isWidget }
    }

    return (
      <Select
        onChange={e => setWidgetOnClick(woc => onClick(e, woc))}
        options={ON_CLICK_OPTIONS}
        title='Select Report or Widget'
        value={
          // check if report or widget is truthy. if neither, set to empty string...JK
          widgetOnClick?.isReport ? ON_CLICK_TYPE.IS_REPORT : widgetOnClick?.isWidget ? ON_CLICK_TYPE.IS_WIDGET : ''
        }
      />
    )
  }

  const hideDateRange = ({ data }) => {
    saveDashboard({ data: { ...data, dateRangeHidden: data.dateRangeHidden ? 0 : 1 } })
  }

  const hideGroupFilter = ({ data }) => {
    saveDashboard({ data: { ...data, groupFilterHidden: data.groupFilterHidden ? 0 : 1 } })
  }

  return (
    <div style={{ height: '100%', width: '100%', marginBottom: '10px' }}>
      <div>
        <button onClick={newDashboard}>New</button>
        <button onClick={deleteDashboard}>Delete</button>
        {selectedDashboard && (
          <button onClick={() => setIsTraitTypesModalOpen(true)}>
            {selectedDashboard.filterTraitTypeId ? 'Edit Filter Trait Type' : 'Add Filter Trait Type'}
          </button>
        )}
      </div>
      <div
        id='dashboardGrid'
        style={{
          height: '60%',
        }}
        className='ag-theme-alpine'
      >
        <AgGridReact
          components={{
            requiredCheckbox: ({ data }) => (data.limitedToUserTraits == 1 ? '<input type="checkbox" checked>' : '<input type="checkbox">'),
            dateRangeHidden: ({ data }) => (data.dateRangeHidden == 1 ? '<input type="checkbox" checked>' : '<input type="checkbox">'),
            groupFilterHidden: ({ data }) => (data.groupFilterHidden == 1 ? '<input type="checkbox" checked>' : '<input type="checkbox">'),
          }}
          defaultColDef={{
            editable: true,
            resizable: true,
            width: 100,
          }}
          enterMovesDown={true}
          enterMovesDownAfterEdit={true}
          getRowNodeId={data => data.id}
          modules={[ClientSideRowModelModule]}
          onCellValueChanged={saveDashboard}
          onGridReady={onGridReady}
          onSelectionChanged={() => setSelectedDashboard(gridApi.getSelectedRows()[0])}
          rowData={rowDashboard}
          rowSelection='single'
        >
          <AgGridColumn editable={false} field='id' width={80} />
          <AgGridColumn field='name' flex={1} />
          <AgGridColumn field='description' flex={1} />
          <AgGridColumn
            cellRendererFramework={renderDefaultDateRange}
            cellStyle={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}
            editable={false}
            field='defaultDateRange'
            flex={1}
            minWidth={300}
          />
          <AgGridColumn
            cellRenderer='dateRangeHidden'
            cellStyle={{ textAlign: 'center' }}
            editable={false}
            field='Hide Date Range'
            onCellClicked={hideDateRange}
            width={140}
          />
          <AgGridColumn
            cellRenderer='groupFilterHidden'
            cellStyle={{ textAlign: 'center' }}
            editable={false}
            field='Hide Group Filter'
            onCellClicked={hideGroupFilter}
            width={160}
          />
          <AgGridColumn editable={false} field='filterTraitTypeName' headerName='Filter Trait Type' width={200} />
          <AgGridColumn
            cellRenderer='requiredCheckbox'
            cellStyle={{ textAlign: 'center' }}
            editable={false}
            field='limitedToUserTraits'
            onCellClicked={handleCheckbox('limitedToUserTraits')}
            width={175}
          />
          <AgGridColumn field='order' width={100} />
        </AgGridReact>
      </div>
      {selectedDashboard && (
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%' }}>
          <div style={{ height: '100%', width: '300px', marginRight: '5px', backgroundColor: '#fff' }}>
            <span style={{ fontSize: 30 }}>{selectedDashboard.name} Reports</span>

            <div>
              <button onClick={newReport}>New Report</button>
              <button onClick={() => setIsReportModalOpen(true)}>Link Report</button>
              <button onClick={unLinkReport}>UnLink Report</button>
              <button onClick={copyLink}>{copyText}</button>
              <button onClick={deleteReport}>Delete Report</button>
            </div>
            {reports.map(r => {
              return (
                <div
                  key={r.id}
                  style={{
                    padding: 5,
                    cursor: 'pointer',
                    color: selectedRecord && selectedRecord.id === r.id ? colors.blurple : '#000',
                  }}
                  onClick={() => {
                    setSelectedRecord(r)
                    setOriginalSelectedRecord(r)
                    getRelatedItems(r)
                    // check if data needs to be parsed...JK
                    setWidgetOnClick(r?.onClick && (typeof r.onClick === 'object' ? r.onClick : JSON.parse(r.onClick)))
                    setWidgetType(r?.widgetType)
                  }}
                >
                  {r.name}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', width: '900px', height: '100%' }}>
            {selectedRecord && (
              <>
                <br />
                <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row' }}></div>
                <label>ID: {selectedRecord.id}</label>
                <label>Name</label>
                <input
                  value={selectedRecord.name || ''}
                  type='text'
                  onChange={e => handleRecordEdit('name', e.target.value)}
                  onBlur={saveFieldRecordEdits}
                />

                <label>Description</label>
                <textarea
                  name='description'
                  onBlur={saveFieldRecordEdits}
                  onChange={e => handleRecordEdit('description', e.target.value)}
                  style={{ minHeight: '25px' }}
                  value={selectedRecord.description || ''}
                />

                <div style={{ display: 'flex', flexDirection: 'row' }}>
                  <label>Published</label>
                  <input
                    type='checkbox'
                    checked={selectedRecord.published === 1}
                    onChange={e => {
                      handleRecordEdit('published', e.target.checked ? 1 : 0)
                    }}
                    onBlur={saveFieldRecordEdits}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                  <label>Hidden</label>
                  <input
                    type='checkbox'
                    checked={selectedRecord.hidden === 1}
                    onChange={e => handleRecordEdit('hidden', e.target.checked ? 1 : 0)}
                    onBlur={saveFieldRecordEdits}
                  />
                </div>

                <br />
                <TabBar options={TABS} setSelected={setCurrentTab} selected={currentTab} />

                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'rgba(24, 144, 255, 0.02)',
                    border: '1px solid rgba(24, 144, 255, 0.14)',
                    marginTop: 5,
                  }}
                >
                  {currentTab === TAB_KEYS.REPORT && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div>
                        <button onClick={() => setTimeout(_runReport, 100)}>Run Report To Console</button>
                        <button onClick={() => setTimeout(_exportReport, 100)}>Run Report To Excel</button>
                      </div>
                      <textarea
                        name='reportQuery'
                        value={selectedRecord.reportQuery || ''}
                        onChange={e => handleRecordEdit('reportQuery', e.target.value)}
                        onBlur={saveFieldRecordEdits}
                        style={{ height: 'calc(100% - 45px)', fontFamily: 'monospace', fontSize: '13px' }}
                      />
                    </div>
                  )}
                  {currentTab === TAB_KEYS.WIDGET && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <label>Widget type</label>
                      <Select
                        onChange={e => setWidgetType(e.target.value)}
                        options={Object.keys(WIDGET_TYPES).map(key => ({ name: key, value: WIDGET_TYPES[key] }))}
                        title='Select Widget Type'
                        value={widgetType || ''}
                      />
                      <label style={{ fontWeight: 'bold' }}>Widget onClick</label>
                      {renderWidgetOnClick()}
                      <label>reportId</label>
                      <textarea
                        name='reportId'
                        onChange={e => setWidgetOnClick(woc => ({ ...woc, reportId: e.target.value }))}
                        style={{ minHeight: '25px' }}
                        value={widgetOnClick?.reportId || ''}
                      />
                      <button onClick={() => setWidgetOnClick('')} style={{ margin: '5px 0', width: '250px' }}>
                        Clear onClick
                      </button>
                      <div>
                        <button onClick={() => setTimeout(_runWidget, 100)}>Run Widget To Console</button>
                      </div>
                      <textarea
                        name='widgetQuery'
                        onBlur={saveFieldRecordEdits}
                        onChange={e => handleRecordEdit('widgetQuery', e.target.value)}
                        rows={13}
                        style={{ height: 'calc(100% - 45px)', fontFamily: 'monospace', fontSize: '13px' }}
                        value={selectedRecord.widgetQuery || ''}
                      />
                    </div>
                  )}
                  {currentTab === TAB_KEYS.TRAITS && renderTraitsTab()}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {contextMenu && (
        <div style={{ left: '0px', top: '0px', right: '0px', bottom: '0px', position: 'absolute' }} onClick={() => setContextMenu(null)}>
          <div
            style={{
              position: 'absolute',
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              background: '#d1d1d1d1',
              padding: '10px',
              borderRadius: '5px',
            }}
          >
            {contextMenu.renderMenu()}
          </div>
        </div>
      )}
      <LinkTraitsModal
        isTraitsModalOpen={isTraitsModalOpen}
        linkTrait={linkTrait}
        relatedTraits={relatedTraits}
        setIsTraitsModalOpen={setIsTraitsModalOpen}
      />
      <Modal onClickOut={() => setIsTraitTypesModalOpen(false)} open={isTraitTypesModalOpen}>
        {traitTypes.map(tt => (
          <ItemRow key={traitTypes.id}>
            <div style={{ flexDirection: 'column' }}>
              {tt.name} ({tt.id})
            </div>
            {tt.id === selectedDashboard.filterTraitTypeId ? (
              <button onClick={() => unlinkTraitType(tt)}>Unlink</button>
            ) : (
              <button onClick={() => linkTraitType(tt)}>Link</button>
            )}
          </ItemRow>
        ))}
      </Modal>

      <Modal onClickOut={() => setIsReportModalOpen(false)} open={isReportModalOpen}>
        {reportList.map(r => (
          <ItemRow key={r.id}>
            <div style={{ flexDirection: 'column' }}>
              {r.name} ({r.id})
            </div>
            {!reports.some(report => report.id === r.id) && <button onClick={() => linkReport(r)}>Link</button>}
          </ItemRow>
        ))}
      </Modal>
    </div>
  )
}

export default AnalyticsEditor
