import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { AgGridReact, AgGridColumn } from '@ag-grid-community/react'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'

import { colors } from '@assets'
import { LinkGroupsModal, LinkTraitsModal, TabBar, Text } from '@components'
import { api } from '@services'

let lastNewId = 0

const TAB_KEYS = {
  GROUPS: 0,
  TRAITS: 1,
}

const TABS = ['Groups', 'Traits']

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

const AwardTypesGridEditor = () => {
  const [currentTab, setCurrentTab] = useState(TAB_KEYS.GROUPS)
  const [gridApi, setGridApi] = useState(null)
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false)
  const [isTraitsModalOpen, setIsTraitsModalOpen] = useState(false)
  const [relatedGroups, setRelatedGroups] = useState([])
  const [relatedTraits, setRelatedTraits] = useState([])
  const [rowData, setRowData] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)

  useEffect(() => {
    const getRelatedItems = async () => {
      if (selectedRecord == null) return

      const {
        data: { relatedGroups, relatedTraits, success },
      } = await api.post('/config/awardTypes/relatedItems', { awardTypeId: selectedRecord.id })

      if (success) {
        setRelatedGroups(relatedGroups)
        setRelatedTraits(relatedTraits)
      }
    }

    getRelatedItems()
  }, [selectedRecord])

  const onGridReady = async params => {
    setGridApi(params.api)

    let { data } = await api.get('/config/awardTypes/list')
    setRowData(data.awardTypesForAccount)
  }

  const newRecord = () => {
    // NOTE: I didn't apply the account Id.  This is controlled at the service level and applied to the user based on the url...EK
    setRowData([...rowData, { id: --lastNewId, name: '', awardType: 'standard', description: '', definition: {} }])
  }

  const saveChanges = async ({ data }) => {
    if (data.id < 0) {
      // This is a new record, we need to insert, and then merge the returned ID...EK
      let { data: insertRes } = await api.post('/config/awardTypes/save', { inserted: data })

      // Merge ID back into record based on negative id...EK
      let newRow = gridApi.getRowNode(data.id)
      if (newRow != null) {
        newRow.setDataValue('id', insertRes.newId)
      }
    } else {
      await api.post('/config/awardTypes/save', { updated: data })
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
        let { data: deletedRes } = await api.post('/config/awardTypes/save', { deleted: selectedRecord })
        if (deletedRes.success) {
          setRowData(rowData.filter(r => r.id !== selectedRecord.id))
        }
      }
    }
  }

  const linkGroup = async group => {
    const {
      data: { newLinkId, success },
    } = await api.post('/config/awardTypes/linkGroup', { awardTypeId: selectedRecord.id, groupId: group.id })

    if (success) setRelatedGroups(rg => [...rg, { ...group, id: newLinkId, groupId: group.id }])
  }

  const linkTrait = async trait => {
    const {
      data: { newLinkId, success },
    } = await api.post('/config/awardTypes/linkTrait', { awardTypeId: selectedRecord.id, traitId: trait.id })

    if (success) setRelatedTraits(rt => [...rt, { ...trait, id: newLinkId, traitId: trait.id }])
  }

  const unlinkGroup = async id => {
    const {
      data: { success },
    } = await api.post('/config/awardTypes/unlinkGroup', { id })

    if (success) setRelatedGroups(rg => rg.filter(g => g.id !== id))
  }

  const unlinkTrait = async id => {
    const {
      data: { success },
    } = await api.post('/config/awardTypes/unlinkTrait', { id })

    if (success) setRelatedTraits(rg => rg.filter(t => t.id !== id))
  }

  const renderGroupsTab = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <button onClick={() => setIsGroupsModalOpen(true)}>Add Group</button>
        {relatedGroups.map(({ groupId, id, name }) => (
          <ItemRow key={id}>
            {name} ({groupId})<button onClick={() => unlinkGroup(id)}>Unlink</button>
          </ItemRow>
        ))}
      </div>
    )
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

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div>
        <button onClick={newRecord}>New Award Type</button>
        <button onClick={deleteRecord}>Delete Award Type</button>

        {/* <input id='interest-upload-image' type='file' hidden />
        <button
          onClick={() => {
            if (selectedRecord == null || selectedRecord.id < 0) {
              return alert('No saved group type selected.  Select one and try again.')
            }

            let fileInput = document.getElementById('interest-upload-image')

            fileInput.onchange = async () => {
              // Push the file to the server...EK
              let formData = new FormData()
              formData.append('groupTypeId', selectedRecord.id)
              formData.append('mediaUpload', fileInput.files[0])

              let { data: mediaSaveRes } = await api.post('/config/interest/saveMedia', formData)

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
        </button> */}
      </div>
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ height: '100%', width: '60%', marginRight: '15px' }}>
          <div
            className='ag-theme-alpine'
            id='myGrid'
            style={{
              height: '100%',
              width: '100%',
            }}
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
                    return `<img style='display: inline-block;vertical-align: middle; width: 20px; height: 20px;' src='${params.data.icon}' />`
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
              {/* <AgGridColumn field={'icon'} headerName='Icon' cellRenderer='rowIcon' width={70} editable={false} /> */}
              <AgGridColumn field='name' minWidth={200} />
              <AgGridColumn field='awardType' headerName='Template' minWidth={200} />
              <AgGridColumn field='description' flex={1} />
            </AgGridReact>
          </div>
        </div>
        {selectedRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', width: '700px' }}>
            <span style={{ fontSize: 30 }}>{selectedRecord.name}</span>
            <Text fontSize='14px' noClamp>
              NOTE: Trait {'&'} Group configuration requirements are currently only supported in the Review Portal. All other award
              configurations will be made available in such a way that any user can be nominated to any award. Support for reward
              eligibility limits by group {'&'} trait are coming soon.
            </Text>
            <br />

            <TabBar options={TABS} setSelected={setCurrentTab} selected={currentTab} />

            <div style={{ background: 'rgba(24, 144, 255, 0.02)', border: '1px solid rgba(24, 144, 255, 0.14)', marginTop: 5 }}>
              {currentTab === TAB_KEYS.GROUPS && renderGroupsTab()}
              {currentTab === TAB_KEYS.TRAITS && renderTraitsTab()}
            </div>
          </div>
        )}
      </div>
      <LinkGroupsModal
        isGroupsModalOpen={isGroupsModalOpen}
        linkGroup={linkGroup}
        relatedGroups={relatedGroups}
        setIsGroupsModalOpen={setIsGroupsModalOpen}
      />
      <LinkTraitsModal
        isTraitsModalOpen={isTraitsModalOpen}
        linkTrait={linkTrait}
        relatedTraits={relatedTraits}
        setIsTraitsModalOpen={setIsTraitsModalOpen}
      />
    </div>
  )
}

export default AwardTypesGridEditor
