import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import styled from 'styled-components'
import { AgGridReact, AgGridColumn } from '@ag-grid-community/react'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import Calendar from 'react-calendar'

import {
  Card,
  Checkbox,
  DropdownButton,
  DynamicContainer,
  Image,
  Input,
  LinkGroupsModal,
  Modal,
  Paragraph,
  PeopleTile,
  PillButton,
  Select,
  Text,
  Title,
} from '@components'
import { CalendarIcon2, colors } from '@assets'
import { api } from '@services'
import { handleClickOut } from '@utils'

let lastNewId = 0

const CalendarWrapper = styled.div`
  display: ${p => (p.open ? 'block' : 'none')};
  left: 50%;
  position: absolute;
  top: 0;
  transform: translateX(-50%);

  .react-calendar {
    background: white;
    border: 1px solid ${colors.gray5};
    border-radius: 14px;
    overflow: hidden;

    .react-calendar__tile--now {
      background-color: ${colors.lightBlue};
    }

    .react-calendar__tile--active {
      background: ${colors.blurple};
    }
  }
`

const CardText = styled(Text)`
  margin-bottom: 1rem;
  text-align: center;
`

const CardTitle = styled(Title)`
  margin: 1rem 0;
  text-align: center;
`

const CardParagraph = styled(Paragraph)`
  text-align: center;
`

const CloseText = styled(Text)`
  cursor: pointer;
  margin: 20px;
`
const Content = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
`

const ImageWrapper = styled.div`
  max-height: 224px;
  overflow: hidden;
`

const PeopleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 350px;
  margin: 20px;
  overflow: auto;
  width: 100%;
`

const PeopleTileWrapper = styled(PeopleTile)`
  width: fit-content;
`

const PreviewWrapper = styled(DynamicContainer)`
  background-color: ${colors.white};
  margin-bottom: 2rem;
  padding: 20px;
`

const RaffleWrapper = styled.div`
  align-items: center;
  background-color: ${colors.white};
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-evenly;
  padding: 50px 100px;
`

const RewardCard = styled(Card)`
  border: 1px solid ${colors.white};
  margin: 20px auto;
  max-width: 373px;
`

const SubmitWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  width: 100%;

  ${Text} {
    margin-bottom: 20px;
  }
