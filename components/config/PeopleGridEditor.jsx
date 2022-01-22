import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import moment from 'moment'
import { AgGridReact, AgGridColumn } from '@ag-grid-community/react'
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model'

import { colors } from '@assets'
import { ConfigWambiCompose, ImageEditorWorkflow, LinkGroupsModal, LinkTraitsModal, Modal, Select, TabBar } from '@components'
import { useAuthContext } from '@contexts'
import { api } from '@services'
import {
  GROUP_ACCESS_LEVELS_ARRAY_NAMES,
  PEOPLE_GROUP_PRIMARY_TYPES,
  PRONOUNS,
  PRONOUNS_ARRAY_NAMES,
  useStore,
  USER_NOTIFY_METHODS,
  USER_NOTIFY_METHODS_ARRAY_NAMES,
  USER_STATUS,
} from '@utils'

let lastNewId = 0

const MAX_PROGRESS = 1000

const Dropdown = styled(Select)`
  padding: 5px 0 5px 15px;
  width: 220px;
`

const ListContainer = styled.div`
  background: ${colors.white};
  border-radius: 3px;
  flex: 1;
  flex-direction: column;
  min-height: 200px;
  padding: 15px;
  margin: 10px;

  button {
    margin-left: 20px;
  }

  input {
    margin: auto;
    width: 60px;
  }
`

const MembershipRow = styled.div`
  align-items: center;
  border-bottom: 1px solid ${colors.gray5};
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
`

const TAB_KEYS = {
  GROUPS: 0,
  TRAITS: 1,
  CLAIMS: 2,
  CHALLENGES: 3,
  PROGRESS: 4,
}

const TABS = ['Group Membership', 'Trait Membership', 'Reward Claims', 'Challenges', 'Reward Progress']

