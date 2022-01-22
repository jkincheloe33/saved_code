import { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { AgGridReact, AgGridColumn } from '@ag-grid-community/react'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'

import { LinkTraitsModal } from '@components'
import { api } from '@services'

let lastNewId = 0

const TraitsGridEditor = ({ showPeopleSelector }) => {
  const [assignedTraitId, setAssignedTraitId] = useState()
  const [isTraitsModalOpen, setIsTraitsModalOpen] = useState(false)
  const [memberGridApi, setMemberGridApi] = useState()
  const [selectedTrait, setSelectedTrait] = useState()
  const [selectedTraitMembers, setSelectedTraitMembers] = useState([])
  const [selectedTraitType, setSelectedTraitType] = useState()
  const [traitMembers, setTraitMembers] = useState([])
  const [traitTypes, setTraitTypes] = useState()
  const [traitTypesGridApi, setTraitTypesGridApi] = useState()
  const [traits, setTraits] = useState()
  const [traitsGridApi, setTraitsGridApi] = useState()

  const onTraitTypesGridReady = async params => {
    setTraitTypesGridApi(params.api)

    let {
      data: { traitTypes },
    } = await api.get('/config/traitTypes/list')

    setTraitTypes(traitTypes)

    setTimeout(() => {
      params.api.forEachNode(node => {
        if (node.rowIndex === 0) {
          node.setSelected(true)
        }
      })
    }, 0)
  }

  //Update table data and traits array...CY
  const _updateTrait = (id, data = {}) => {
    //Work around for ag-grid id search bug...CY
    let node
    traitsGridApi.forEachNode(row => {
      if (row.data.id === id) {
        return (node = row)
      }
    })
    //const node = traitsGridApi.getRowNode(id)
    if (node != null) {
      const updateIndex = traits.findIndex(trait => trait.id === id)
      traits[updateIndex] = { ...node.data, ...data }
      setTraits(traits)
      node.setData({ ...node.data, ...data })
    }
  }

  const _refreshMemberList = useCallback(async () => {
    const { data: refreshedMembers } = await api.post('/config/traits/traitMemberList', { traitId: selectedTrait.id })
    setSelectedTraitMembers([])
    setTraitMembers(refreshedMembers)
  }, [selectedTrait])

  useEffect(() => {
    if (selectedTrait != null) {
      // Get the member list for the selected trait...EK
      _refreshMemberList()
    }
  }, [selectedTrait, _refreshMemberList])

  const onTraitsGridReady = async params => {
    setTraitsGridApi(params.api)
  }

  const onMemberGridReady = async params => {
    setMemberGridApi(params.api)
  }

  const newTraitType = () => {
    // NOTE: I didn't apply the account Id.  This is controlled at the service level and applied to the user based on the url...EK
    setTraitTypes([...traitTypes, { id: --lastNewId, name: '' }])
  }

  const newTrait = () => {
    // NOTE: I didn't apply the account Id.  This is controlled at the service level and applied to the user based on the url...EK
    setTraits([...traits, { id: --lastNewId, name: '', traitTypeId: selectedTraitType.id, members: 0 }])
  }

  const saveTraits = async ({ data }) => {
    if (data.id < 0) {
      // This is a new record, we need to insert, and then merge the returned ID...EK
      let { data: insertRes } = await api.post('/config/traits/save', { inserted: data })

      // Merge ID back into record based on negative id...EK
      let newRow = traitsGridApi.getRowNode(data.id)

      if (newRow != null) {
        newRow.setDataValue('id', insertRes.newId)
      }
    } else {
      await api.post('/config/traits/save', { updated: data })
    }
  }

  const saveTraitTypes = async ({ data }) => {
    if (data.id < 0) {
      // This is a new record, we need to insert, and then merge the returned ID...EK
      let { data: insertRes } = await api.post('/config/traitTypes/save', { inserted: data })

      // Merge ID back into record based on negative id...EK
      let newRow = traitTypesGridApi.getRowNode(data.id)
      if (newRow != null) {
        newRow.setDataValue('id', insertRes.newId)
      }
    } else {
      await api.post('/config/traitTypes/save', { updated: data })
    }
  }

  const traitTypeSelected = async () => {
    const selRec = traitTypesGridApi.getSelectedRows()[0]

    setSelectedTraitType(selRec)
    setTraits(null)
    setTraitMembers([])

    const {
      data: { success, traitsForType },
    } = await api.post('/config/traits/list', { traitTypeId: selRec.id })

    if (success) setTraits(traitsForType)
  }

  const deleteTrait = async () => {
    if (selectedTrait == null) {
      return alert('No record selected to delete.')
    }

    if (selectedTrait.members > 0) {
      return alert('Please clear or assign all members')
    }

    if (confirm(`About to delete '${selectedTrait.name}'.  Are you sure you want to do this?`)) {
      let { data: deletedRes } = await api.post('/config/traits/save', { deleted: selectedTrait })
      if (deletedRes.success) {
        setTraits(traits.filter(r => r.id !== selectedTrait.id))
      } else {
        alert(deletedRes.msg)
      }
    }
  }

  const deleteTraitType = async () => {
    if (selectedTraitType == null) {
      return alert('No record selected to delete.')
    }

    if (confirm(`About to Delete '${selectedTraitType.name}'.  Are you sure you want to do this?`)) {
      let { data: deletedRes } = await api.post('/config/traitTypes/save', { deleted: selectedTraitType })
      if (deletedRes.success) {
        setTraitTypes(traitTypes.filter(r => r.id !== selectedTraitType.id))
      } else {
        alert(deletedRes.msg)
      }
    }
  }

  const addMember = async () => {
    showPeopleSelector({
      selectionHandler: async selectedPeople => {
        let { data: newMemberRes } = await api.post('/config/people/assignTraits', {
          peopleIds: selectedPeople.map(p => p.id),
          traitId: selectedTrait.id,
        })

        if (newMemberRes.success === true) {
          // Refresh the group list...EK
          _refreshMemberList()
        } else {
          console.warn(newMemberRes.msg)
        }
      },
    })
  }

  const clearMembers = async () => {
    if (selectedTrait.members === 0) {
      alert('No members to clear')
      return
    }

    if (confirm(`Do you want to clear all members in ${selectedTrait.name}?`)) {
      const { data: clearMembersRes } = await api.post('/config/traits/editTraitMembers', {
        deleted: {
          traitMembers,
          traitId: selectedTrait.id,
        },
      })

      //Set trait memeber to zero and reset members list
      if (clearMembersRes.success === true) {
        _updateTrait(selectedTrait.id, { members: 0 })
        setSelectedTrait({ ...selectedTrait, members: 0 })
        _refreshMemberList()
      } else {
        console.warn(clearMembersRes.msg)
      }
    }
  }

  const removeMember = async () => {
    if (selectedTraitMembers.length === 0) {
      alert('No member selected')
      return
    }
    const { peopleTraitId, firstName, lastName } = selectedTraitMembers[0]

    if (confirm(`Do you want to remove ${firstName} ${lastName} from ${selectedTrait.name}?`)) {
      const { data: clearMembersRes } = await api.post('/config/traits/removeTraitMember', {
        id: peopleTraitId,
      })

      //Set trait memeber to zero and reset members list
      if (clearMembersRes.success === true) {
        _updateTrait(selectedTrait.id, { members: selectedTrait.members - 1 })
        setSelectedTrait({ ...selectedTrait, members: selectedTrait.members - 1 })
        _refreshMemberList()
      } else {
        console.warn(clearMembersRes.msg)
      }
    }
  }

  const assignMembers = async () => {
    if (assignedTraitId == null) {
      return alert('Please select a trait to assign')
    }

    if (selectedTraitMembers.length === 0) {
      return alert('Please select members to assign')
    }

    const assignedTrait = traits.find(trait => trait.id == assignedTraitId)

    if (confirm(`Do you want to assign ${selectedTrait.name} members to ${assignedTrait.name}?`)) {
      const { data: assignMembersRes } = await api.post('/config/traits/editTraitMembers', {
        inserted: {
          assignedTraitId,
          members: selectedTraitMembers,
        },
      })

      //Assign respect data in trait and reset data...CY
      if (assignMembersRes.success === true) {
        assignedTrait.members += assignMembersRes.assignedMembers
        _updateTrait(assignedTrait.id, assignedTrait)

        setAssignedTraitId(null)

        //Rewrite selectedTrait data with new data...CY
        _refreshMemberList()
      } else {
        console.warn(assignMembersRes.msg)
      }
    }
  }

  const handleCheckbox = key => params => {
    const newValue = params.node.data[key] === 1 ? 0 : 1
    params.node.setDataValue(key, newValue)
  }

  const linkTrait = trait => {
    saveTraits({ data: { ...selectedTrait, crossRefId: trait.id } })

    traitsGridApi.getRowNode(selectedTrait.id).setDataValue('crossRefId', trait.id)

    setSelectedTrait(st => ({ ...st, crossRefId: trait.id }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%' }}>
        <div style={{ width: 620, margin: 5 }}>
          <div>
            <button onClick={newTraitType}>New Type</button>
            <button onClick={deleteTraitType}>Delete Type</button>
          </div>

          <div
            className='ag-theme-alpine'
            id='traitTypesGrid'
            style={{
              height: '100%',
              width: '100%',
            }}
          >
            <AgGridReact
              modules={[ClientSideRowModelModule]}
              components={{
                reviewFilterCheckbox: ({ data }) =>
                  data.isReviewFilter === 1 ? '<input type="checkbox" checked>' : '<input type="checkbox">',
              }}
              defaultColDef={{
                editable: true,
                flex: 1,
                resizable: true,
              }}
              enterMovesDown={true}
              enterMovesDownAfterEdit={true}
              onGridReady={onTraitTypesGridReady}
              onCellValueChanged={saveTraitTypes}
              rowData={traitTypes}
              getRowNodeId={data => data.id}
              rowSelection={'single'}
              onSelectionChanged={traitTypeSelected}
            >
              <AgGridColumn field='id' editable={false} />
              <AgGridColumn field='name' headerName='Trait Type' minWidth={160} />
              <AgGridColumn
                field='isReviewFilter'
                cellRenderer='reviewFilterCheckbox'
                editable={false}
                onCellClicked={handleCheckbox('isReviewFilter')}
              />
            </AgGridReact>
          </div>
        </div>

        <div
          style={{
            height: '100%',
            width: '100%',
            margin: 5,
          }}
        >
          <div>
            <button onClick={newTrait}>New Trait</button>
            <button onClick={deleteTrait}>Delete Trait</button>
            {selectedTrait && <button onClick={() => setIsTraitsModalOpen(true)}>Cross Reference Trait</button>}
          </div>

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
                flex: 1,
                resizable: true,
              }}
              enterMovesDown={true}
              enterMovesDownAfterEdit={true}
              onGridReady={onTraitsGridReady}
              onCellValueChanged={saveTraits}
              rowData={traits}
              getRowNodeId={data => data.id}
              rowSelection='single'
              onSelectionChanged={() => {
                setSelectedTrait(traitsGridApi.getSelectedRows()[0])
                setAssignedTraitId(null)
              }}
            >
              <AgGridColumn field='id' editable={false} />
              <AgGridColumn field='name' headerName='Trait' filter />
              <AgGridColumn field='members' filter editable={false} />
              <AgGridColumn field='notes' filter />
              <AgGridColumn editable={false} field='crossRefId' headerName='Cross Referenced Trait ID' width={100} />
            </AgGridReact>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', height: '300px', width: '100%', background: '#f1f1f1', marginTop: '30px' }}>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <span>Members</span>
          <button id='addMemberButton' onClick={addMember}>
            Add
          </button>
          <button id='clearAllMembersButton' onClick={clearMembers}>
            Clear All
          </button>
          <button id='RemoveMemberButton' onClick={removeMember}>
            Remove
          </button>
          <button id='selectAllMembersButton' onClick={() => memberGridApi.selectAll()}>
            Select All
          </button>
          {
            <>
              <label style={{ margin: '0 10px' }}>Assign Members to: </label>
              <select id='assignOption' onChange={e => setAssignedTraitId(e.target.value)} value={assignedTraitId || 'none'}>
                <option value='none' disabled hidden>
                  Select a Trait
                </option>
                {selectedTrait &&
                  traits &&
                  traits
                    .filter(trait => trait.id !== selectedTrait.id)
                    .map(trait => (
                      <option value={trait.id} key={trait.id}>
                        {trait.name}
                      </option>
                    ))}
              </select>
              <button style={{ margin: '0 10px' }} id='assignButton' onClick={assignMembers}>
                Assign
              </button>
            </>
          }
        </div>
        <div
          className='ag-theme-alpine'
          id='memberGrid'
          style={{
            height: '100%',
            width: '100%',
          }}
        >
          <AgGridReact
            modules={[ClientSideRowModelModule]}
            defaultColDef={{
              editable: false,
              flex: 1,
              resizable: true,
            }}
            onGridReady={onMemberGridReady}
            rowData={traitMembers}
            rowSelection='single'
            getRowNodeId={data => data.id}
            onSelectionChanged={() => setSelectedTraitMembers(memberGridApi.getSelectedRows())}
          >
            <AgGridColumn field='id' />
            <AgGridColumn field='firstName' headerName='First Name' minWidth={160} />
            <AgGridColumn field='lastName' headerName='Last Name' minWidth={160} />
          </AgGridReact>
        </div>
      </div>
      {selectedTrait && (
        <LinkTraitsModal
          isTraitsModalOpen={isTraitsModalOpen}
          linkTrait={linkTrait}
          relatedTraits={[{ traitId: selectedTrait.crossRefId }, { traitId: selectedTrait.id }]}
          setIsTraitsModalOpen={setIsTraitsModalOpen}
        />
      )}
    </div>
  )
}

TraitsGridEditor.propTypes = {
  showPeopleSelector: PropTypes.func,
}

export default TraitsGridEditor