`

const WinnersWrapper = styled.div`
  align-items: center;
  background-color: ${colors.white};
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  padding: 30px 50px;
`

const RewardGiftsEditor = ({ rewardLevelId }) => {
  const calendarRef = useRef(null)

  const [errorMessage, setErrorMessage] = useState('')
  const [gridApi, setGridApi] = useState(null)
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isRaffleModalOpen, setIsRaffleModalOpen] = useState(false)
  const [isWinnersModalOpen, setIsWinnersModalOpen] = useState(false)
  const [raffleDateRange, setRaffleDateRange] = useState(null)
  const [raffleGifts, setRaffleGifts] = useState([])
  const [raffleWinnerCount, setRaffleWinnerCount] = useState(null)
  const [raffleWinners, setRaffleWinners] = useState([])
  const [relatedGroups, setRelatedGroups] = useState([])
  const [rowData, setRowData] = useState(null)
  const [selectedRaffleGift, setSelectedRaffleGift] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  handleClickOut(calendarRef, () => {
    if (showCalendar) setShowCalendar(false)
  })

  useEffect(() => {
    setSelectedRecord(null)

    const getRewardGifts = async () => {
      const {
        data: { gifts, success },
      } = await api.post('/config/rewards/gifts/listByLevel', { rewardLevelId })

      if (success) {
        gifts.forEach(g => {
          g.startDate = g.startDate ? moment(g.startDate).format('YYYY-MM-DD hh:mm A') : null
          g.endDate = g.endDate ? moment(g.endDate).format('YYYY-MM-DD hh:mm A') : null
        })

        setRowData(gifts)
      }
    }

    if (rewardLevelId) getRewardGifts()
  }, [rewardLevelId])

  useEffect(() => {
    const getRelatedItems = async () => {
      const {
        data: { relatedGroups, success },
      } = await api.post('/config/rewards/gifts/relatedItems', { rewardGiftId: selectedRecord.id })

      if (success) setRelatedGroups(relatedGroups)
    }

    if (isGroupsModalOpen && selectedRecord?.id) {
      getRelatedItems()
    }
  }, [isGroupsModalOpen, selectedRecord])

  useEffect(() => {
    const getRaffleGifts = async () => {
      const {
        data: { giftsForRaffle, success },
      } = await api.get(`/config/rewards/gifts/giftsForRaffle?raffleId=${selectedRecord.id}`)

      if (success) setRaffleGifts(giftsForRaffle)
    }
    if (isRaffleModalOpen) getRaffleGifts()
  }, [isRaffleModalOpen, selectedRecord])

  useEffect(() => {
    setErrorMessage('')
  }, [isRaffleModalOpen, raffleDateRange, raffleWinnerCount, selectedRaffleGift, showDateFilter])

  const onGridReady = async params => {
    setGridApi(params.api)
  }

  const newRecord = () => {
    setRowData([...rowData, { id: --lastNewId }])
  }

  const saveChanges = async ({ data }) => {
    // use date object to send up to the db...PS
    data.startDate = data.startDate ? moment(data.startDate).toDate() : null
    data.endDate = data.endDate ? moment(data.endDate).toDate() : null

    if (data.id < 0) {
      const {
        data: { newId },
      } = await api.post('/config/rewards/gifts/save', { inserted: { ...data, rewardLevelId } })

      const newRow = gridApi.getRowNode(data.id)
      if (newRow != null) newRow.setDataValue('id', newId)
    } else {
      await api.post('/config/rewards/gifts/save', { updated: data })
    }

    data.startDate = data.startDate ? moment(data.startDate).format('YYYY-MM-DD hh:mm A') : null
    data.endDate = data.endDate ? moment(data.endDate).format('YYYY-MM-DD hh:mm A') : null
  }

  const deleteRecord = async () => {
    if (!selectedRecord) return alert('No record selected to delete.')

    if (selectedRecord.id < 0) {
      setRowData(rowData.filter(r => r.id !== selectedRecord.id))
    } else {
      if (confirm(`About to Delete '${selectedRecord.name}'.  Are you sure you want to do this?`)) {
        const {
          data: { msg, success },
        } = await api.post('/config/rewards/gifts/save', { deleted: selectedRecord })

        if (success) setRowData(rowData.filter(r => r.id !== selectedRecord.id))
        else alert('UNABLE TO DELETE: ' + msg)
      }
    }
  }

  const addMedia = () => {
    const fileInput = document.getElementById('upload-reward-gift-image')

    fileInput.onchange = async () => {
      const formData = new FormData()
      formData.append('rewardGiftId', selectedRecord.id)
      formData.append('mediaUpload', fileInput.files[0])

      const {
        data: { success, msg },
      } = await api.post('/config/rewards/gifts/saveMedia', formData)

      if (success) alert(`Media linked to ${selectedRecord.name}`)
      else console.error('Media Save Issue: ', msg)

      fileInput.value = null
    }

    fileInput.click()
  }

  const linkGroup = async group => {
    const {
      data: { newLinkId, success },
    } = await api.post('/config/rewards/gifts/linkGroup', { groupId: group.id, rewardGiftId: selectedRecord.id })

    if (success) setRelatedGroups(rg => [...rg, { ...group, id: newLinkId, groupId: group.id }])
  }

  const unlinkGroup = async id => {
    const {
      data: { success },
    } = await api.post('/config/rewards/gifts/unlinkGroup', { id })

    if (success) setRelatedGroups(rg => rg.filter(g => g.id !== id))
  }

  const handleRaffleSubmit = async () => {
    setSubmitting(true)

    const {
      data: { success, winners },
    } = await api.post('/config/rewards/gifts/completeRaffle', {
      endDate: showDateFilter ? raffleDateRange[1] : null,
      numOfWinners: Number(raffleWinnerCount),
      raffleId: selectedRecord.id,
      rewardGiftId: selectedRaffleGift,
      startDate: showDateFilter ? raffleDateRange[0] : null,
    })

    if (success) {
      if (winners.length) {
        setRaffleWinners(winners)
        setIsWinnersModalOpen(true)
        setIsRaffleModalOpen(false)
      } else {
        setErrorMessage('No winners matched for this gift. Please check inventory or try again. ')
      }
    }
    setSubmitting(false)
  }

  const handleRaffleModalClose = () => {
    setIsRaffleModalOpen(false)
    setIsWinnersModalOpen(false)
    setRaffleWinnerCount(null)
    setSelectedRaffleGift(null)
    setRaffleDateRange(null)
    setShowDateFilter(false)
  }

  return (
    <>
      <div>
        <button onClick={newRecord}>New</button>
        <button onClick={deleteRecord}>Delete</button>
        {selectedRecord && (
          <>
            <button onClick={() => setIsGroupsModalOpen(true)}>Link Groups</button>
            <button onClick={addMedia}>Upload Media</button>
            {selectedRecord.isRaffle === 1 && <button onClick={() => setIsRaffleModalOpen(true)}>Pick Raffle Winners</button>}
            <button onClick={() => setIsPreviewModalOpen(true)}>Preview Gift</button>
          </>
        )}
        <input hidden id='upload-reward-gift-image' type='file' />
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
          <AgGridColumn editable={false} field='id' width={70} />
          <AgGridColumn field='name' width={250} />
          <AgGridColumn field='description' width={250} />
          <AgGridColumn field='itemNumber' width={130} />
          <AgGridColumn field='attributeName' width={150} />
          <AgGridColumn field='attributeValue' width={150} />
          <AgGridColumn field='ctaText' headerName='CTA Text' width={110} />
          <AgGridColumn field='notifyWhenClaimed' width={170} />
          <AgGridColumn field='claimInstructions' width={160} />
          <AgGridColumn field='order' width={80} />
          <AgGridColumn field='startDate' width={150} />
          <AgGridColumn field='endDate' width={150} />
          <AgGridColumn field='cost' width={70} />
          <AgGridColumn field='supplier' width={100} />
          <AgGridColumn field='SKU' width={80} />
          <AgGridColumn field='isRaffle' width={100} />
          <AgGridColumn field='requiredShipping' headerName='Shipping Required' width={160} />
          <AgGridColumn field='requiredPhone' headerName='Phone Required' width={150} />
          <AgGridColumn field='expiresInDays' width={140} />
          <AgGridColumn field='inventory' width={100} />
          <AgGridColumn field='status' width={80} />
          <AgGridColumn field='notes' width={400} />
        </AgGridReact>
      </div>
      <LinkGroupsModal
        isGroupsModalOpen={isGroupsModalOpen}
        linkGroup={linkGroup}
        relatedGroups={relatedGroups}
        setIsGroupsModalOpen={setIsGroupsModalOpen}
        unlinkGroup={unlinkGroup}
      />
      <Modal handleClose={handleRaffleModalClose} onClickOut={() => {}} open={isRaffleModalOpen}>
        <RaffleWrapper>
          <Text color='gray1' fontSize='24px'>
            Select your gift and number of winners!
          </Text>
          <Select
            onChange={e => setSelectedRaffleGift(e.target.value)}
            options={raffleGifts}
            title='Select a gift'
            value={selectedRaffleGift || ''}
          />
          <Input
            border
            label='Number of Winners'
            min='0'
            max='1000'
            onChange={e => setRaffleWinnerCount(e.target.value)}
            showLabel
            type='number'
            value={raffleWinnerCount || ''}
          />
          <div style={{ position: 'relative' }}>
            <Checkbox checked={showDateFilter} onChange={() => setShowDateFilter(sc => !sc)} spacing='0 10px 0'>
              Filter winners by date entered
            </Checkbox>
            {showDateFilter && (
              <div style={{ marginTop: 20 }}>
                <DropdownButton
                  icon={CalendarIcon2}
                  displayText={
                    raffleDateRange?.length
                      ? `${moment(raffleDateRange[0]).format('MM/DD/YY')} - ${moment(raffleDateRange[1]).format('MM/DD/YY')}`
                      : 'Select date range'
                  }
                  onClick={() => setShowCalendar(true)}
                  spacing='0 0 16px'
                />
                <CalendarWrapper open={showCalendar} ref={calendarRef}>
                  <Calendar
                    calendarType='US'
                    onChange={e => {
                      setRaffleDateRange(e)
                      setShowCalendar(false)
                    }}
                    selectRange
                    value={raffleDateRange}
                  />
                </CalendarWrapper>
              </div>
            )}
          </div>
          <SubmitWrapper>
            {errorMessage && <Text color='berry'>{errorMessage}</Text>}
            <PillButton
              disabled={!raffleWinnerCount || !selectedRaffleGift || (showDateFilter && !raffleDateRange) || submitting}
              onClick={handleRaffleSubmit}
              text='Submit'
              thin
            />
          </SubmitWrapper>
        </RaffleWrapper>
      </Modal>
      <Modal animationType='none' open={isWinnersModalOpen} small>
        <WinnersWrapper>
          <Text color='gray1' fontSize='24px'>
            {Number(raffleWinnerCount) === 1 ? 'Here is the raffle winner!' : `Here are the ${raffleWinners.length} raffle winners!`}
          </Text>
          {Number(raffleWinnerCount) !== raffleWinners.length && (
            <Text>
              You picked {raffleWinnerCount} winners, but there were only {raffleWinners.length} entries.
            </Text>
          )}
          <PeopleWrapper>
            {raffleWinners.length > 0 &&
              raffleWinners.map(({ image, name, personId, title }, i) => (
                <PeopleTileWrapper images={[image]} key={i} personId={personId} subtitle={title} title={name} />
              ))}
          </PeopleWrapper>
          <PillButton
            onClick={() => {
              handleRaffleModalClose()
              setIsRaffleModalOpen(true)
            }}
            text='Pick More Winners'
            thin
          />
          <CloseText color='blurple' onClick={handleRaffleModalClose}>
            Close
          </CloseText>
        </WinnersWrapper>
      </Modal>
      <Modal animationType='none' onClickOut={() => setIsPreviewModalOpen(false)} open={isPreviewModalOpen} small>
        {selectedRecord && (
          <PreviewWrapper>
            <RewardCard>
              {selectedRecord.image && (
                <ImageWrapper>
                  <Image alt='reward image' src={selectedRecord.image} width='100%' />
                </ImageWrapper>
              )}
              <Content>
                <CardTitle fontColor='coolGray' fontSize='24px' fontWeight='600'>
                  {selectedRecord.name}
                </CardTitle>
                <CardText color='coolGray'>Claim before {moment().add(selectedRecord.expiresInDays, 'days').format('MM/DD')}</CardText>
                <CardParagraph color='coolGray'>{selectedRecord.description}</CardParagraph>
              </Content>
            </RewardCard>
          </PreviewWrapper>
        )}
      </Modal>
    </>
  )
}

RewardGiftsEditor.propTypes = {
  rewardLevelId: PropTypes.number,
}

export default RewardGiftsEditor
