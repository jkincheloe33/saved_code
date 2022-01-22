import { useState } from 'react'
import PropTypes from 'prop-types'
import { AgGridReact, AgGridColumn } from '@ag-grid-community/react'
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model'

import { api } from '@services'

const PeopleSelector = ({ handleClose, selectionHandler: { message, selectionHandler } }) => {
  const [gridApi, setGridApi] = useState()
  const [selectedRecords, setSelectedRecords] = useState([])

  const onGridReady = async params => {
    setGridApi(params.api)

    const dataSource = {
      rowCount: null,
      getRows: async params => {
        const { startRow, endRow, filterModel: filter, sortModel: sort } = params

        const {
          data: { pageOfPeople },
        } = await api.post('/config/people/pagedSelectionList', { startRow, endRow, filter, sort })

        const lastRow = pageOfPeople.length < endRow - startRow ? startRow + pageOfPeople.length : -1
        params.successCallback(pageOfPeople, lastRow)
      },
    }

    params.api.setDatasource(dataSource)
  }

  return (
    <div style={{ background: 'white', padding: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <button
          disabled={!selectedRecords.length}
          onClick={() => {
            selectionHandler(gridApi.getSelectedRows())
            handleClose()
          }}
          style={{ cursor: !selectedRecords.length ? 'auto' : 'pointer', width: 200 }}
        >
          Continue (press X to cancel)
        </button>
        {message && <span style={{ paddingTop: 20 }}>{message}</span>}
      </div>
      <div
        className='ag-theme-alpine'
        id='myGrid'
        style={{
          height: message ? 550 : 650,
          marginTop: 20,
          width: 700,
        }}
      >
        <AgGridReact
          cacheOverflowSize={2}
          components={{
            loadingRenderer: ({ value }) =>
              value ??
              '<img src="https://raw.githubusercontent.com/ag-grid/ag-grid/master/grid-packages/ag-grid-docs/src/images/loading.gif" />',
          }}
          defaultColDef={{
            editable: false,
            filter: true,
            flex: 1,
            minWidth: 100,
            resizable: true,
            sortable: true,
          }}
          enableCellTextSelection={true}
          getRowNodeId={data => data.id}
          infiniteInitialRowCount={1}
          maxBlocksInCache={20}
          maxConcurrentDatasourceRequests={2}
          modules={[InfiniteRowModelModule]}
          onGridReady={onGridReady}
          onSelectionChanged={() => setSelectedRecords(gridApi.getSelectedRows())}
          paginationPageSize={100}
          rowBuffer={0}
          rowModelType='infinite'
          rowSelection='multiple'
        >
          <AgGridColumn checkboxSelection filter={false} maxWidth={60} sortable={false} />
          <AgGridColumn field='id' cellRenderer='loadingRenderer' minWidth={100} valueGetter='node.id' />
          <AgGridColumn field='hrId' minWidth={160} />
          <AgGridColumn field='loginId' minWidth={160} />
          <AgGridColumn field='firstName' minWidth={160} />
          <AgGridColumn field='lastName' minWidth={160} />
          <AgGridColumn field='displayName' minWidth={160} />
          <AgGridColumn field='isOwner' minWidth={120} />
          <AgGridColumn field='jobTitle' minWidth={160} />
          <AgGridColumn field='jobTitleDisplay' minWidth={160} />
          <AgGridColumn field='email' minWidth={160} />
          <AgGridColumn field='mobile' minWidth={160} />
          <AgGridColumn field='manager' minWidth={160} />
          <AgGridColumn field='accessLevel' headerName='Account Access' minWidth={160} />
          <AgGridColumn field='isSelfRegistered' minWidth={180} />
        </AgGridReact>
      </div>
    </div>
  )
}

PeopleSelector.propTypes = {
  handleClose: PropTypes.func,
  selectionHandler: PropTypes.object,
}

export default PeopleSelector
