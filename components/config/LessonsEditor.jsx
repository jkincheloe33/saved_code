import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { AgGridReact, AgGridColumn } from '@ag-grid-community/react'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'

import { LinkGroupsModal, LinkTraitsModal, Select } from '@components'
import { api } from '@services'
import { LESSON_STATUS, LESSON_WHO_CAN_SEE } from '@utils'

let lastNewId = 0
let lastNewStepId = 0

const WhoCanSeeSelect = styled(Select)`
  padding: 5px 0 5px 15px;
  width: 300px;
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`

const LessonsEditor = () => {
  const [gridApi, setGridApi] = useState(null)
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false)
  const [isTraitsModalOpen, setIsTraitsModalOpen] = useState(false)
  const [relatedGroups, setRelatedGroups] = useState([])
  const [relatedTraits, setRelatedTraits] = useState([])
  const [rowData, setRowData] = useState(null)
  const [stepsGridApi, setStepsGridApi] = useState(null)
  const [stepsRowData, setStepsRowData] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [selectedStepRecord, setSelectedStepRecord] = useState(null)

  useEffect(() => {
    const getLessonSteps = async () => {
      const {
        data: { success, lessonSteps },
      } = await api.get(`/config/lessons/steps/list?lessonId=${selectedRecord.id}`)

      if (success) {
        // set actionConfig as an empty object if it is null...JK
        const formattedSteps = lessonSteps.map(ls => (ls.actionConfig ? ls : { ...ls, actionConfig: {} }))
        setStepsRowData(formattedSteps)
      }
    }

    const getRelatedItems = async () => {
      const {
        data: { relatedGroups, relatedTraits, success },
      } = await api.post('/config/lessons/relatedItems', { lessonId: selectedRecord.id })

      if (success) {
        setRelatedGroups(relatedGroups)
        setRelatedTraits(relatedTraits)
      }
    }

    if (selectedRecord?.id) {
      getLessonSteps()
      getRelatedItems()
    }
  }, [selectedRecord])

  const onGridReady = async params => {
    setGridApi(params.api)

    const {
      data: { lessons, msg, success },
    } = await api.get('/config/lessons/list')

    if (success) setRowData(lessons)
    else alert(msg)
  }

  const addMedia = () => {
    if (!selectedRecord) return alert('No record selected to link media to.')

    const fileInput = document.getElementById('upload-wambi-lesson-image')

    fileInput.onchange = async () => {
      const formData = new FormData()
      formData.append('lessonId', selectedRecord.id)
      formData.append('mediaUpload', fileInput.files[0])

      const {
        data: { success, msg },
      } = await api.post('/config/lessons/saveMedia', formData)

      if (success) alert(`Media linked to ${selectedRecord.title}`)
      else console.error('Media Save Issue: ', msg)

      fileInput.value = null
    }

    fileInput.click()
  }

  const newRecord = () => {
    setRowData(rd => [
      {
        id: --lastNewId,
        order: rd.length ? Math.max(...rd.map(d => d.order)) + 1 : 1,
        status: LESSON_STATUS.PUBLISHED,
        whoCanSee: LESSON_WHO_CAN_SEE.ANYONE,
      },
      ...rd,
    ])
  }

  const saveChanges = async ({ data }) => {
    // Set whoCanSee if set by selectedRecord...CY
    const whoCanSee = selectedRecord?.whoCanSee ? selectedRecord.whoCanSee : data.whoCanSee
    if (data.id < 0) {
      const {
        data: { newId },
      } = await api.post('/config/lessons/save', { inserted: { ...data, whoCanSee } })
      const newRow = gridApi.getRowNode(data.id)
      if (newRow) newRow.setDataValue('id', newId)
    } else {
      await api.post('/config/lessons/save', { updated: { ...data, whoCanSee } })
    }
  }

  const deleteRecord = async () => {
    if (!selectedRecord) return alert('No record selected to delete.')

    if (selectedRecord.id < 0) {
      setRowData(rowData.filter(r => r.id !== selectedRecord.id))
    } else {
      if (confirm(`About to Delete '${selectedRecord.title}'.  Are you sure you want to do this?`)) {
        const {
          data: { msg, success },
        } = await api.post('/config/lessons/save', { deleted: selectedRecord })

        if (success) setRowData(rowData.filter(r => r.id !== selectedRecord.id))
        else alert('UNABLE TO DELETE: ' + msg)
      }
    }
  }

  const onStepsGridReady = async params => {
    setStepsGridApi(params.api)
  }

  const addStepMedia = () => {
    if (!selectedStepRecord) return alert('No record selected to link media to.')

    const fileInput = document.getElementById('upload-lesson-step-image')

    fileInput.onchange = async () => {
      const formData = new FormData()
      formData.append('stepId', selectedStepRecord.id)
      formData.append('mediaUpload', fileInput.files[0])

      const {
        data: { msg, success },
      } = await api.post('/config/lessons/steps/saveMedia', formData)

      if (success) alert(`Media linked to ${selectedStepRecord.title}`)
      else console.error('Media Save Issue: ', msg)

      fileInput.value = null
    }

    fileInput.click()
  }

  const newStepRecord = () => {
    setStepsRowData(srd => [
      { actionConfig: {}, id: --lastNewStepId, order: srd.length ? Math.max(...srd.map(d => d.order)) + 1 : 1 },
      ...srd,
    ])
  }

  const saveStepChanges = async ({ data }) => {
    if (data.id < 0) {
      const {
        data: { newId },
      } = await api.post('/config/lessons/steps/save', { inserted: { ...data, lessonId: selectedRecord.id } })

      const newRow = stepsGridApi.getRowNode(data.id)
      if (newRow) newRow.setDataValue('id', newId)
    } else {
      await api.post('/config/lessons/steps/save', { updated: data })
    }
  }

  const deleteStepRecord = async () => {
    if (!selectedStepRecord) return alert('No record selected to delete.')

    if (selectedStepRecord.id < 0) {
      setStepsRowData(rowData.filter(r => r.id !== selectedStepRecord.id))
    } else {
      if (confirm(`About to Delete '${selectedStepRecord.title}'.  Are you sure you want to do this?`)) {
        const {
          data: { msg, success },
        } = await api.post('/config/lessons/steps/save', { deleted: selectedStepRecord })

        if (success) setStepsRowData(rowData.filter(r => r.id !== selectedStepRecord.id))
        else alert('UNABLE TO DELETE: ' + msg)
      }
    }
  }

  const linkGroup = async group => {
    const {
      data: { newLinkId, success },
    } = await api.post('/config/lessons/linkGroup', { lessonId: selectedRecord.id, groupId: group.id })

    if (success) setRelatedGroups(rg => [...rg, { ...group, id: newLinkId, groupId: group.id }])
  }

  const linkTrait = async trait => {
    const {
      data: { newLinkId, success },
    } = await api.post('/config/lessons/linkTrait', { lessonId: selectedRecord.id, traitId: trait.id })

    if (success) setRelatedTraits(rt => [...rt, { ...trait, id: newLinkId, traitId: trait.id }])
  }

  const unlinkGroup = async id => {
    const {
      data: { success },
    } = await api.post('/config/lessons/unlinkGroup', { id })

    if (success) setRelatedGroups(rg => rg.filter(g => g.id !== id))
  }

  const unlinkTrait = async id => {
    const {
      data: { success },
    } = await api.post('/config/lessons/unlinkTrait', { id })

    if (success) setRelatedTraits(rt => rt.filter(t => t.id !== id))
  }

  const renderWhoCanSeeSelect = ({ data }) => {
    return (
      <WhoCanSeeSelect
        defaultValue={data.whoCanSee >= 0 ? data.whoCanSee : ''}
        onChange={e => {
          if (data.id > 0) saveChanges({ data: { ...data, whoCanSee: e.target.value } })
          else setSelectedRecord(record => ({ ...record, whoCanSee: e.target.value }))
        }}
        options={Object.keys(LESSON_WHO_CAN_SEE).map(key => ({ name: key, value: LESSON_WHO_CAN_SEE[key] }))}
        title='Select Who Can See'
      />
    )
  }

  return (
    <Wrapper>
      <div>
        <button onClick={newRecord}>New</button>
        <button onClick={deleteRecord}>Delete</button>
        <button onClick={addMedia}>Upload Media</button>
        {selectedRecord && <button onClick={() => setIsGroupsModalOpen(true)}>Link Groups</button>}
        {selectedRecord && <button onClick={() => setIsTraitsModalOpen(true)}>Link Traits</button>}
        <input hidden id='upload-wambi-lesson-image' type='file' />
      </div>
      <div
        id='lessonsGrid'
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
          <AgGridColumn editable={false} field='id' width={80} />
          <AgGridColumn field='title' width={200} />
          <AgGridColumn field='internalDescription' width={200} />
          <AgGridColumn field='summary' flex={1} />
          <AgGridColumn field='order' width={80} />
          <AgGridColumn
            cellRendererFramework={renderWhoCanSeeSelect}
            cellStyle={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}
            editable={false}
            field='whoCanSee'
            flex={1}
          />
          <AgGridColumn field='readMinutes' width={130} />
          <AgGridColumn field='status' width={80} />
        </AgGridReact>
      </div>
      {selectedRecord && (
        <>
          <div style={{ marginTop: '20px' }}>
            <h3>{selectedRecord.title} Steps</h3>
            <button onClick={newStepRecord}>New</button>
            <button onClick={deleteStepRecord}>Delete</button>
            <button onClick={addStepMedia}>Upload Media</button>
            <input hidden id='upload-lesson-step-image' type='file' />
          </div>
          <div
            id='lessonStepsGrid'
            style={{
              height: '50%',
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
              onCellValueChanged={saveStepChanges}
              onGridReady={onStepsGridReady}
              onSelectionChanged={() => setSelectedStepRecord(stepsGridApi.getSelectedRows()[0])}
              rowData={stepsRowData}
              rowSelection='single'
            >
              <AgGridColumn editable={false} field='id' width={80} />
              <AgGridColumn field='title' width={300} />
              <AgGridColumn
                cellEditor='agLargeTextCellEditor'
                cellEditorParams={{
                  cols: '50',
                  rows: '6',
                  maxLength: '60000',
                }}
                field='content'
                flex={1}
              />
              <AgGridColumn field='order' width={100} />
              <AgGridColumn field='actionConfig.link' headerName='Action Link' width={150} />
              <AgGridColumn field='actionConfig.text' headerName='Action Text' width={150} />
            </AgGridReact>
          </div>
        </>
      )}
      <LinkGroupsModal
        isGroupsModalOpen={isGroupsModalOpen}
        linkGroup={linkGroup}
        relatedGroups={relatedGroups}
        setIsGroupsModalOpen={setIsGroupsModalOpen}
        unlinkGroup={unlinkGroup}
      />
      <LinkTraitsModal
        isTraitsModalOpen={isTraitsModalOpen}
        linkTrait={linkTrait}
        relatedTraits={relatedTraits}
        setIsTraitsModalOpen={setIsTraitsModalOpen}
        unlinkTrait={unlinkTrait}
      />
    </Wrapper>
  )
}

export default LessonsEditor
