import { useEffect, useState } from 'react'
import moment from 'moment'
import styled from 'styled-components'
import { AgGridReact, AgGridColumn } from '@ag-grid-community/react'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'

import { colors } from '@assets'
import { Modal } from '@components'
import { api } from '@services'

let lastNewId = 0

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

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`

const WambisEditor = () => {
  const [awards, setAwards] = useState([])
  const [gridApi, setGridApi] = useState(null)
  const [isAwardsModalOpen, setIsAwardsModalOpen] = useState(false)
  const [rowData, setRowData] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [themeGridApi, setThemeGridApi] = useState(null)
  const [themeRowData, setThemeRowData] = useState([])

  useEffect(() => {
    const getAwards = async () => {
      const {
        data: { awardTypesForAccount, success },
      } = await api.get('/config/awardTypes/list')

      if (success) setAwards(awardTypesForAccount)
    }

    if (isAwardsModalOpen) getAwards()
  }, [isAwardsModalOpen])

  const onThemeGridReady = async params => {
    setThemeGridApi(params.api)

    const {
      data: { themes, msg, success },
    } = await api.get('/config/wambiThemes/list')
    if (success) setThemeRowData(themes)
    else alert(msg)
  }

  useEffect(() => {
    const getTypes = async () => {
      if (selectedTheme) {
        setSelectedRecord(null)
        const {
          data: { success, cpcTypes, msg },
        } = await api.post('/config/wambiTypes/list', { cpcThemeId: selectedTheme.id })
        if (success) {
          cpcTypes.forEach(c => {
            c.startDate = c.startDate ? moment(c.startDate).utc().format('YYYY-MM-DD') : null
            c.endDate = c.endDate ? moment(c.endDate).utc().format('YYYY-MM-DD') : null
          })
          setRowData(cpcTypes)
        } else {
          alert(msg)
        }
      }
    }

    getTypes()
  }, [selectedTheme])

  const addMedia = () => {
    const fileInput = document.getElementById('upload-cpc-type-image')

    fileInput.onchange = async () => {
      const formData = new FormData()
      formData.append('cpcTypeId', selectedRecord.id)
      formData.append('mediaUpload', fileInput.files[0])

      const {
        data: { success, msg },
      } = await api.post('/config/wambiTypes/saveMedia', formData)

      if (success) alert(`Media linked to ${selectedRecord.name}`)
      else console.error('Media Save Issue: ', msg)

      fileInput.value = null
    }

    fileInput.click()
  }

  const newRecord = () => {
    setRowData([...rowData, { id: --lastNewId }])
  }

  const saveChanges = async ({ data }) => {
    if (data.id < 0) {
      const {
        data: { newId },
      } = await api.post('/config/wambiTypes/save', { inserted: { ...data, cpcThemeId: selectedTheme.id } })

      const newRow = gridApi.getRowNode(data.id)
      if (newRow != null) newRow.setDataValue('id', newId)
    } else {
      const {
        data: { success },
      } = await api.post('/config/wambiTypes/save', { updated: data })

      if (success) {
        gridApi.getRowNode(data.id).setDataValue('awardTypeId', data.awardTypeId)
        setSelectedRecord(sr => ({ ...sr, awardTypeId: data.awardTypeId }))
      }
    }
  }

  const deleteRecord = async () => {
    if (selectedRecord.id < 0) {
      setRowData(rd => rd.filter(r => r.id !== selectedRecord.id))
    } else {
      if (confirm(`About to Delete '${selectedRecord.name}'.  Are you sure you want to do this?`)) {
        const {
          data: { msg, success },
        } = await api.post('/config/wambiTypes/save', { deleted: selectedRecord })

        if (success) setRowData(rd => rd.filter(r => r.id !== selectedRecord.id))
        else alert('UNABLE TO DELETE: ' + msg)
      }
    }
  }

  const newTheme = () => {
    setThemeRowData(themes => [
      {
        id: --lastNewId,
      },
      ...themes,
    ])
  }

  const saveTheme = async ({ data }) => {
    if (data.id < 0) {
      const {
        data: { newId },
      } = await api.post('/config/wambiThemes/save', { inserted: data })

      const newRow = themeGridApi.getRowNode(data.id)
      if (newRow) newRow.setDataValue('id', newId)
    } else {
      await api.post('/config/wambiThemes/save', { updated: data })
    }
  }

  const handleCheckbox = key => params => {
    const newValue = params.node.data[key] === 1 ? 0 : 1
    params.node.setDataValue(key, newValue)
  }

  return (
    <Wrapper>
      <div>
        <button onClick={newTheme}>New</button>
      </div>
      <div
        id='dashboardGrid'
        style={{
          height: '60%',
          width: '100%',
        }}
        className='ag-theme-alpine'
      >
        <AgGridReact
          defaultColDef={{ editable: true, resizable: true }}
          components={{
            hotStreakCheckbox: ({ data }) => `<input type='checkbox' ${data.limitToHotStreak === 1 && 'checked'}>`,
          }}
          enterMovesDown={true}
          enterMovesDownAfterEdit={true}
          getRowNodeId={data => data.id}
          modules={[ClientSideRowModelModule]}
          onCellValueChanged={saveTheme}
          onGridReady={onThemeGridReady}
          onSelectionChanged={() => setSelectedTheme(themeGridApi.getSelectedRows()[0])}
          rowData={themeRowData}
          rowSelection='single'
        >
          <AgGridColumn editable={false} field='id' width={100} />
          <AgGridColumn field='name' width={500} />
          <AgGridColumn field='description' flex={1} />
          <AgGridColumn
            field='limitToHotStreak'
            cellRenderer='hotStreakCheckbox'
            editable={false}
            onCellClicked={handleCheckbox('limitToHotStreak')}
          />
          <AgGridColumn field='order' width={80} />
        </AgGridReact>
      </div>
      {selectedTheme && (
        <>
          <div style={{ marginTop: '20px' }}>
            <button onClick={newRecord}>New</button>
            {selectedRecord && <button onClick={deleteRecord}>Delete</button>}
            {selectedRecord && <button onClick={addMedia}>Upload Media</button>}
            {selectedRecord && <button onClick={() => setIsAwardsModalOpen(true)}>Link Award</button>}
            <input hidden id='upload-cpc-type-image' type='file' />
          </div>
          <div
            id='myGrid'
            style={{
              height: '50%',
              width: '100%',
            }}
            className='ag-theme-alpine'
          >
            <AgGridReact
              defaultColDef={{ editable: true, resizable: true }}
              enterMovesDown={true}
              enterMovesDownAfterEdit={true}
              getRowNodeId={data => data.id}
              modules={[ClientSideRowModelModule]}
              onCellValueChanged={saveChanges}
              onGridReady={params => setGridApi(params.api)}
              onSelectionChanged={() => setSelectedRecord(gridApi.getSelectedRows()[0])}
              rowData={rowData}
              rowSelection='single'
            >
              <AgGridColumn editable={false} field='id' width={80} />
              <AgGridColumn editable={false} field='awardTypeId' width={130} />
              <AgGridColumn field='name' flex={1} />
              <AgGridColumn field='exampleText' flex={1} />
              <AgGridColumn field='order' width={80} />
              <AgGridColumn field='startDate' width={130} />
              <AgGridColumn field='endDate' width={130} />
              <AgGridColumn field='keywords' width={130} />
              <AgGridColumn field='whoCanSend' width={130} />
              <AgGridColumn field='status' width={80} />
              <AgGridColumn editable={false} field='wambis' width={90} />
              <AgGridColumn editable={false} field='images' width={90} />
            </AgGridReact>
          </div>
          <Modal onClickOut={() => setIsAwardsModalOpen(false)} open={isAwardsModalOpen}>
            {awards.map(({ id, name }) => (
              <ItemRow key={id}>
                {name} ({id})
                {id === selectedRecord?.awardTypeId ? (
                  <button onClick={() => saveChanges({ data: { ...selectedRecord, awardTypeId: null } })}>Unlink</button>
                ) : (
                  <button onClick={() => saveChanges({ data: { ...selectedRecord, awardTypeId: id } })}>Link</button>
                )}
              </ItemRow>
            ))}
          </Modal>
        </>
      )}
    </Wrapper>
  )
}

export default WambisEditor
