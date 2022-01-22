import { useState } from 'react'
import { AgGridReact, AgGridColumn } from '@ag-grid-community/react'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'

import { api } from '@services'

let lastNewId = 0

const ReactionsGridEditor = () => {
  const [gridApi, setGridApi] = useState(null)
  const [rowData, setRowData] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const onGridReady = async params => {
    setGridApi(params.api)

    let { data } = await api.get('/config/reactions/list')
    setRowData(data.reactionsForAccount)
  }

  const newRecord = () => {
    // NOTE: I didn't apply the account Id.  This is controlled at the service level and applied to the user based on the url...EK
    setRowData([...rowData, { id: --lastNewId, name: '' }])
  }

  const saveChanges = async ({ data }) => {
    if (data.id < 0) {
      // This is a new record, we need to insert, and then merge the returned ID...EK
      let { data: insertRes } = await api.post('/config/reactions/save', { inserted: data })

      // Merge ID back into record based on negative id...EK
      let newRow = gridApi.getRowNode(data.id)
      if (newRow != null) {
        newRow.setDataValue('id', insertRes.newId)
      }
    } else {
      await api.post('/config/reactions/save', { updated: data })
    }
  }

  const deleteRecord = async () => {
    if (selectedRecord == null) {
      alert('No record selected to delete.')
    }

    if (selectedRecord.id < 0) {
      // This is an unsaved record, just remove from the data model...EK
      setRowData(rowData.filter(r => r.id !== selectedRecord.id))
    } else {
      if (confirm(`About to Delete '${selectedRecord.name}'.  Are you sure you want to do this?`)) {
        let { data: deletedRes } = await api.post('/config/reactions/save', { deleted: selectedRecord })
        if (deletedRes.success) {
          setRowData(rowData.filter(r => r.id !== selectedRecord.id))
        }
      }
    }
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div>
        <button onClick={newRecord}>New Reaction</button>
        <button onClick={deleteRecord}>Delete Reaction</button>

        <input id='reactions-upload-image' type='file' hidden />
        <button
          onClick={() => {
            if (selectedRecord == null || selectedRecord.id < 0) {
              return alert('No saved reaction selected.  Select one and try again.')
            }

            let fileInput = document.getElementById('reactions-upload-image')

            fileInput.onchange = async () => {
              // Push the file to the server...EK
              let formData = new FormData()
              formData.append('reactionId', selectedRecord.id)
              formData.append('mediaUpload', fileInput.files[0])

              let { data: mediaSaveRes } = await api.post('/config/reactions/saveMedia', formData)

              if (mediaSaveRes.success === true) {
                let gridRow = gridApi.getRowNode(selectedRecord.id)
                if (gridRow != null) {
                  gridRow.setDataValue('icon', mediaSaveRes.mediaPath)
                }
              } else {
                console.error('Media Save Issue: ', mediaSaveRes.msg)
              }

              fileInput.value = null
            }

            fileInput.click()
          }}
        >
          Upload Icon
        </button>
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
          }}
          components={{
            rowIcon: function (params) {
              if (params.data.icon == null) {
                return params.value
              } else {
                return `<img style='display: inline-block;vertical-align: middle; width: 30px; height: 30px;' src='${params.data.icon}' />`
              }
            },
          }}
          enterMovesDown={true}
          enterMovesDownAfterEdit={true}
          onGridReady={onGridReady}
          onCellValueChanged={saveChanges}
          rowData={rowData}
          getRowNodeId={data => data.id}
          rowSelection={'single'}
          onSelectionChanged={() => setSelectedRecord(gridApi.getSelectedRows()[0])}
        >
          <AgGridColumn field='id' editable={false} width={80} />
          <AgGridColumn field='icon' cellRenderer='rowIcon' width={70} editable={false} />
          <AgGridColumn field='name' width={300} />
          <AgGridColumn field='description' flex={1} />
          <AgGridColumn field='status' width={150} />
        </AgGridReact>
      </div>
    </div>
  )
}

export default ReactionsGridEditor
