import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import styled from 'styled-components'
import { AgGridReact, AgGridColumn } from '@ag-grid-community/react'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'

import { colors } from '@assets'
import { LinkGroupsModal, LinkTraitsModal, Select, TabBar } from '@components'
import { api } from '@services'
import { CHALLENGE_STATUS, CHALLENGE_WHO_CAN_COMPLETE, TRIGGERS } from '@utils'

const TAB_KEYS = {
  GROUPS: 0,
  TRAITS: 1,
  GOALS: 2,
}

const TABS = ['Groups', 'Traits', 'Goals']

let lastNewId = 0
let lastNewGoalId = 0

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

const TriggerSelect = styled(Select)`
  padding: 5px 0 5px 15px;
  width: 300px;
`

const WhoCanCompleteSelect = styled(Select)`
  padding: 5px 0 5px 15px;
  width: 200px;
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`

const ChallengesEditor = ({ selectedRecord, setContextMenu, themeImages }) => {
  const [challenges, setChallenges] = useState([])
  const [currentTab, setCurrentTab] = useState(TAB_KEYS.GROUPS)
  const [goalGridApi, setGoalGridApi] = useState(null)
  const [gridApi, setGridApi] = useState(null)
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false)
  const [isTraitsModalOpen, setIsTraitsModalOpen] = useState(false)
  const [relatedGoals, setRelatedGoals] = useState([])
  const [relatedGroups, setRelatedGroups] = useState([])
  const [relatedTraits, setRelatedTraits] = useState([])
  const [selectedChallenge, setSelectedChallenge] = useState(null)
  const [selectedGoal, setSelectedGoal] = useState(null)

  useEffect(() => {
    const getChallengesByTheme = async () => {
      setSelectedChallenge(null)

      const {
        data: { challengesForTheme, success },
      } = await api.post('/config/challenges/getByTheme', { challengeThemeId: selectedRecord.id })

      if (success) {
        challengesForTheme.forEach(c => {
          c.startDate = c.startDate ? moment(c.startDate).format('YYYY-MM-DD hh:mm A') : null
          c.endDate = c.endDate ? moment(c.endDate).format('YYYY-MM-DD hh:mm A') : null
        })

        setChallenges(challengesForTheme)
      }
    }

    if (selectedRecord?.id) getChallengesByTheme()
  }, [selectedRecord])

  useEffect(() => {
    const getRelatedItems = async () => {
      const {
        data: { relatedGoals, relatedGroups, relatedTraits, success },
      } = await api.post('/config/challenges/relatedItems', { challengeId: selectedChallenge.id })

      if (success) {
        setRelatedGroups(relatedGroups)
        setRelatedTraits(relatedTraits)
        setRelatedGoals(relatedGoals)
      }
    }

    if (selectedChallenge) getRelatedItems()
  }, [selectedChallenge])

  const onGridReady = async params => {
    setGridApi(params.api)
  }

  const newChallenge = async () => {
    const newChallenge = {
      challengeThemeId: selectedRecord.id,
      description: selectedRecord.templateDescription,
      id: --lastNewId,
      status: 0,
      title: selectedRecord.templateTitle,
      whoCanComplete: CHALLENGE_WHO_CAN_COMPLETE.ANYONE,
    }

    setChallenges(c => [newChallenge, ...c])
  }

  const saveGridChanges = async ({ data }) => {
    const whoCanComplete = selectedChallenge?.whoCanComplete ? selectedChallenge.whoCanComplete : data.whoCanComplete

    // use date object to send up to the db...PS
    data.startDate = data.startDate ? moment(data.startDate).toDate() : null
    data.endDate = data.endDate ? moment(data.endDate).toDate() : null

    // Looks like the select dropdowns can make gridApi null. Wrapping for now, possible TODO to investigate everywhere...JC
    if (gridApi) {
      if (!relatedGoals.length && Number(data.status) === CHALLENGE_STATUS.ACTIVE) {
        gridApi.getRowNode(data.id).setDataValue('status', String(CHALLENGE_STATUS.DRAFT))
        return alert('Challenge requires a goal record before you can set it to active!')
      }

      if (data.rewardIncrement < 0 || data.rewardIncrement > 1000) {
        gridApi.getRowNode(data.id).setDataValue('rewardIncrement', null)
        return alert('Not a valid input! Increment must be an integer between 0 and 1000.')
      }
    }

    if (data.id < 0) {
      // This is a new record, we need to insert, and then merge the returned ID...EK
      let { data: insertRes } = await api.post('/config/challenges/save', { inserted: { ...data, whoCanComplete } })

      // Merge ID back into record based on negative id...EK
      const newRow = gridApi.getRowNode(data.id)
      if (newRow) newRow.setDataValue('id', insertRes.newId)
    } else {
      await api.post('/config/challenges/save', { updated: { ...data, whoCanComplete } })
    }

    data.startDate = data.startDate ? moment(data.startDate).format('YYYY-MM-DD hh:mm A') : null
    data.endDate = data.endDate ? moment(data.endDate).format('YYYY-MM-DD hh:mm A') : null
  }

  const deleteChallenge = async () => {
    if (!selectedChallenge) return alert('No record selected to delete.')

    if (selectedChallenge.id < 0) {
      // This is an unsaved record, just remove from the data model...EK
      setChallenges(challenges.filter(r => r.id !== selectedChallenge.id))
    } else {
      if (confirm(`About to Delete '${selectedChallenge.title}'.  Are you sure you want to do this?`)) {
        const {
          data: { msg, success },
        } = await api.post('/config/challenges/save', { deleted: selectedChallenge })

        if (success) setChallenges(challenges.filter(r => r.id !== selectedChallenge.id))
        else alert('UNABLE TO DELETE: ' + msg)
      }
    }
  }

  const _setChallengeImage = async themeImg => {
    const { data: linkRes } = await api.post('/config/challenges/linkMedia', {
      mediaLinkId: themeImg.id,
      challengeId: selectedChallenge.id,
    })

    if (linkRes.success) {
      // Update the grid to show the new image...EK
      const newRow = gridApi.getRowNode(selectedChallenge.id)
      if (!newRow) newRow.setDataValue('image', themeImg.imageOption)
    } else {
      alert('Unable to Link Image, bad arguments')
    }
  }

  const selectChallengeImage = async e => {
    if (selectedChallenge != null && selectedChallenge.id > 0) {
      setContextMenu({
        x: e.pageX + 5,
        y: e.pageY + 5,
        renderMenu: () => {
          if (themeImages == null || themeImages.length === 0) {
            return <span>No Theme Images</span>
          } else {
            return themeImages.map((themeImg, themeIdx) => (
              <div key={themeIdx + 1} style={{ cursor: 'pointer' }} onClick={() => _setChallengeImage(themeImg)}>
                <img style={{ maxWidth: '75px', maxHeight: '75px' }} src={themeImg.imageOption} />
              </div>
            ))
          }
        },
      })
    } else {
      alert('Please select a saved challenge record')
    }
  }

  const linkGroup = async group => {
    const {
      data: { newLinkId, success },
    } = await api.post('/config/challenges/linkGroup', { challengeId: selectedChallenge.id, groupId: group.id })

    if (success) setRelatedGroups(rg => [...rg, { ...group, id: newLinkId, groupId: group.id }])
  }

  const linkTrait = async trait => {
    const {
      data: { newLinkId, success },
    } = await api.post('/config/challenges/linkTrait', { challengeId: selectedChallenge.id, traitId: trait.id })

    if (success) setRelatedTraits(rt => [...rt, { ...trait, id: newLinkId, traitId: trait.id }])
  }

  const unlinkGroup = async id => {
    const {
      data: { success },
    } = await api.post('/config/challenges/unlinkGroup', { id })

    if (success) setRelatedGroups(rg => rg.filter(g => g.id !== id))
  }

  const unlinkTrait = async id => {
    const {
      data: { success },
    } = await api.post('/config/challenges/unlinkTrait', { id })

    if (success) setRelatedTraits(rg => rg.filter(t => t.id !== id))
  }

  const onGoalGridReady = async params => {
    setGoalGridApi(params.api)
  }

  const newGoal = async () => {
    setRelatedGoals(rg => [{ id: --lastNewGoalId }, ...rg])
  }

  const saveGoalGridChanges = async ({ data }) => {
    const trigger = selectedGoal?.trigger ? selectedGoal.trigger : data.trigger

    //Validate JSON input...CY
    if (data?.triggerCondition) data.triggerCondition = JSON.parse(data.triggerCondition)
    if (data.id < 0) {
      const {
        data: { newId, success },
      } = await api.post('/config/challenges/saveGoal', {
        inserted: { ...data, challengeId: selectedChallenge.id, trigger },
      })
      if (success) {
        const newRow = goalGridApi?.getRowNode(data.id)
        if (newRow) newRow.setDataValue('id', newId)
      }
    } else {
      await api.post('/config/challenges/saveGoal', { updated: data })
    }
  }

  const deleteGoal = async () => {
    if (!selectedGoal) return alert('No record selected to delete.')

    if (selectedGoal.id < 0) {
      // This is an unsaved record, just remove from the data model...KA
      setRelatedGoals(rg => rg.filter(r => r.id !== selectedGoal.id))
    } else {
      if (confirm(`About to Delete 'Goal ${selectedGoal.id}'.  Are you sure you want to do this?`)) {
        const { data: deletedRes } = await api.post('/config/challenges/saveGoal', { deleted: selectedGoal })

        if (deletedRes.success) setRelatedGoals(rg => rg.filter(r => r.id !== selectedGoal.id))
        else alert('UNABLE TO DELETE: ' + deletedRes.msg)
      }
    }
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

  const renderTriggerSelect = ({ data }) => {
    return (
      <TriggerSelect
        defaultValue={data.trigger || ''}
        onChange={e => {
          if (data.id > 0) saveGoalGridChanges({ data: { ...data, trigger: e.target.value } })
          else setSelectedGoal(c => ({ ...c, trigger: e.target.value }))
        }}
        options={Object.keys(TRIGGERS).map(key => ({ name: key, value: TRIGGERS[key] }))}
        title='Select a trigger'
      />
    )
  }

  const renderGoalsTab = () => {
    return (
      <div className='ag-theme-alpine' id='goalsGrid' style={{ height: '300px' }}>
        <div>
          <button onClick={newGoal}>New Goal</button>
          <button onClick={deleteGoal}>Delete Goal</button>
        </div>
        <AgGridReact
          defaultColDef={{
            editable: true,
            resizable: true,
          }}
          enterMovesDown={true}
          enterMovesDownAfterEdit={true}
          getRowNodeId={data => data.id}
          modules={[ClientSideRowModelModule]}
          onCellValueChanged={saveGoalGridChanges}
          onGridReady={onGoalGridReady}
          onSelectionChanged={() => setSelectedGoal(goalGridApi.getSelectedRows()[0])}
          rowData={relatedGoals}
          rowSelection='single'
        >
          <AgGridColumn editable={false} field='id' width={100} />
          <AgGridColumn field='goal' width={100} />
          <AgGridColumn field='title' flex={1} />
          <AgGridColumn
            cellRendererFramework={renderTriggerSelect}
            cellStyle={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}
            editable={false}
            field='trigger'
            width={400}
          />
          <AgGridColumn field='triggerCondition' width={400} flex={1} />
          <AgGridColumn field='required' width={120} />
        </AgGridReact>
      </div>
    )
  }

  const renderWhoCanCompleteSelect = ({ data }) => {
    return (
      <WhoCanCompleteSelect
        defaultValue={data.whoCanComplete}
        onChange={e => {
          if (data.id > 0) {
            saveGridChanges({ data: { ...data, whoCanComplete: e.target.value } })
          } else setSelectedChallenge(challenge => ({ ...challenge, whoCanComplete: e.target.value }))
        }}
        options={Object.keys(CHALLENGE_WHO_CAN_COMPLETE).map(key => ({ name: key, value: CHALLENGE_WHO_CAN_COMPLETE[key] }))}
        title='Select Who Can Complete'
      />
    )
  }

  return (
    <Wrapper>
      <div className='ag-theme-alpine' id='myGrid' style={{ height: '300px' }}>
        <div>
          <button onClick={newChallenge}>New Challenge</button>
          <button onClick={deleteChallenge}>Delete Challenge</button>
          <button onClick={selectChallengeImage}>Set Image</button>
        </div>
        <AgGridReact
          components={{
            rowImage: ({ data }) => {
              if (data.image == null) return null
              return `<img style='display: flex; width: 35px; height: 35px;' src='${data.image}' />`
            },
          }}
          defaultColDef={{
            editable: true,
            resizable: true,
          }}
          enterMovesDown={true}
          enterMovesDownAfterEdit={true}
          getRowNodeId={data => data.id}
          modules={[ClientSideRowModelModule]}
          onCellValueChanged={saveGridChanges}
          onGridReady={onGridReady}
          onSelectionChanged={() => setSelectedChallenge(gridApi.getSelectedRows()[0])}
          rowData={challenges}
          rowSelection='single'
        >
          <AgGridColumn field='id' editable={false} width={70} />
          <AgGridColumn
            cellRenderer='rowImage'
            cellStyle={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}
            editable={false}
            field='image'
            width={80}
          />
          <AgGridColumn field='title' width={200} />
          <AgGridColumn field='description' flex={1} minWidth={100} />
          <AgGridColumn field='startDate' width={150} />
          <AgGridColumn field='endDate' width={150} />
          <AgGridColumn field='status' width={80} />
          <AgGridColumn field='goalsNeeded' width={125} />
          <AgGridColumn field='rewardIncrement' headerName='Increment' width={110} />
          <AgGridColumn
            cellRendererFramework={renderWhoCanCompleteSelect}
            cellStyle={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}
            editable={false}
            field='whoCanComplete'
            flex={1}
            minWidth={220}
          />
          <AgGridColumn field='participants' width={115} />
        </AgGridReact>
      </div>
      {selectedChallenge && (
        <div style={{ marginTop: '40px' }}>
          <TabBar options={TABS} selected={currentTab} setSelected={setCurrentTab} />

          <div style={{ marginTop: 5 }}>
            {currentTab === TAB_KEYS.GROUPS && renderGroupsTab()}
            {currentTab === TAB_KEYS.TRAITS && renderTraitsTab()}
            {currentTab === TAB_KEYS.GOALS && renderGoalsTab()}
          </div>
        </div>
      )}
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
    </Wrapper>
  )
}

ChallengesEditor.propTypes = {
  selectedRecord: PropTypes.object,
  setContextMenu: PropTypes.func,
  themeImages: PropTypes.array,
}

export default ChallengesEditor
