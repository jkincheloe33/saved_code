import { useState } from 'react'
import { AgGridReact, AgGridColumn } from '@ag-grid-community/react'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'

import { api } from '@services'

let lastNewId = 0

const ClientValuesGridEditor = () => {
  const [gridApi, setGridApi] = useState(null)
  const [rowData, setRowData] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const onGridReady = async params => {
    setGridApi(params.api)

    const {
      data: { success, clientValuesForAccount, msg },
    } = await api.get('/config/clientValues/list')
    if (success === true) {
      setRowData(clientValuesForAccount)
    } else {
      alert(msg)
    }
  }

  const newRecord = () => {
    // NOTE: I didn't apply the account Id.  This is controlled at the service level and applied to the user based on the url...EK
    setRowData([...rowData, { id: --lastNewId, rank: 1 }])
  }

  const saveChanges = async ({ data }) => {
    if (isNaN(data.rank)) {
      return alert('Rank not saved.  It must be a number.')
    }

    if (data.id < 0) {
      // This is a new record, we need to insert, and then merge the returned ID...EK
      const { data: insertRes } = await api.post('/config/clientValues/save', { inserted: data })

      // Merge ID back into record based on negative id...EK
      const newRow = gridApi.getRowNode(data.id)
      if (newRow != null) {
        newRow.setDataValue('id', insertRes.newId)
      }
    } else {
      await api.post('/config/clientValues/save', { updated: data })
    }
  }

  const deleteRecord = async () => {
    if (selectedRecord == null) {
      return alert('No record selected to delete.')
    }

    if (selectedRecord.id < 0) {
      // This is an unsaved record, just remove from the data model...EK
      setRowData(rowData.filter(r => r.id !== selectedRecord.id))
    } else {
      if (confirm(`About to Delete '${selectedRecord.name}'.  Are you sure you want to do this?`)) {
        let { data: deletedRes } = await api.post('/config/clientValues/save', { deleted: selectedRecord })
        if (deletedRes.success) {
          setRowData(rowData.filter(r => r.id !== selectedRecord.id))
        } else {
          alert('UNABLE TO DELETE: ' + deletedRes.msg)
        }
      }
    }
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div>
        <button onClick={newRecord}>New</button>
        <button onClick={deleteRecord}>Delete</button>
      </div>
      <div
        id='myGrid'
        style={{
          height: '100%',
          width: '100%',
        }}
        className='ag-theme-alpine'
      >
        <AgGridReact
          modules={[ClientSideRowModelModule]}
          defaultColDef={{
            editable: true,
            resizable: true,
            width: 100,
          }}
          enterMovesDown={true}
          enterMovesDownAfterEdit={true}
          getRowNodeId={data => data.id}
          onCellValueChanged={saveChanges}
          onGridReady={onGridReady}
          onSelectionChanged={() => setSelectedRecord(gridApi.getSelectedRows()[0])}
          rowData={rowData}
          rowSelection={'single'}
        >
          <AgGridColumn field='id' editable={false} width={100} />
          <AgGridColumn field='name' width={200} />
          <AgGridColumn field='rank' width={150} />
          <AgGridColumn field='description' flex={1} />
        </AgGridReact>
      </div>
    </div>
  )
}

export default ClientValuesGridEditor
