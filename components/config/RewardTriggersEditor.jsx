import { useState } from 'react'
import styled from 'styled-components'
import { AgGridReact, AgGridColumn } from '@ag-grid-community/react'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'

import { Select } from '@components'
import { api } from '@services'
import { TRIGGERS } from '@utils'

let lastNewId = 0

const TriggerSelect = styled(Select)`
  padding: 5px 0 5px 15px;
  width: 300px;
`

const rewardTriggerExclusions = ['CPC_VIEW_ALL']

const RewardTriggersEditor = () => {
  const [gridApi, setGridApi] = useState(null)
  const [rowData, setRowData] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const onGridReady = async params => {
    setGridApi(params.api)

    const {
      data: { success, triggers },
    } = await api.get('/config/rewards/triggers/list')

    if (success) setRowData(triggers)
  }

  const newRecord = () => {
    setRowData([...rowData, { id: --lastNewId }])
  }

  const saveChanges = async ({ data }) => {
    const trigger = selectedRecord?.trigger ? selectedRecord.trigger : data.trigger

    if (data.increment < 0 || data.increment > 1000) {
      gridApi.getRowNode(data.id).setDataValue('increment', 0)
      return alert('Not a valid input! Increment must be an integer between 0 and 1000.')
    }

    if (data.id < 0) {
      const {
        data: { newId, success },
      } = await api.post('/config/rewards/triggers/save', { inserted: { ...data, trigger } })

      if (success) {
        const newRow = gridApi.getRowNode(data.id)
        if (newRow != null) newRow.setDataValue('id', newId)
      }
    } else {
      await api.post('/config/rewards/triggers/save', { updated: { ...data, trigger } })
    }
  }

  const deleteRecord = async () => {
    if (!selectedRecord) return alert('No record selected to delete.')

    if (selectedRecord.id < 0) {
      setRowData(rowData.filter(r => r.id !== selectedRecord.id))
    } else {
      if (confirm(`About to delete 'Trigger ${selectedRecord.id}'.  Are you sure you want to do this?`)) {
        const {
          data: { msg, success },
        } = await api.post('/config/rewards/triggers/save', { deleted: selectedRecord })

        if (success) setRowData(rowData.filter(r => r.id !== selectedRecord.id))
        else alert('UNABLE TO DELETE: ' + msg)
      }
    }
  }

  const renderTriggerSelect = ({ data }) => {
    return (
      <TriggerSelect
        defaultValue={data.trigger || ''}
        onChange={e => {
          if (data.id > 0) saveChanges({ data: { ...data, trigger: e.target.value } })
          else setSelectedRecord(r => ({ ...r, trigger: e.target.value }))
        }}
        options={Object.keys(TRIGGERS).flatMap(key => (!rewardTriggerExclusions.includes(key) ? { name: key, value: TRIGGERS[key] } : []))}
        title='Select a trigger'
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
          defaultColDef={{
            editable: true,
            resizable: true,
            width: 100,
          }}
          enterMovesDown={true}
          enterMovesDownAfterEdit={true}
          getRowNodeId={data => data.id}
          modules={[ClientSideRowModelModule]}
          onCellValueChanged={saveChanges}
          onGridReady={onGridReady}
          onSelectionChanged={() => setSelectedRecord(gridApi.getSelectedRows()[0])}
          rowData={rowData}
          rowSelection='single'
        >
          <AgGridColumn editable={false} field='id' width={150} />
          <AgGridColumn
            cellRendererFramework={renderTriggerSelect}
            cellStyle={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}
            editable={false}
            field='trigger'
            flex={1}
          />
          <AgGridColumn field='increment' flex={1} />
        </AgGridReact>
      </div>
    </div>
  )
}

export default RewardTriggersEditor
