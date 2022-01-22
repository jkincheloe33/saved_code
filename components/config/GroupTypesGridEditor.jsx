import { useState } from 'react'
import { AgGridReact, AgGridColumn } from '@ag-grid-community/react'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'

import { api } from '@services'

let lastNewId = 0

const GroupTypesGridEditor = () => {
  const [gridApi, setGridApi] = useState(null)
  const [rowData, setRowData] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const onGridReady = async params => {
    setGridApi(params.api)

    const {
      data: { success, groupTypesForAccount, msg },
    } = await api.get('/config/groupTypes/list')
    if (success === true) {
      setRowData(groupTypesForAccount)
    } else {
      alert(msg)
    }
  }

  const handleCheckbox = key => params => {
    const newValue = params.node.data[key] == 1 ? 0 : 1
    params.node.setDataValue(key, newValue)
  }

  const newRecord = () => {
    // NOTE: I didn't apply the account Id.  This is controlled at the service level and applied to the user based on the url...EK
    setRowData([...rowData, { id: --lastNewId, name: '' }])
  }

  const saveChanges = async ({ data }) => {
    if (data.id < 0) {
      // This is a new record, we need to insert, and then merge the returned ID...EK
      let { data: insertRes } = await api.post('/config/groupTypes/save', { inserted: data })

      // Merge ID back into record based on negative id...EK
      let newRow = gridApi.getRowNode(data.id)
      if (newRow != null) {
        newRow.setDataValue('id', insertRes.newId)
      }
    } else {
      await api.post('/config/groupTypes/save', { updated: data })
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
        let { data: deletedRes } = await api.post('/config/groupTypes/save', { deleted: selectedRecord })
        if (deletedRes.success) {
          setRowData(rowData.filter(r => r.id !== selectedRecord.id))
        } else {
          console.warn('UNABLE TO DELETE: ' + deletedRes.msg)
        }
      }
    }
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div>
        <button onClick={newRecord}>New</button>
        <button onClick={deleteRecord}>Delete</button>

        <input id='group-types-upload-image' type='file' hidden />
        <button
          onClick={() => {
            if (selectedRecord == null || selectedRecord.id < 0) {
              return alert('No saved group type selected.  Select one and try again.')
            }

            let fileInput = document.getElementById('group-types-upload-image')

            fileInput.onchange = async () => {
              // Push the file to the server...EK
              let formData = new FormData()
              formData.append('groupTypeId', selectedRecord.id)
              formData.append('mediaUpload', fileInput.files[0])

              let { data: mediaSaveRes } = await api.post('/config/groupTypes/saveMedia', formData)

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
            width: 100,
          }}
          components={{
            rowIcon: function (params) {
              if (params.data.icon == null) {
                return params.value
              } else {
                return `<img style='display: flex; width: 20px; height: 20px;' src='${params.data.icon}' />`
              }
            },
            locationCheckbox: function (params) {
              if (params.data.isLocation == 1) {
                return '<input type="checkbox" checked>'
              } else {
                return '<input type="checkbox">'
              }
            },
            reviewFilterCheckbox: function (params) {
              if (params.data.isReviewFilter == 1) {
                return '<input type="checkbox" checked>'
              } else {
                return '<input type="checkbox">'
              }
            },
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
          <AgGridColumn
            cellRenderer='rowIcon'
            cellStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            field={'icon'}
            headerName='Icon'
            editable={false}
            width={70}
          />
          <AgGridColumn field='name' width={200} />
          <AgGridColumn field='description' flex={1} />
          <AgGridColumn
            cellRenderer='locationCheckbox'
            editable={false}
            field='isLocation'
            onCellClicked={handleCheckbox('isLocation')}
            width={120}
          />
          <AgGridColumn
            field='isReviewFilter'
            cellRenderer='reviewFilterCheckbox'
            editable={false}
            onCellClicked={handleCheckbox('isReviewFilter')}
            width={150}
          />
        </AgGridReact>
      </div>
    </div>
  )
}

export default GroupTypesGridEditor
