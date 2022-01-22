import { useState } from 'react'
import styled from 'styled-components'

import { AgGridReact, AgGridColumn } from '@ag-grid-community/react'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import { Select } from '@components'
import { LANGUAGE_TYPE } from '@utils'

import { api } from '@services'

let lastNewId = 0

const TypeSelect = styled(Select)`
  padding: 5px 0 5px 15px;
  width: 400px;
`

const LanguageEditor = () => {
  const [gridApi, setGridApi] = useState(null)
  const [rowData, setRowData] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [tempType, setTempType] = useState(0)

  const onGridReady = async params => {
    setGridApi(params.api)

    const {
      data: { success, languages, msg },
    } = await api.get('/config/languages/list')
    if (success === true) {
      setRowData(languages)
    } else {
      alert(msg)
    }
  }

  const newRecord = () => {
    // NOTE: I didn't apply the account Id.  This is controlled at the service level and applied to the user based on the url...EK
    setRowData([...rowData, { id: --lastNewId, name: '' }])
  }

  const saveChanges = async ({ data }) => {
    if (data.id < 0) {
      // This is a new record, we need to insert, and then merge the returned ID...EK
      let { data: insertRes } = await api.post('/config/languages/save', {
        inserted: { ...data, languageType: tempType || data.languageType },
      })

      // Merge ID back into record based on negative id...EK
      let newRow = gridApi.getRowNode(data.id)
      if (newRow != null) {
        newRow.setDataValue('id', insertRes.newId)
      }
    } else {
      await api.post('/config/languages/save', { updated: data })
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
      if (confirm(`About to Delete '${selectedRecord.language}'.  Are you sure you want to do this?`)) {
        let { data: deletedRes } = await api.post('/config/languages/save', { deleted: selectedRecord })
        if (deletedRes.success) {
          setRowData(rowData.filter(r => r.id !== selectedRecord.id))
        } else {
          console.warn('UNABLE TO DELETE: ' + deletedRes.msg)
        }
      }
    }
  }

  const renderTypeSelect = ({ data }) => {
    return (
      <TypeSelect
        defaultValue={data.languageType ?? ''}
        onChange={e => {
          if (data.id > 0) saveChanges({ data: { ...data, languageType: e.target.value } })
          else setTempType(e.target.value)
        }}
        options={Object.keys(LANGUAGE_TYPE).map(key => ({ name: key, value: LANGUAGE_TYPE[key] }))}
        title='Select a type'
      />
    )
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
          <AgGridColumn
            cellRendererFramework={renderTypeSelect}
            cellStyle={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}
            editable={false}
            field='languageType'
            width={450}
          />
          <AgGridColumn
            cellEditor='agLargeTextCellEditor'
            cellEditorParams={{
              cols: '50',
              maxLength: '60000',
              rows: '6',
            }}
            field='language'
            flex={1}
          />
        </AgGridReact>
      </div>
    </div>
  )
}

export default LanguageEditor
