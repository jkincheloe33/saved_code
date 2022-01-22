import { useState } from 'react'
import styled from 'styled-components'
import { AgGridReact, AgGridColumn } from '@ag-grid-community/react'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'

import { RewardGiftsEditor } from '@components'

import { api } from '@services'

let lastNewId = 0

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`

const RewardLevelsEditor = () => {
  const [gridApi, setGridApi] = useState(null)
  const [rowData, setRowData] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const onGridReady = async params => {
    setGridApi(params.api)

    const {
      data: { success, levels },
    } = await api.get('/config/rewards/levels/list')

    if (success) setRowData(levels)
  }

  const newRecord = () => {
    setRowData([...rowData, { id: --lastNewId }])
  }

  const saveChanges = async ({ data }) => {
    if (data.id < 0) {
      const {
        data: { newId },
      } = await api.post('/config/rewards/levels/save', { inserted: data })

      const newRow = gridApi.getRowNode(data.id)
      if (newRow != null) newRow.setDataValue('id', newId)
    } else {
      await api.post('/config/rewards/levels/save', { updated: data })
    }
  }

  const deleteRecord = async () => {
    if (!selectedRecord) return alert('No record selected to delete.')

    if (selectedRecord.id < 0) {
      setRowData(rowData.filter(r => r.id !== selectedRecord.id))
    } else {
      if (confirm(`About to Delete '${selectedRecord.name}'.  Are you sure you want to do this?`)) {
        const {
          data: { msg, success },
        } = await api.post('/config/rewards/levels/save', { deleted: selectedRecord })

        if (success) setRowData(rowData.filter(r => r.id !== selectedRecord.id))
        else alert('UNABLE TO DELETE: ' + msg)
      }
    }
  }

  return (
    <Wrapper>
      <div>
        <button onClick={newRecord}>New</button>
        <button onClick={deleteRecord}>Delete</button>
      </div>
      <div
        id='myGrid'
        style={{
          height: '60%',
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
          <AgGridColumn editable={false} field='id' width={100} />
          <AgGridColumn field='name' flex={1} />
          <AgGridColumn field='level' width={200} />
          <AgGridColumn field='requiredPlays' width={200} />
          <AgGridColumn field='probabilityMultiplier' width={200} />
        </AgGridReact>
      </div>
      {selectedRecord && (
        <>
          <h3 style={{ marginTop: '20px' }}>{selectedRecord.name} Gifts</h3>
          <RewardGiftsEditor rewardLevelId={selectedRecord?.id} />
        </>
      )}
    </Wrapper>
  )
}

export default RewardLevelsEditor