const PeopleGridEditor = ({ setIsBusy, showPeopleSelector }) => {
  const {
    clientAccount: {
      settings: { integrations },
    },
  } = useAuthContext()

  const [activeTab, setActiveTab] = useState(TAB_KEYS.GROUPS)
  const [gridApi, setGridApi] = useState()
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false)
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false)
  const [isPeopleModalOpen, setIsPeopleModalOpen] = useState(false)
  const [isSendWambiModalOpen, setIsSendWambiModalOpen] = useState(false)
  const [isTraitsModalOpen, setIsTraitsModalOpen] = useState(false)
  const [modalGridApi, setModalGridApi] = useState(null)
  const [progressIncrement, setProgressIncrement] = useState('')
  const [relatedChallenges, setRelatedChallenges] = useState([])
  const [relatedRewardClaims, setRelatedRewardClaims] = useState([])
  const [relatedRewardProgress, setRelatedRewardProgress] = useState([])
  const [relatedGroups, setRelatedGroups] = useState([])
  const [relatedTraits, setRelatedTraits] = useState([])
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [setStore, { user }] = useStore()

  const onProfileUpdated = updatedProfile => {
    // update the selected user image after saving...PS
    const node = gridApi.getRowNode(selectedRecord.id)
    node.setData({ ...selectedRecord, ...updatedProfile })
    setSelectedRecord({ ...selectedRecord, ...updatedProfile })

    if (user.id === selectedRecord.id) {
      setStore({ user: { ...user, ...updatedProfile } })
    }
  }

  const onGridReady = async params => {
    setGridApi(params.api)

    const dataSource = {
      rowCount: null,
      getRows: async params => {
        const { startRow, endRow, filterModel: filter, sortModel: sort } = params

        const {
          data: { peopleForAccount },
        } = await api.post('/config/people/list', { startRow, endRow, filter, sort })

        // Convert the dates into usable dates (based on UTC - since we only need the Date / no time)
        peopleForAccount.forEach(person => {
          person.birthday = person.birthday ? moment(person.birthday).utc().format('MMM D') : null
          person.hireDate = person.hireDate ? moment(person.hireDate).utc().format('MMM D YYYY') : null
        })

        const lastRow = peopleForAccount.length < endRow - startRow ? startRow + peopleForAccount.length : -1
        params.successCallback(peopleForAccount, lastRow)
      },
    }

    params.api.setDatasource(dataSource)
  }

  useEffect(() => {
    const loadPeopleMembership = async () => {
      const {
        data: { challenges, groupMembership, rewardClaims, rewardProgress, traitMembership },
      } = await api.post('/config/people/membership', { peopleId: selectedRecord.id })

      setRelatedGroups(groupMembership)
      setRelatedTraits(traitMembership)
      setRelatedRewardClaims(rewardClaims)
      setRelatedChallenges(challenges)
      setRelatedRewardProgress(rewardProgress)
    }

    if (selectedRecord != null) loadPeopleMembership()
  }, [selectedRecord])

  const newRecord = async () => {
    const existingPerson = confirm('Does the person already exist in another client account?')

    if (existingPerson) {
      setIsPeopleModalOpen(true)
    } else {
      // For now, we are going to prompt for a login ID and then create the record for them...EK
      const newPersonLogin = prompt('What is the login for this new person?')

      if (newPersonLogin) {
        const {
          data: { msg, success },
        } = await api.post('/config/people/save', { inserted: { id: --lastNewId, loginId: newPersonLogin } })

        if (success) gridApi.refreshInfiniteCache()
        else alert(msg)
      } else {
        alert('No login specified.  No person created.')
      }
    }
  }

  const saveChanges = async ({ data }) => {
    const {
      data: { msg, success },
    } = await api.post('/config/people/save', { updated: data })

    if (success) {
      setSelectedRecord({ ...selectedRecord, ...data })

      gridApi?.refreshInfiniteCache()
    } else alert(msg)
  }

  const resetPassword = async () => {
    const newPassword = prompt(`Specify a new password for '${selectedRecord.loginId}'`)

    if (newPassword) {
      const {
        data: { success },
      } = await api.post('/config/people/setPassword', { peopleId: selectedRecord.id, newPassword })

      if (success) alert('Password successfully updated!')
    }
  }

  const _exportAll = async asCSV => {
    let { data } = await api.post('/config/export/peopleByAll', { asCSV }, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([data]))
    const link = document.createElement('a')
    link.href = url

    if (asCSV === true) {
      link.setAttribute('download', 'export-people.csv')
    } else {
      link.setAttribute('download', 'export-people.xlsx')
    }

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const _getImportTemplate = async () => {
    let { data } = await api.get('/config/people/getImportTemplate', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'import-people.xlsx')

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCheckbox = key => params => {
    const newValue = params.node.data[key] == 1 ? 0 : 1
    params.node.setDataValue(key, newValue)
  }

  const handleEmailSync = async () => {
    setIsBusy(true)
    const {
      data: { msg, success },
    } = await api.get('/config/mailChimp/sync')

    if (success) alert(msg)
    setIsBusy(false)
  }

  const _importPeople = async () => {
    const fileInput = document.getElementById('people-import-file')

    fileInput.onchange = async () => {
      // Push the file to the server...EK
      let formData = new FormData()
      formData.append('importFile', fileInput.files[0])

      const { data: importRes } = await api.post('/config/people/import', formData)

      fileInput.value = null

      if (importRes.success) {
        alert(`Import Successful! ${importRes.mergedPeople} people merged.  ${importRes.createdPeople} people created.`)
      } else {
        alert(`Import Failure: ${importRes.msg}`)
      }
    }

    fileInput.click()
  }

  const _updatePerson = (id, data = {}) => {
    //Work around for ag-grid id search bug...CY
    let node
    gridApi.forEachNode(row => {
      if (row.data.id === id) {
        return (node = row)
      }
    })

    if (node != null) {
      const updateIndex = relatedGroups.findIndex(member => member.id === id)
      setSelectedRecord({ ...selectedRecord, ...data })
      relatedGroups[updateIndex] = { ...node.data, ...data }
      node.setData({ ...node.data, ...data })
    }
  }

  const deletePersonImage = async () => {
    const { firstName, id, lastName } = selectedRecord
    if (confirm('Do you want to delete this users profile picture?')) {
      const {
        data: { success },
      } = await api.post('/config/people/deleteImage', { peopleId: id })
      if (success) _updatePerson(id, { originalImage: `${firstName[0]}${lastName[0]}` })
    }
  }

  const updatePersonStatus = async () => {
    const { firstName, lastName, status } = selectedRecord
    const newStatus = status === USER_STATUS.ACTIVE ? USER_STATUS.DISABLED : USER_STATUS.ACTIVE
    if (confirm(`Do you want to ${status === USER_STATUS.ACTIVE ? 'deactivate' : 'activate'} ${firstName} ${lastName}?`)) {
      const {
        data: { success },
      } = await api.post('/config/people/save', { updated: { ...selectedRecord, status: newStatus } })

      if (success) _updatePerson(selectedRecord.id, { status: newStatus })
      else alert('Failed to update user status')
    }
  }

  const extendRewardClaim = async rewardClaimId => {
    setSubmitting(true)

    const {
      data: { success },
    } = await api.post('/config/people/extendRewardClaim', { peopleId: selectedRecord.id, rewardClaimId })

    if (success) {
      setRelatedRewardClaims(rrc =>
        rrc.map(rc => {
          /* CY
            Find and extend gift date: 
              - If gift was already expired, extend by today's date
              - Else, extend by gift current expiration date
          */
          if (rc.rewardClaimId === rewardClaimId) {
            const extendByDate = moment(rc.expiresAt).isBefore(moment()) ? moment() : moment(rc.expiresAt)
            rc.expiresAt = extendByDate.add(14, 'days')
          }

          return rc
        })
      )
    }
    setTimeout(() => setSubmitting(false), 2000)
  }

  const addRewardProgress = async progressIncrement => {
    if (progressIncrement <= 0) return alert('Count must be greater than 0')

    setSubmitting(true)

    const {
      data: { rewardProgress, success },
    } = await api.post('/config/people/addRewardProgress', { progressIncrement, peopleId: selectedRecord.id })

    if (success) setRelatedRewardProgress(rewardProgress)

    setTimeout(() => setSubmitting(false), 2000)
  }

  const addExistingPeople = async rows => {
    const {
      data: { msg, success },
    } = await api.post('/config/people/addExistingPeopleToAccount', {
      peopleIds: rows.map(p => p.id),
    })

    if (success) modalGridApi.refreshInfiniteCache()
    else alert(msg)

    setIsPeopleModalOpen(false)
  }

  const onModalGridReady = async params => {
    setModalGridApi(params.api)

    const dataSource = {
      rowCount: null,
      getRows: async params => {
        const { startRow, endRow, filterModel: filter, sortModel: sort } = params

        const {
          data: { peopleList, success },
        } = await api.post('/config/people/getPeopleNotInAccount', { startRow, endRow, filter, sort })

        if (success) {
          const lastRow = peopleList.length < endRow - startRow ? startRow + peopleList.length : -1
          params.successCallback(peopleList, lastRow)
        }
      },
    }

    params.api.setDatasource(dataSource)
  }

  const deleteManager = async () => {
    const allowDelete = confirm(`Are you sure you want to remove the manager for ${selectedRecord.firstName} ${selectedRecord.lastName}?`)

    if (allowDelete) await saveChanges({ data: { ...selectedRecord, reportsTo: null } })
  }

  const linkGroup = async group => {
    const {
      data: { newId, success },
    } = await api.post('/config/people/assignGroups', { groupId: group.id, peopleId: selectedRecord.id })

    if (success) setRelatedGroups(rg => [...rg, { ...group, peopleGroupId: newId, groupId: group.id }])
  }

  const linkTrait = async trait => {
    const {
      data: { newId, success },
    } = await api.post('/config/people/assignTraits', { peopleId: selectedRecord.id, traitId: trait.id })

    if (success) setRelatedTraits(rt => [...rt, { ...trait, peopleTraitId: newId, traitId: trait.id }])
  }

  const unlinkGroup = async peopleGroupId => {
    const {
      data: { msg, success },
    } = await api.post('/config/people/removeGroups', { peopleGroupId })

    if (success) setRelatedGroups(rg => rg.filter(m => m.peopleGroupId != peopleGroupId))
    else alert(msg)
  }

  const unlinkTrait = async peopleTraitId => {
    const {
      data: { msg, success },
    } = await api.post('/config/traits/removeTraitMember', { id: peopleTraitId })

    if (success) setRelatedTraits(rt => rt.filter(m => m.peopleTraitId != peopleTraitId))
    else alert(msg)
  }

  const updateGroupMembership = async peopleGroup => {
    const {
      data: { msg, success },
    } = await api.post('/config/people/updateGroupMembership', peopleGroup)

    if (success) {
      setRelatedGroups(relatedGroups.map(rg => (rg.peopleGroupId === peopleGroup.peopleGroupId ? peopleGroup : rg)))
    } else alert(msg)
  }

  const renderPronounsDropdown = ({ data }) => (
    <Dropdown
      defaultValue={data?.pronouns ?? ''}
      onChange={e =>
        saveChanges({
          data: { ...data, pronouns: e.target.value !== PRONOUNS_ARRAY_NAMES[PRONOUNS.NO_PREFERENCE] ? e.target.value : null },
        })
      }
      options={PRONOUNS_ARRAY_NAMES.map(m => ({ name: m, value: m }))}
    />
  )

  const renderNotifyMethodsDropdown = ({ data }) => (
    <Dropdown
      defaultValue={data?.notifyMethod ?? ''}
      onChange={e =>
        saveChanges({
          data: { ...data, notifyMethod: Number(e.target.value) },
        })
      }
      options={USER_NOTIFY_METHODS_ARRAY_NAMES.map((m, i) => ({ name: m, value: i })).filter(nm =>
        data?.isSelfRegistered ? nm.value !== USER_NOTIFY_METHODS.TEXT_AND_EMAIL && nm.value !== USER_NOTIFY_METHODS.TEXT_ONLY : true
      )}
    />
  )

  const renderGroupMembership = () => (
    <>
      <ListContainer>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <span>Group Membership</span>
            {selectedRecord && <button onClick={() => setIsGroupsModalOpen(true)}>Link Group</button>}
          </div>
          <span>Primary</span>
        </div>
        <div>
          {relatedGroups.map(rg => (
            <MembershipRow key={rg.peopleGroupId}>
              <div>
                <div style={{ display: 'flex' }}>
                  <div style={{ color: colors.blurple }}>{rg.name}</div>
                  <div style={{ color: '#999', marginLeft: '10px' }}>{`(${rg.groupTypeName})`}</div>
                </div>
                {rg.parentGroupName && (
                  <div style={{ color: '#999', fontSize: '14px', marginLeft: '20px' }}>
                    Parent Group: <span style={{ color: colors.gray1 }}>{rg.parentGroupName}</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex' }}>
                <select onChange={e => updateGroupMembership({ ...rg, level: e.target.value })} value={rg.level}>
                  {GROUP_ACCESS_LEVELS_ARRAY_NAMES.filter(n => n != null).map((level, i) => (
                    <option value={i + 1} key={i}>
                      {level}
                    </option>
                  ))}
                </select>
                <button onClick={() => unlinkGroup(rg.peopleGroupId)}>Unlink</button>
                <input checked={rg.isPrimary > PEOPLE_GROUP_PRIMARY_TYPES.NONE} readOnly type='checkbox' />
              </div>
            </MembershipRow>
          ))}
        </div>
      </ListContainer>
      <LinkGroupsModal
        isGroupsModalOpen={isGroupsModalOpen}
        linkGroup={linkGroup}
        relatedGroups={relatedGroups}
        setIsGroupsModalOpen={setIsGroupsModalOpen}
      />
    </>
  )

  const renderTraitMembership = () => (
    <>
      <ListContainer>
        <span>Trait Membership</span>
        {selectedRecord && <button onClick={() => setIsTraitsModalOpen(true)}>Link Trait</button>}
        <div>
          {relatedTraits.map(rt => (
            <MembershipRow key={rt.peopleTraitId}>
              <div style={{ display: 'flex' }}>
                <div key={rt.peopleTraitId} style={{ color: colors.blurple }}>
                  {rt.name}
                </div>
                <div style={{ color: '#999', marginLeft: '10px' }}>{`(${rt.traitTypeName})`}</div>
              </div>
              <div>
                <button onClick={() => unlinkTrait(rt.peopleTraitId)}>Unlink</button>
              </div>
            </MembershipRow>
          ))}
        </div>
      </ListContainer>
      <LinkTraitsModal
        isTraitsModalOpen={isTraitsModalOpen}
        linkTrait={linkTrait}
        relatedTraits={relatedTraits}
        setIsTraitsModalOpen={setIsTraitsModalOpen}
      />
    </>
  )

  const renderRewardClaims = () => (
    <ListContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Reward Claims</span>
        <span style={{ alignSelf: 'end' }}>Created</span>
      </div>
      <div>
        {relatedRewardClaims.map(rc => (
          <MembershipRow key={rc.rewardClaimId}>
            <div style={{ display: 'flex' }}>
              <div style={{ color: colors.blurple }}>
                <span>{rc.name}</span>
                <span style={{ marginLeft: '5px' }}>{rc.attributeValue ? `(${rc.attributeValue})` : ''}</span>
                <div style={{ color: '#999' }}>
                  {rc.claimedAt
                    ? `Claimed ${moment(rc.claimedAt).format('MMM D [at] h:mm A')}`
                    : moment(rc.expiresAt).isBefore(moment())
                    ? 'Expired'
                    : `Unclaimed - Expires ${moment(rc.expiresAt).format('MMM D [at] h:mm A')}`}
                  {!rc.claimedAt && (
                    <button
                      disabled={submitting}
                      onClick={() => extendRewardClaim(rc.rewardClaimId)}
                      style={{ cursor: submitting ? 'auto' : 'pointer' }}
                    >
                      Extend (2 weeks)
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div style={{ color: '#999', display: 'flex' }}>
              <span>{moment(rc.createdAt).format('MMM D [at] h:mm A')}</span>
            </div>
          </MembershipRow>
        ))}
      </div>
    </ListContainer>
  )

  const renderChallenges = () => (
    <ListContainer>
      <div>
        <span>Challenges</span>
        {relatedChallenges.map(ct => (
          <MembershipRow key={ct.challengeProgressId}>
            <div style={{ display: 'flex' }}>
              <div style={{ color: colors.blurple }}>{ct.title}</div>
            </div>
            <div style={{ color: '#999', display: 'flex' }}>
              <span>
                {ct.completedAt
                  ? `Completed ${moment(ct.completedAt).format('MMM D [at] h:mm A')}`
                  : ct.endDate && moment() >= moment(ct.endDate)
                  ? 'Expired'
                  : 'Active'}
              </span>
            </div>
          </MembershipRow>
        ))}
      </div>
    </ListContainer>
  )

  const renderRewardProgress = () => (
    <ListContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <span>Reward Progress</span>
          <input
            onChange={e => setProgressIncrement(Number(e.target.value))}
            min={0}
            placeholder='Custom Amount'
            step={50}
            style={{ marginLeft: 20, width: 150 }}
            type='number'
            value={progressIncrement}
          />
          <button
            disabled={submitting}
            onClick={() => addRewardProgress(progressIncrement)}
            style={{ cursor: submitting ? 'auto' : 'pointer' }}
          >
            Fill Custom
          </button>
          <button disabled={submitting} onClick={() => addRewardProgress(MAX_PROGRESS)} style={{ cursor: submitting ? 'auto' : 'pointer' }}>
            Fill Bar (1000)
          </button>
        </div>
        <span style={{ alignSelf: 'end' }}>Status</span>
      </div>
      <div>
        {relatedRewardProgress.map((rp, i) => (
          <MembershipRow key={rp.rewardProgressId}>
            <div style={{ display: 'flex' }}>
              <div style={{ color: colors.blurple }}>
                Progress {relatedRewardProgress.length - i} ({rp.progress} / 1000)
                <div style={{ color: '#999' }}>
                  <span>{rp.completedAt ? `Completed ${moment(rp.completedAt).format('MMM D [at] h:mm A')}` : 'Not Completed'}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex' }}>
              <div style={{ color: '#999' }}>
                <span>{rp.playedAt ? `Played ${moment(rp.playedAt).format('MMM D [at] h:mm A')}` : 'Not Played'}</span>
              </div>
            </div>
          </MembershipRow>
        ))}
      </div>
    </ListContainer>
  )

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <div style={{ display: 'flex', marginBottom: 10 }}>
        <div>
          <button onClick={newRecord}>New</button>
          <button onClick={() => _exportAll(true)}>Export All CSV</button>
          <button onClick={() => _exportAll(false)}>Export All XLSX</button>
          <button onClick={_getImportTemplate}>Get Template</button>
          <input id='people-import-file' type='file' hidden />
          <button onClick={_importPeople}>Import</button>
          {integrations?.mailchimp?.disabled !== true && <button onClick={handleEmailSync}>Sync Email Campaign</button>}
        </div>
        {selectedRecord && (
          <div style={{ marginLeft: 100 }}>
            {!selectedRecord.isSelfRegistered && <button onClick={resetPassword}>Set Password</button>}
            <input id='people-upload-image' type='file' hidden />
            <button onClick={() => setIsImageEditorOpen(true)}>Edit Image</button>
            {selectedRecord.originalImage?.length > 2 && selectedRecord.firstName && selectedRecord.lastName && (
              <button onClick={deletePersonImage}>Delete Profile Picture</button>
            )}
            <button onClick={() => updatePersonStatus(selectedRecord)}>{selectedRecord.status !== 1 ? 'Activate' : 'Deactivate'}</button>
            <button
              onClick={() =>
                showPeopleSelector({
                  message:
                    'Setting the Reports To value may be overwritten by the automatic data ingestion process if it is enabled for this client account. This may also affect the organizational hierarchy, so please proceed with caution.',
                  selectionHandler: async selectedManager => {
                    await saveChanges({ data: { ...selectedRecord, reportsTo: selectedManager[0].id } })
                  },
                })
              }
            >
              Select Manager
            </button>
            {selectedRecord.reportsTo && <button onClick={deleteManager}>Delete Manager</button>}
            {selectedRecord.status === USER_STATUS.ACTIVE && (
              <button onClick={() => setIsSendWambiModalOpen(true)}>Send Wambi on behalf of</button>
            )}
          </div>
        )}
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
          modules={[InfiniteRowModelModule]}
          defaultColDef={{
            flex: 1,
            minWidth: 100,
            editable: true,
            resizable: true,
            filter: true,
            sortable: true,
          }}
          components={{
            enableEmailCampaignSyncCheckbox: function (params) {
              if (params.data?.enableEmailCampaignSync == 1) return '<input type="checkbox" checked>'
              return '<input type="checkbox">'
            },
            loadingRenderer: function (params) {
              if (params.value != null) {
                return params.value
              } else {
                return '<img src="https://raw.githubusercontent.com/ag-grid/ag-grid/master/grid-packages/ag-grid-docs/src/images/loading.gif" />'
              }
            },
          }}
          rowBuffer={0}
          rowSelection='multiple'
          rowModelType='infinite'
          paginationPageSize={10}
          cacheOverflowSize={2}
          maxConcurrentDatasourceRequests={2}
          infiniteInitialRowCount={1}
          maxBlocksInCache={20}
          enterMovesDown={true}
          enterMovesDownAfterEdit={true}
          onGridReady={onGridReady}
          // Prevents saving when there is no real value change (undefined vs null from DB)...JC
          onCellValueChanged={e => (e.newValue || e.oldValue) && saveChanges({ data: e.data })}
          getRowNodeId={data => data.id}
          onSelectionChanged={() => setSelectedRecord(gridApi.getSelectedRows()[0])}
        >
          <AgGridColumn field='id' maxWidth={100} valueGetter='node.id' cellRenderer='loadingRenderer' editable={false} />
          <AgGridColumn field='hrId' minWidth={160} />
          <AgGridColumn field='loginId' minWidth={160} />
          <AgGridColumn field='prefix' minWidth={100} />
          <AgGridColumn field='firstName' minWidth={160} />
          <AgGridColumn field='lastName' minWidth={160} />
          <AgGridColumn field='displayName' minWidth={160} />
          <AgGridColumn field='isOwner' editable={false} minWidth={120} />
          <AgGridColumn
            cellRendererFramework={renderPronounsDropdown}
            cellStyle={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}
            editable={false}
            field='pronouns'
            flex={1}
            minWidth={240}
          />
          <AgGridColumn field='jobTitle' minWidth={160} />
          <AgGridColumn field='jobTitleDisplay' minWidth={160} />
          <AgGridColumn field='email' minWidth={160} />
          <AgGridColumn field='mobile' minWidth={160} />
          <AgGridColumn
            cellRenderer='enableEmailCampaignSyncCheckbox'
            cellStyle={{ textAlign: 'center' }}
            field='enableEmailCampaignSync'
            hide={integrations?.mailchimp?.disabled === true}
            minWidth={160}
            onCellClicked={handleCheckbox('enableEmailCampaignSync')}
          />
          <AgGridColumn field='hireDate' minWidth={160} editable={false} />
          <AgGridColumn field='birthday' minWidth={160} editable={false} />
          <AgGridColumn field='birthdayPublic' minWidth={160} editable={false} />
          <AgGridColumn field='manager' minWidth={200} editable={false} />
          <AgGridColumn field='ssoId' minWidth={160} />
          <AgGridColumn field='accessLevel' minWidth={160} />
          <AgGridColumn field='hideFromPortal' minWidth={160} />
          <AgGridColumn field='isIncognito' minWidth={160} />
          <AgGridColumn
            cellRendererFramework={renderNotifyMethodsDropdown}
            cellStyle={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}
            editable={false}
            field='notifyMethod'
            flex={1}
            minWidth={240}
          />
          <AgGridColumn field='isSelfRegistered' editable={false} minWidth={180} />
          <AgGridColumn field='status' editable={false} width={150} />
        </AgGridReact>
      </div>
      {selectedRecord && (
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 50 }}>
          <TabBar options={TABS} selected={activeTab} setSelected={setActiveTab} />

          {activeTab === TAB_KEYS.GROUPS && renderGroupMembership()}
          {activeTab === TAB_KEYS.TRAITS && renderTraitMembership()}
          {activeTab === TAB_KEYS.CLAIMS && renderRewardClaims()}
          {activeTab === TAB_KEYS.CHALLENGES && renderChallenges()}
          {activeTab === TAB_KEYS.PROGRESS && renderRewardProgress()}
        </div>
      )}
      <Modal
        animationType='slideUp'
        handleClose={() => setIsPeopleModalOpen(false)}
        onClickOut={() => setIsPeopleModalOpen(false)}
        open={isPeopleModalOpen}
      >
        <div style={{ margin: 10 }}>
          <div>
            <button onClick={() => addExistingPeople(modalGridApi.getSelectedRows())}>Continue</button>
          </div>
          <div
            id='myGrid'
            style={{
              height: '700px',
              width: '700px',
              marginTop: '30px',
            }}
            className='ag-theme-alpine'
          >
            <AgGridReact
              modules={[InfiniteRowModelModule]}
              defaultColDef={{
                flex: 1,
                minWidth: 100,
                editable: false,
                resizable: true,
                filter: true,
                sortable: true,
              }}
              rowBuffer={0}
              rowSelection='multiple'
              rowModelType='infinite'
              paginationPageSize={100}
              cacheOverflowSize={2}
              maxConcurrentDatasourceRequests={2}
              infiniteInitialRowCount={1}
              maxBlocksInCache={20}
              onGridReady={onModalGridReady}
              getRowNodeId={data => data.id}
              enableCellTextSelection={true}
            >
              <AgGridColumn field='id' maxWidth={100} />
              <AgGridColumn field='hrId' minWidth={160} checkboxSelection />
              <AgGridColumn field='loginId' minWidth={160} />
              <AgGridColumn field='firstName' minWidth={160} />
              <AgGridColumn field='lastName' minWidth={160} />
              <AgGridColumn field='displayName' minWidth={160} />
              <AgGridColumn field='jobTitle' minWidth={160} />
              <AgGridColumn field='jobTitleDisplay' minWidth={160} />
              <AgGridColumn field='email' minWidth={160} />
              <AgGridColumn field='mobile' minWidth={160} />
            </AgGridReact>
          </div>
        </div>
      </Modal>
      <Modal animationType='slideUp' open={isImageEditorOpen}>
        <ImageEditorWorkflow
          handleBack={() => setIsImageEditorOpen(false)}
          height={250}
          isAdmin
          onProfileUpdated={onProfileUpdated}
          profileToEdit={selectedRecord}
          width={250}
        />
      </Modal>
      <Modal handleClose={() => setIsSendWambiModalOpen(false)} onClickOut={() => {}} open={isSendWambiModalOpen}>
        {selectedRecord && (
          <ConfigWambiCompose
            isSendWambiModalOpen={isSendWambiModalOpen}
            sentAsPeopleId={selectedRecord.id}
            setIsSendWambiModalOpen={setIsSendWambiModalOpen}
          />
        )}
      </Modal>
    </div>
  )
}

PeopleGridEditor.propTypes = {
  setIsBusy: PropTypes.func,
  showPeopleSelector: PropTypes.func,
}

export default PeopleGridEditor
