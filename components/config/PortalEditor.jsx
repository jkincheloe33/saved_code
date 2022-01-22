import { useEffect, useState } from 'react'
import styled from 'styled-components'
import QRCode from 'qrcode.react'
import { AgGridReact, AgGridColumn } from '@ag-grid-community/react'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'

import { colors } from '@assets'
import { LinkGroupsModal, LinkTraitsModal, Modal, TabBar } from '@components'
import { api } from '@services'

const ItemInfo = styled.div`
  display: flex;
  flex-direction: column;
`

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

const PatientFollowUpContainer = styled.div`
  display: flex;
`

const TAB_KEYS = {
  GENERAL: 0,
  GROUPS: 1,
  QUESTION_SETS: 2,
  AWARDS: 3,
}

const TABS = ['General', 'Groups', 'Question Sets', 'Awards']

let lastNewId = 0

const PortalEditor = () => {
  const [codeMsg, setCodeMsg] = useState(null)
  const [currentTab, setCurrentTab] = useState(TAB_KEYS.GENERAL)
  const [gridApi, setGridApi] = useState(null)
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false)
  const [isQuestionSetGroupsModalOpen, setIsQuestionSetGroupsModalOpen] = useState(false)
  const [isQuestionSetsModalOpen, setIsQuestionSetsModalOpen] = useState(false)
  const [isTraitsModalOpen, setIsTraitsModalOpen] = useState(false)
  const [originalSelectedRecord, setOriginalSelectedRecord] = useState(null)
  const [questionSets, setQuestionSets] = useState([])
  const [qrColor, setQRColor] = useState({ bg: colors.white, fg: colors.blurple })
  const [relatedAwards, setRelatedAwards] = useState([])
  const [relatedGroups, setRelatedGroups] = useState([])
  const [relatedQuestionSetGroups, setRelatedQuestionSetGroups] = useState([])
  const [relatedQuestionSets, setRelatedQuestionSets] = useState([])
  const [relatedTraits, setRelatedTraits] = useState([])
  const [rowData, setRowData] = useState(null)
  const [selectedQuestionSet, setSelectedQuestionSet] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)

  useEffect(() => {
    const getQuestionSets = async () => {
      const {
        data: { questionSetsForAccount, success },
      } = await api.get('/config/questionSets/list')

      if (success) setQuestionSets(questionSetsForAccount)
    }

    if (isQuestionSetsModalOpen) getQuestionSets()
  }, [isQuestionSetsModalOpen])

  useEffect(() => {
    const getRelatedItems = async () => {
      if (selectedRecord == null) return

      const {
        data: { success, relatedGroups, relatedQuestionSetGroups, relatedQuestionSets, relatedAwards },
      } = await api.post('/config/portals/relatedItems', { portalId: selectedRecord.id })

      if (success) {
        setRelatedGroups(relatedGroups)
        setRelatedQuestionSets(relatedQuestionSets)
        setRelatedQuestionSetGroups(relatedQuestionSetGroups)
        setRelatedAwards(relatedAwards)
      }
    }

    getRelatedItems()
  }, [selectedRecord])

  useEffect(() => {
    const getRelatedQuestionSetItems = async () => {
      const {
        data: { relatedTraits, success },
      } = await api.post('/config/portals/questionSets/relatedItems', { portalQuestionSetId: selectedQuestionSet.id })

      if (success) setRelatedTraits(relatedTraits)
    }

    if (selectedQuestionSet?.id) getRelatedQuestionSetItems()
  }, [selectedQuestionSet])

  const onGridReady = async params => {
    setGridApi(params.api)

    let { data } = await api.get('/config/portals/list')
    setRowData(data.portalsForAccount)

    // Select the first record...EK
    setTimeout(() => {
      params.api.forEachNode(node => {
        if (node.rowIndex === 0) {
          node.setSelected(true)
        }
      })
    }, 0)
  }

  const handleCheckCode = async () => {
    const { data } = await api.get(`/config/portals/checkChatCode?chatCode=${selectedRecord.chatCode}`)
    setCodeMsg(data.msg)
  }

  const handleUpdateCode = async () => {
    const { id, chatCode } = selectedRecord

    const body = {
      portalId: id,
    }

    if (chatCode) {
      body.newCode = chatCode
    }
    const {
      data: { msg, newCode, success },
    } = await api.post('/config/portals/updateChatCode', body)
    if (success) {
      // Reinitialize selected records to same chat code...JC
      setOriginalSelectedRecord({
        ...originalSelectedRecord,
        chatCode: newCode,
      })
      setSelectedRecord({
        ...selectedRecord,
        chatCode: newCode,
      })
      const updatedRowData = rowData.map(row => {
        if (row.id === selectedRecord.id) {
          row.chatCode = newCode
          return row
        }
        return row
      })
      setRowData(updatedRowData)
    }
    setCodeMsg(msg)
  }

  const newRecord = () => {
    // NOTE: I didn't apply the account Id.  This is controlled at the service level and applied to the user based on the url...EK
    setRowData([
      ...rowData,
      {
        id: --lastNewId,
        name: '',
        description: '',
        chatCode: '',
        donationLink: '',
      },
    ])
  }

  const handleEdit = (property, value) => {
    if (property === 'chatCode') {
      setCodeMsg(null)
    }
    setSelectedRecord({ ...selectedRecord, ...{ [property]: value } })
  }

  const saveFieldEdits = async () => {
    // Compare edit vs original to see if there are changes to be made...EK
    if (JSON.stringify(selectedRecord) !== JSON.stringify(originalSelectedRecord)) {
      await api.post('/config/portals/save', { updated: selectedRecord })
      setOriginalSelectedRecord(selectedRecord)

      // Merge back into the list array...EK
      let indexOfRecord = rowData.findIndex(r => r.id === selectedRecord.id)
      setRowData([...rowData.slice(0, indexOfRecord), selectedRecord, ...rowData.slice(indexOfRecord + 1)])
    }
    // ELSE: No changes detected...EK
  }

  const saveGridChanges = async ({ data }) => {
    if (data.id < 0) {
      // This is a new record, we need to insert, and then merge the returned ID...EK
      let { data: insertRes } = await api.post('/config/portals/save', { inserted: data })

      // Merge ID back into record based on negative id...EK
      let newRow = gridApi.getRowNode(data.id)
      if (newRow != null) {
        newRow.setDataValue('id', insertRes.newId)
        selectedRecord.shortUid = insertRes.shortUid
      }
    } else {
      await api.post('/config/portals/save', { updated: data })
      setOriginalSelectedRecord(selectedRecord)
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
        let { data: deletedRes } = await api.post('/config/portals/save', { deleted: selectedRecord })
        if (deletedRes.success) {
          setRowData(rowData.filter(r => r.id !== selectedRecord.id))
          setSelectedRecord(null)
          setOriginalSelectedRecord(null)
        }
      }
    }
  }

  // Links and unlinks groups to portals...KA
  const linkGroup = async group => {
    const {
      data: { newLinkId, success },
    } = await api.post('/config/portals/linkGroup', { portalId: selectedRecord.id, groupId: group.id })

    if (success) setRelatedGroups(rg => [...rg, { ...group, id: newLinkId, groupId: group.id }])
  }

  const unlinkGroup = async id => {
    const {
      data: { success },
    } = await api.post('/config/portals/unlinkGroup', { id })

    if (success) setRelatedGroups(rg => rg.filter(g => g.id !== id))
  }

  // Links and unlinks groups to portal question set links...KA
  const linkQuestionSetGroup = async item => {
    const {
      data: { newLinkId, success },
    } = await api.post('/config/portals/questionSets/linkGroup', { portalQuestionSetId: selectedQuestionSet.id, groupId: item.id })

    if (success) {
      setRelatedQuestionSetGroups(rg => [...rg, { ...item, groupId: item.id, id: newLinkId, portalQuestionSetId: selectedQuestionSet.id }])
    }
  }

  const unlinkQuestionSetGroup = async id => {
    const {
      data: { success },
    } = await api.post('/config/portals/questionSets/unlinkGroup', { id })

    if (success) setRelatedQuestionSetGroups(rg => rg.filter(g => g.id !== id))
  }

  const linkQuestionSetTrait = async item => {
    const {
      data: { newLinkId, success },
    } = await api.post('/config/portals/questionSets/linkTrait', { portalQuestionSetId: selectedQuestionSet.id, traitId: item.id })

    if (success) {
      setRelatedTraits(rt => [...rt, { ...item, id: newLinkId, portalQuestionSetId: selectedQuestionSet.id, traitId: item.id }])
    }
  }

  const unlinkQuestionSetTrait = async id => {
    const {
      data: { success },
    } = await api.post('/config/portals/questionSets/unlinkTrait', { id })

    if (success) setRelatedTraits(rt => rt.filter(t => t.id !== id))
  }

  const linkQuestionSet = async item => {
    const {
      data: { newLinkId, success },
    } = await api.post('/config/portals/linkQuestionSet', { portalId: selectedRecord.id, questionSetId: item.id })

    if (success) setRelatedQuestionSets(rqs => [...rqs, { ...item, id: newLinkId, questionSetId: item.id }])
  }

  const unlinkQuestionSet = async id => {
    const {
      data: { success },
    } = await api.post('/config/portals/unlinkQuestionSet', { id })

    if (success) setRelatedQuestionSets(rqs => rqs.filter(r => r.id !== id))
  }

  const updatePortalQuestionSet = async (id, order) => {
    await api.post('/config/portals/questionSets/save', { order, portalQuestionSetId: id })
  }

  const renderGeneralTab = () => {
    {
      /* ['name', 'description', 'chatCode', 'donationLink'] */
    }
    let windowLoc = window.location
    const portalLink = `${windowLoc.protocol}//${windowLoc.host}/api/site/portal?id=${selectedRecord.shortUid}`
    return (
      <div style={{ display: 'flex', flexDirection: 'column', padding: 5 }}>
        <label>Description</label>
        <textarea
          name='description'
          value={selectedRecord.description || ''}
          onChange={e => handleEdit('description', e.target.value)}
          onBlur={saveFieldEdits}
        />
        <br />
        <label>Donation Link</label>
        <input
          value={selectedRecord.donationLink || ''}
          type='text'
          onChange={e => handleEdit('donationLink', e.target.value)}
          onBlur={saveFieldEdits}
        />
        <br />
        <label>Chat Bot Code</label> <span>{codeMsg}</span>
        <input name='chatCode' type='text' value={selectedRecord.chatCode || ''} onChange={e => handleEdit('chatCode', e.target.value)} />
        <button onClick={() => handleCheckCode()}>Check Code</button>
        <button onClick={() => handleUpdateCode()}>Update Code</button>
        <br />
        <label>Portal Link</label>
        <input value={portalLink} readOnly />
        <br />
        <label>Comment Prompt Threshold (1-5)</label>
        <input
          name='comment prompt threshold'
          onBlur={saveFieldEdits}
          onChange={({ target: { value } }) => (!value || (value >= 1 && value <= 5)) && handleEdit('commentPromptThreshold', value)}
          value={selectedRecord.commentPromptThreshold || ''}
        />
        <br />
        <label>Notify On Feedback</label>
        <input
          name='Notify On Feedback'
          onBlur={saveFieldEdits}
          onChange={e => handleEdit('notifyOnFeedback', e.target.value)}
          value={selectedRecord.notifyOnFeedback || ''}
        />
        <br />
        <PatientFollowUpContainer>
          <input
            type='checkbox'
            checked={selectedRecord.disableTranslations === 1}
            onChange={e => handleEdit('disableTranslations', e.target.checked ? 1 : 0)}
            onBlur={saveFieldEdits}
          />
          <label>Disable portal translations</label>
        </PatientFollowUpContainer>
        <PatientFollowUpContainer>
          <input
            type='checkbox'
            checked={selectedRecord.showReviewFollowup === 0}
            onChange={e => handleEdit('showReviewFollowup', e.target.checked ? 0 : 1)}
            onBlur={saveFieldEdits}
          />
          <label>Hide patient follow-up fields </label>
        </PatientFollowUpContainer>
        <br />
        <div style={{ padding: 5, border: '1px solid #888', borderRadius: 3, flexDirection: 'row', display: 'flex' }}>
          <div style={{ margin: '10px' }}>
            <QRCode value={portalLink} size={250} fgColor={qrColor.fg} bgColor={qrColor.bg} />
          </div>
          <div style={{ margin: '10px' }}>
            <QRCode value={portalLink} size={150} fgColor={qrColor.fg} bgColor={qrColor.bg} />
          </div>
          <div style={{ margin: '10px' }}>
            <QRCode value={portalLink} size={100} fgColor={qrColor.fg} bgColor={qrColor.bg} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', margin: 5 }}>
            <label>Background</label>
            <input type='color' value={qrColor.bg} onChange={e => setQRColor({ ...qrColor, bg: e.target.value })} />

            <label>Foreground</label>
            <input type='color' value={qrColor.fg} onChange={e => setQRColor({ ...qrColor, fg: e.target.value })} />

            <p>Right-click to copy</p>
          </div>
        </div>
      </div>
    )
  }

  const renderGroupsTab = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <button onClick={() => setIsGroupsModalOpen(true)}>Add Group</button>
        {relatedGroups?.map(rg => (
          <ItemRow key={rg.id}>
            <ItemInfo>
              <div>{rg.name}</div>
              {rg.groupCount && (
                <div style={{ fontSize: '14px' }}>{`Includes ${rg.groupCount} sub-group${rg.groupCount > 1 ? 's' : ''} with a total of ${
                  rg.peopleCount ?? 0
                } ${rg.peopleCount?.length === 1 ? 'person' : 'people'} available for review.`}</div>
              )}
            </ItemInfo>
            <button onClick={() => unlinkGroup(rg.id)}>Unlink</button>
          </ItemRow>
        ))}
      </div>
    )
  }

  const renderQuestionSetsTab = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <button onClick={() => setIsQuestionSetsModalOpen(true)}>Add Question Set</button>
        {relatedQuestionSets?.map(qs => (
          <ItemRow key={qs.id} style={{ flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <ItemInfo>
                <div>{qs.name}</div>
                <div style={{ fontSize: '14px' }}>{qs.traits ? `Employees with traits: ${qs.traits}` : 'All employees'}</div>
                <div style={{ fontSize: '14px' }}>
                  Order:{' '}
                  <input
                    defaultValue={qs.order}
                    name='qs.order'
                    onChange={e => updatePortalQuestionSet(qs.id, e.target.value)}
                    type='text'
                  />
                </div>
              </ItemInfo>
              <div style={{ margin: 'auto 0' }}>
                <button
                  onClick={() => {
                    setSelectedQuestionSet(qs)
                    setIsQuestionSetGroupsModalOpen(true)
                  }}
                >
                  Add Group
                </button>
                <button
                  onClick={() => {
                    setSelectedQuestionSet(qs)
                    setIsTraitsModalOpen(true)
                  }}
                >
                  Add Trait
                </button>
                <button onClick={() => unlinkQuestionSet(qs.id)}>Unlink</button>
              </div>
            </div>
            {relatedQuestionSetGroups.filter(rg => rg.portalQuestionSetId === qs.id).length ? (
              <>
                <div style={{ fontSize: '14px', marginTop: 20 }}>Linked Groups:</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {relatedQuestionSetGroups
                    .filter(rg => rg.portalQuestionSetId === qs.id)
                    .map(rg => (
                      <ItemRow key={rg.id}>
                        <div>{rg.name}</div>
                        <button onClick={() => unlinkQuestionSetGroup(rg.id)}>Unlink Group</button>
                      </ItemRow>
                    ))}
                </div>
              </>
            ) : null}
          </ItemRow>
        ))}
      </div>
    )
  }

  const renderAwardsTab = () => {
    return (
      <div>
        {relatedAwards?.map(({ awardType, id, name }) => (
          <ItemRow key={id}>
            <div>{name}</div>
            <div style={{ fontSize: '14px' }}>Award Type: {awardType}</div>
          </ItemRow>
        ))}
      </div>
    )
  }
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div>
        <button onClick={newRecord}>New Portal</button>
        <button onClick={deleteRecord}>Delete Portal</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div style={{ height: '100%', width: '300px', marginRight: '5px' }}>
          <div
            id='myGrid'
            style={{
              width: '100%',
              height: '600px',
            }}
            className='ag-theme-alpine'
          >
            <AgGridReact
              modules={[ClientSideRowModelModule]}
              defaultColDef={{
                editable: true,
                resizable: true,
              }}
              enterMovesDown={true}
              enterMovesDownAfterEdit={true}
              onGridReady={onGridReady}
              onCellValueChanged={saveGridChanges}
              rowData={rowData}
              getRowNodeId={data => data.id}
              rowSelection={'single'}
              onSelectionChanged={() => {
                let newSelRec = gridApi.getSelectedRows()[0]
                setCodeMsg(null)
                setSelectedRecord(newSelRec)
                setOriginalSelectedRecord(newSelRec)
              }}
            >
              <AgGridColumn field='id' editable={false} width={80} />
              <AgGridColumn field='name' flex={1} />
            </AgGridReact>
          </div>
        </div>

        {selectedRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', width: '800px' }}>
            <span style={{ fontSize: 30 }}>{selectedRecord.name}</span>
            <br />

            <TabBar options={TABS} setSelected={setCurrentTab} selected={currentTab} />

            <div style={{ background: 'rgba(24, 144, 255, 0.02)', border: '1px solid rgba(24, 144, 255, 0.14)', marginTop: 5 }}>
              {currentTab === TAB_KEYS.GENERAL && renderGeneralTab()}
              {currentTab === TAB_KEYS.GROUPS && renderGroupsTab()}
              {currentTab === TAB_KEYS.QUESTION_SETS && renderQuestionSetsTab()}
              {currentTab === TAB_KEYS.AWARDS && renderAwardsTab()}
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
        linkTrait={linkQuestionSetTrait}
        relatedTraits={relatedTraits}
        setIsTraitsModalOpen={setIsTraitsModalOpen}
        unlinkTrait={unlinkQuestionSetTrait}
      />
      <LinkGroupsModal
        isGroupsModalOpen={isQuestionSetGroupsModalOpen}
        linkGroup={linkQuestionSetGroup}
        parentGroups={relatedGroups}
        relatedGroups={relatedQuestionSetGroups.filter(rg => rg.portalQuestionSetId === selectedQuestionSet?.id)}
        setIsGroupsModalOpen={setIsQuestionSetGroupsModalOpen}
        unlinkGroup={unlinkQuestionSetGroup}
      />
      <Modal onClickOut={() => setIsQuestionSetsModalOpen(false)} open={isQuestionSetsModalOpen}>
        {questionSets.map(qs => (
          <ItemRow key={qs.id}>
            {qs.name} ({qs.id})
            {!relatedQuestionSets.some(rqs => rqs.questionSetId === qs.id) && <button onClick={() => linkQuestionSet(qs)}>Link</button>}
          </ItemRow>
        ))}
      </Modal>
    </div>
  )
}

export default PortalEditor
