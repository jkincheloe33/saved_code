import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Tree from 'react-tree-graph'
import 'react-tree-graph/dist/style.css'

import { ClientAccountEditor, ImageEditorWorkflow, Modal, Select } from '@components'
import { useAuthContext, useLangContext } from '@contexts'
import { api } from '@services'
import { GROUP_ACCESS_LEVELS_ARRAY_NAMES, LANGUAGE_TYPE } from '@utils'

const GroupsTreeEditor = ({ setIsBusy, showPeopleSelector }) => {
  const [breadCrums, setBreadCrums] = useState()
  const [chartGroups, setChartGroups] = useState(null)
  const [childGroups, setChildGroups] = useState([])
  const [contextMenu, setContextMenu] = useState()
  const [deletingGroup, setDeletingGroup] = useState(null)
  const [editGroup, setEditGroup] = useState()
  const [groupChartVisible, setGroupChartVisible] = useState(false)
  const [groupMembers, setGroupMembers] = useState()
  const [groupTypes, setGroupTypes] = useState()
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false)
  const [movingGroup, setMovingGroup] = useState()
  const [originalEditGroup, setOriginalEditGroup] = useState()

  const { clientAccount, setClientAccount } = useAuthContext()
  const { getAccountLanguage } = useLangContext()

  useEffect(() => {
    const loadRootGroups = async () => {
      // Get the group types and root groups for this account...EK
      const {
        data: { groupTypesForAccount },
      } = await api.get('/config/groupTypes/list')
      setGroupTypes(groupTypesForAccount)
    }

    setBreadCrums([clientAccount])

    loadRootGroups()
  }, [clientAccount])

  // When the breadcrumbs are updated, refresh to the latest selection...EK
  useEffect(() => {
    const getChildForParent = async () => {
      if (breadCrums == null) return

      if (breadCrums.length > 1) {
        const lastCrumb = breadCrums[breadCrums.length - 1]
        await refreshGroupData(lastCrumb.id)
      } else if (breadCrums.length === 1) {
        // Root (it's the account)
        const {
          data: { childGroups },
        } = await api.post('/config/groups/getByParent')
        setChildGroups(childGroups)
      }
    }

    getChildForParent()
  }, [breadCrums])

  const handleGroupEdit = (property, value) => {
    setEditGroup(prev => ({ ...prev, [property]: value }))
  }

  const saveGroupEdits = async () => {
    // Compare edit vs original to see if there are changes to be made...EK
    if (JSON.stringify(editGroup) !== JSON.stringify(originalEditGroup)) {
      await api.post('/config/groups/save', { updated: editGroup })
      setOriginalEditGroup(editGroup)

      // merge back into the breadcrumb...EK
      breadCrums.pop()
      setBreadCrums([...breadCrums, editGroup])
    }
  }

  const addGroupByType = async groupTypeId => {
    if (editGroup == null) {
      // This is the root groups (selected client account)...EK
      let newGroupName = prompt(`Enter a new ${groupTypes.find(gt => gt.id === groupTypeId).name} name:`)
      if (newGroupName) {
        // Insert new group as sibling to the selected account...EK
        let newGroup = {
          name: newGroupName,
          depth: 0,
          groupTypeId,
          parentGroupId: null,
        }

        // Save this group group type and merge the ID back into the object...EK
        const {
          data: { newId, success },
        } = await api.post('/config/groups/updateHierarchy', { inserted: newGroup })

        if (success) {
          newGroup.id = newId
          setChildGroups([...childGroups, newGroup])
        }
      }
      // ELSE: nothing specified.  Treat as cancel...EK
    } else {
      const newGroupName = prompt(`Enter a new ${groupTypes.find(gt => gt.id === groupTypeId).name} name:`)
      if (newGroupName) {
        // Insert new group as sibling to the selected group record (editGroup)...EK
        const newGroup = {
          name: newGroupName,
          depth: editGroup.depth + 1,
          groupTypeId,
          parentGroupId: editGroup.id,
        }

        // Save this group group type and merge the ID back into the object...EK
        const {
          data: { newId, success },
        } = await api.post('/config/groups/updateHierarchy', { inserted: newGroup })

        if (success) {
          newGroup.id = newId
          setChildGroups([...childGroups, newGroup])
        }
      }
    }
  }

  const importGroupByType = async groupType => {
    let fileInput = document.getElementById('group-import-file')

    fileInput.onchange = async () => {
      // Push the file to the server...EK
      let formData = new FormData()
      if (editGroup != null) {
        formData.append('parentGroupId', editGroup.id)
      }
      formData.append('depth', editGroup ? editGroup.depth + 1 : 0)
      formData.append('groupTypeId', groupType.id)
      formData.append('importFile', fileInput.files[0])

      let { data: importRes } = await api.post('/config/groups/import', formData)

      fileInput.value = null

      if (importRes.success) {
        alert(`Import Successful! ${importRes.rowsAdded} groups imported.`)

        let {
          data: { childGroups, success },
        } = await api.post('/config/groups/getByParent', {
          parentGroupId: editGroup ? editGroup.id : null,
        })

        if (success) setChildGroups(childGroups)
      } else {
        alert(`Import Failure: ${importRes.msg}`)
      }
    }

    fileInput.click()
  }

  const addPeopleToGroup = async memberLevel => {
    showPeopleSelector({
      selectionHandler: async selectedPeople => {
        const {
          data: { msg, success },
        } = await api.post('/config/people/assignGroups', {
          peopleIds: selectedPeople.map(p => p.id),
          groupId: editGroup.id,
          level: memberLevel,
        })

        if (success) {
          // Refresh the group list...EK
          const { data: refreshedMembers } = await api.post('/config/groups/groupMemberList', { groupId: editGroup.id })
          setGroupMembers(refreshedMembers)
        } else {
          alert(msg)
        }
      },
    })
  }

  const childNavigation = childGroupSelected => {
    setBreadCrums([...breadCrums, childGroupSelected])
    setEditGroup(childGroupSelected)

    setOriginalEditGroup(childGroupSelected)
  }

  const crumbNavigation = selectedCrumb => {
    let backToIndex = breadCrums.indexOf(selectedCrumb)

    if (backToIndex === 0) {
      // Account
      setEditGroup()
      setOriginalEditGroup()
      setBreadCrums([clientAccount])
    } else if (backToIndex > 0) {
      setEditGroup(selectedCrumb)
      setOriginalEditGroup(selectedCrumb)
      setBreadCrums([...breadCrums.slice(0, backToIndex + 1)])
    }
  }

  const getTypeIcon = group => {
    const groupType = groupTypes.find(gt => gt.id === group.groupTypeId)
    if (groupType?.icon) {
      return <img src={groupType.icon} width={14} height={14} style={{ margin: 4 }} />
    }
  }

  const moveGroup = async ({ moveTargetGroup, movingGroup }) => {
    setIsBusy(true)
    const {
      data: { msg, success },
    } = await api.post('/config/groups/moveGroup', { moveTargetGroup, movingGroup })

    setIsBusy(false)

    if (success) {
      setMovingGroup(null)
      await refreshGroupData(moveTargetGroup.id)
    } else alert(msg)
  }

  const handleClientTermsUpload = () => {
    const fileInput = document.getElementById('upload-client-terms')

    fileInput.onchange = async () => {
      setIsBusy(true)
      const formData = new FormData()

      formData.append('mediaUpload', fileInput.files[0])

      const {
        data: { mediaUrl, msg, success },
      } = await api.post('/config/clientAccounts/uploadClientTerms', formData)

      if (success) {
        setClientAccount(ca => ({ ...ca, clientTermsUrl: mediaUrl }))
      } else {
        alert(msg)
      }
      setIsBusy(false)

      fileInput.value = null
    }

    fileInput.click()
  }

  const handleSelfRegisterTermsUpload = () => {
    const fileInput = document.getElementById('upload-self-register-terms')

    fileInput.onchange = async () => {
      setIsBusy(true)
      const formData = new FormData()

      formData.append('mediaUpload', fileInput.files[0])

      const {
        data: { mediaUrl, msg, success },
      } = await api.post('/config/clientAccounts/uploadSelfRegisterTerms', formData)

      if (success) {
        setClientAccount(ca => ({ ...ca, selfRegisterTermsUrl: mediaUrl }))
      } else {
        alert(msg)
      }
      setIsBusy(false)

      fileInput.value = null
    }

    fileInput.click()
  }

  const clearClientTerms = async () => {
    setIsBusy(true)

    const {
      data: { msg, success },
    } = await api.post('/config/clientAccounts/clearClientTerms')

    if (success) {
      setClientAccount(ca => ({ ...ca, clientTermsUrl: null }))
    } else {
      alert(msg)
    }
    setIsBusy(false)
  }

  const clearSelfRegisterTerms = async () => {
    setIsBusy(true)

    const {
      data: { msg, success },
    } = await api.post('/config/clientAccounts/clearSelfRegisterTerms')

    if (success) {
      setClientAccount(ca => ({ ...ca, selfRegisterTermsUrl: null }))
    } else {
      alert(msg)
    }
    setIsBusy(false)
  }

  const moveContentsAndDeleteGroup = async ({ delTargetGroup }) => {
    if (
      confirm(`Do you want to move ${deletingGroup.name} contents and children to ${delTargetGroup.name} and delete ${deletingGroup.name}?`)
    ) {
      setIsBusy(true)

      const {
        data: { msg, success },
      } = await api.post('/config/groups/deleteGroup', {
        deletingGroup,
        delTargetGroup,
      })

      setIsBusy(false)

      if (success) {
        setDeletingGroup(null)
        await refreshGroupData(delTargetGroup.id)
      } else alert(msg)
    }
  }

  const refreshGroupData = async groupId => {
    const [
      {
        data: { childGroups },
      },
      { data: refreshedMembers },
    ] = await Promise.all([
      api.post('/config/groups/getByParent', { parentGroupId: groupId }),
      api.post('/config/groups/groupMemberList', { groupId }),
    ])
    setGroupMembers(refreshedMembers)
    setChildGroups(childGroups)
  }

  const clearGroupImage = async () => {
    const {
      data: { success },
    } = await api.post('/config/groups/deleteMedia', { groupId: editGroup.id })

    if (success) setEditGroup(g => ({ ...g, originalImage: g.name[0] }))
  }

  const renderMoveGroupBtns = () => (
    <>
      {movingGroup ? (
        <button onClick={() => setMovingGroup(null)}>Cancel Move</button>
      ) : (
        <button onClick={() => setMovingGroup(editGroup)}>Move Group</button>
      )}
      <div style={{ marginLeft: 5 }}>
        {movingGroup && movingGroup.id !== editGroup.id && movingGroup.parentGroupId !== editGroup.id && (
          <button onClick={() => moveGroup({ moveTargetGroup: editGroup, movingGroup })}>Drop Group Here</button>
        )}
      </div>
    </>
  )

  const renderDelGroupBtns = () => (
    <>
      {deletingGroup && deletingGroup.id !== editGroup.id && (
        <button
          onClick={() =>
            moveContentsAndDeleteGroup({
              delTargetGroup: editGroup,
            })
          }
        >
          Drop Group Contents Here
        </button>
      )}
      <div style={{ marginLeft: 5 }}>
        {deletingGroup ? (
          <button onClick={() => setDeletingGroup(null)}>Cancel Delete</button>
        ) : (
          <button onClick={() => setDeletingGroup(editGroup)}>Delete Group</button>
        )}
      </div>
    </>
  )

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex' }}>
        <div style={{ display: 'flex' }}>
          {breadCrums?.map((crumb, idx) => {
            return (
              <div
                key={idx === 0 ? `Account_${crumb.id}` : `Group_${crumb.id}`}
                style={{ display: 'flex', flexDirection: 'row', cursor: 'pointer' }}
                onClick={() => crumbNavigation(crumb)}
              >
                <div style={{ marginRight: 5, marginLeft: 5, color: 'blue' }}>{crumb.name}</div>
                <div style={{ marginRight: 5, marginLeft: 5 }}>{'>'}</div>
              </div>
            )
          })}
        </div>
      </div>
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'row' }}>
        {editGroup && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div>{editGroup.id}</div>
            <div style={{ display: 'flex', flexDirection: 'row', paddingBottom: '5px' }}>
              {!deletingGroup && renderMoveGroupBtns()}
              {!movingGroup && renderDelGroupBtns()}
            </div>
            <input
              name='name'
              onBlur={saveGroupEdits}
              onChange={e => handleGroupEdit(e.target.name, e.target.value)}
              placeholder='Name'
              type='text'
              value={editGroup.name || ''}
            />
            <textarea
              name='description'
              onBlur={saveGroupEdits}
              onChange={e => handleGroupEdit(e.target.name, e.target.value)}
              placeholder='Description'
              style={{ width: '400px' }}
              value={editGroup.description || ''}
            />
            <div>
              <label>Client ID:</label>
              <input
                name='clientId'
                type='text'
                value={editGroup.clientId || ''}
                onChange={e => handleGroupEdit(e.target.name, e.target.value)}
                onBlur={saveGroupEdits}
              />
            </div>
            <div>
              <label>Hide From Portal</label>
              <input
                checked={editGroup.hideFromPortal}
                name='hideFromPortal'
                onBlur={saveGroupEdits}
                onChange={e => handleGroupEdit(e.target.name, editGroup.hideFromPortal === 1 ? 0 : 1)}
                type='checkbox'
              />
            </div>
            <br />

            <span>Group Type</span>
            <Select
              name='groupTypeId'
              onBlur={saveGroupEdits}
              onChange={e => handleGroupEdit(e.target.name, Number(e.target.value))}
              options={groupTypes.map(g => ({ name: g.name, value: g.id }))}
              value={editGroup.groupTypeId || originalEditGroup.groupTypeId}
            />
            <br />
            <br />

            <span>Group Image</span>

            <button onClick={() => setIsImageEditorOpen(true)}>Upload</button>
            {editGroup.originalImage?.length > 1 && (
              <>
                <a href={editGroup.originalImage} rel='noreferrer' target='_blank'>
                  <button style={{ width: '100%' }}>View Image</button>
                </a>
                <button onClick={clearGroupImage}>Clear</button>
              </>
            )}

            <br />
            <br />

            <button
              onClick={() => {
                const postContent = prompt('Announcement Content:')
                if (postContent) {
                  showPeopleSelector({
                    selectionHandler: async selectedPeople => {
                      const { data: postResult } = await api.post('/config/newsfeed/postAnnouncement', {
                        content: postContent,
                        groupIds: [editGroup.id],
                        people: selectedPeople.length > 0 ? selectedPeople.map(p => p.id) : null,
                      })

                      if (postResult.success === true) {
                        // Refresh the group list...EK
                        alert('Announcement posted successfully!')
                      } else {
                        alert(`Issue posting: ${postResult.msg}`)
                      }
                    },
                  })
                }
              }}
            >{`Post Announcement To ${editGroup.name}`}</button>

            <br />
            <br />

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              <div>{`Direct Membership (${groupMembers && groupMembers.length} members)`}</div>
              <button
                onClick={async e => {
                  setContextMenu({
                    x: e.pageX + 5,
                    y: e.pageY + 5,
                    renderMenu: () => {
                      return GROUP_ACCESS_LEVELS_ARRAY_NAMES.filter(n => n != null).map((ga, gi) => (
                        <div key={gi + 1} style={{ cursor: 'pointer', color: 'blue' }} onClick={() => addPeopleToGroup(gi + 1)}>
                          {ga}
                        </div>
                      ))
                    },
                  })
                }}
              >
                Add
              </button>
            </div>
            <div style={{ width: '100%', height: 300, background: '#f1f1f1', overflow: 'scroll' }}>
              {groupMembers?.map(gm => (
                <div key={gm.id} style={{ margin: 3, background: '#d1d1d1', maxWidth: '400px' }}>
                  <div>{`${gm.firstName} ${gm.lastName}`}</div>
                  <div style={{ color: '#888' }}>{GROUP_ACCESS_LEVELS_ARRAY_NAMES[gm.level]}</div>
                  <div
                    style={{ color: 'blue', cursor: 'pointer' }}
                    onClick={async () => {
                      const { data: deleteRes } = await api.post('/config/people/removeGroups', { peopleGroupId: gm.peopleGroupId })
                      if (deleteRes.success) {
                        setGroupMembers(groupMembers.filter(member => member.peopleGroupId != gm.peopleGroupId))
                      } else {
                        alert(deleteRes.msg)
                      }
                    }}
                  >
                    Remove
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!editGroup && clientAccount && (
          <div style={{ width: '400px', display: 'flex', flexDirection: 'column' }}>
            <div>Account</div>
            <div>{clientAccount.id}</div>
            <br />
            {clientAccount.settings?.disableTermsOfService !== true && (
              <>
                <span>
                  <b>Client Terms of Service</b>
                </span>
                {clientAccount?.clientTermsUrl && (
                  <span>
                    <a
                      href={clientAccount.clientTermsUrl}
                      rel='noreferrer'
                      style={{ color: 'blue', textDecoration: 'underline' }}
                      target='_blank'
                    >
                      Click here
                    </a>{' '}
                    to view current terms document
                  </span>
                )}
                <br />
                <input accept='application/pdf' id='upload-client-terms' type='file' hidden />
                <button onClick={handleClientTermsUpload}>Upload Document</button>
                {clientAccount.clientTermsUrl && <button onClick={clearClientTerms}>Clear Document</button>}
              </>
            )}
            <br />
            <span>
              <b>{getAccountLanguage(LANGUAGE_TYPE.SELF_REGISTERED_USER)} Terms of Service</b>
            </span>
            {clientAccount?.selfRegisterTermsUrl && (
              <span>
                <a
                  href={clientAccount.selfRegisterTermsUrl}
                  rel='noreferrer'
                  style={{ color: 'blue', textDecoration: 'underline' }}
                  target='_blank'
                >
                  Click here
                </a>{' '}
                to view current terms document
              </span>
            )}
            <br />
            <input accept='application/pdf' id='upload-self-register-terms' type='file' hidden />
            <button onClick={handleSelfRegisterTermsUpload}>Upload Document</button>
            {clientAccount.selfRegisterTermsUrl && <button onClick={clearSelfRegisterTerms}>Clear Document</button>}
            <ClientAccountEditor />
          </div>
        )}

        <div style={{ display: 'flex', marginLeft: 30, flexDirection: 'column' }}>
          <div style={{ display: 'flex' }}>
            <div>Subgroups</div>
            <button
              onClick={e => {
                setContextMenu({
                  x: e.pageX + 5,
                  y: e.pageY + 5,
                  renderMenu: () => {
                    return groupTypes.map(gt => (
                      <div key={gt.id} style={{ cursor: 'pointer', color: 'blue' }} onClick={() => addGroupByType(gt.id)}>
                        {gt.name}
                      </div>
                    ))
                  },
                })
              }}
              style={{ marginLeft: 5 }}
            >
              Add Subgroup
            </button>

            <button
              onClick={async () => {
                let { data } = await api.get('/config/groups/getImportTemplate', { responseType: 'blob' })
                const url = window.URL.createObjectURL(new Blob([data]))
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', 'import-groups.xlsx')

                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }}
              style={{ marginLeft: 5 }}
            >
              Get Template
            </button>

            <input id='group-import-file' type='file' hidden />
            <button
              onClick={e => {
                setContextMenu({
                  x: e.pageX + 5,
                  y: e.pageY + 5,
                  renderMenu: () => {
                    return groupTypes.map(gt => (
                      <div key={gt.id} style={{ cursor: 'pointer', color: 'blue' }} onClick={() => importGroupByType(gt)}>
                        {gt.name}
                      </div>
                    ))
                  },
                })
              }}
              style={{ marginLeft: 5 }}
            >
              Import
            </button>

            <button
              onClick={async () => {
                const {
                  data: { groupsForAccount },
                } = await api.post('/config/groups/list', {})

                // convert the list to a hierarchy...EK
                const tree = []
                groupsForAccount.forEach(g => {
                  g.children = []
                  g.name = `${g.name} (${g.id})`
                  if (g.parentGroupId == null) {
                    tree.push(g)
                  } else {
                    // Find my parent and put me in it's children...EK
                    const parentGroup = groupsForAccount.find(gfa => gfa.id === g.parentGroupId)
                    if (parentGroup != null) {
                      parentGroup.children.push(g)
                    }
                  }
                })

                setChartGroups({ id: 0, name: clientAccount.name, children: tree })
                setGroupChartVisible(true)
              }}
              style={{ marginLeft: 5 }}
            >
              Show Chart
            </button>
          </div>

          <div style={{ background: '#f1f1f1', height: '100%', width: '500px' }}>
            {groupTypes &&
              childGroups.map(cg => {
                if (cg == null) {
                  return <div />
                }
                return (
                  <div key={cg.id} style={{ cursor: 'pointer' }} onClick={() => childNavigation(cg)}>
                    <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                      {getTypeIcon(cg)}
                      {cg.name}
                      <div style={{ marginLeft: 10, color: '#666', fontSize: 11, alignSelf: 'center' }}>
                        {`(${groupTypes.find(gt => gt.id === cg.groupTypeId).name})`}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {contextMenu && (
        <div style={{ left: '0px', top: '0px', right: '0px', bottom: '0px', position: 'absolute' }} onClick={() => setContextMenu(null)}>
          <div
            style={{
              position: 'absolute',
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              background: '#d1d1d1d1',
              padding: '10px',
              borderRadius: '5px',
            }}
          >
            {contextMenu.renderMenu()}
          </div>
        </div>
      )}

      {groupChartVisible && (
        <div style={{ left: '0px', top: '0px', right: '0px', bottom: '0px', position: 'absolute', backgroundColor: '#222' }}>
          <Tree
            data={chartGroups}
            width={window.innerWidth}
            height={900}
            keyProp={'id'}
            pathProps={{ style: { stroke: '#7733EA' } }}
            textProps={{ style: { fill: '#fff' } }}
            animated={true}
            margins={{ right: 300, left: 50, top: 50, bottom: 50 }}
          />
          <p
            style={{ color: '#fff', fontSize: 22, position: 'absolute', right: 15, top: 15, cursor: 'pointer' }}
            onClick={() => setGroupChartVisible(false)}
          >
            X
          </p>
        </div>
      )}

      <Modal animationType='slideUp' open={isImageEditorOpen}>
        {editGroup && (
          <ImageEditorWorkflow
            handleBack={() => setIsImageEditorOpen(false)}
            height={250}
            isAdmin
            isGroup
            onProfileUpdated={({ originalImage }) => setEditGroup(g => ({ ...g, originalImage }))}
            profileToEdit={editGroup}
            width={250}
          />
        )}
      </Modal>
    </div>
  )
}

GroupsTreeEditor.propTypes = {
  setIsBusy: PropTypes.func,
  showPeopleSelector: PropTypes.func,
}

export default GroupsTreeEditor
