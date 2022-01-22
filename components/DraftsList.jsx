import { useEffect, useState } from 'react'
import moment from 'moment'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { CalendarIcon2, ClockSmallIcon, colors, EditIcon, ErrorIcon, multiplier, TrashIcon } from '@assets'
import { Card as CardBase, DynamicContainer, Image, Layout, Paragraph, Text, Title } from '@components'
import { useDraftContext } from '@contexts'
import { coreApi } from '@services'
import { FEED_ITEM_DRAFT_STATUS } from '@utils'

const CONTAINER_SPACE = multiplier * 3
const DELETE_RATIO = multiplier * 5
const TRASH_SPACE = multiplier * 2

const Card = styled(CardBase)`
  flex: 0 0 100%;
  // if editMode, subtract total pixel area that the delete icon takes up (width + margin) from 100%...JK
  flex-basis: calc(100% - ${p => (p.editMode ? DELETE_RATIO + TRASH_SPACE : 0)}px);
  padding: ${multiplier * 2}px;
  position: relative;
  // if editMode, translate over total pixel area that the delete icon takes up (width + margin)...JK
  transform: translateX(-${p => (p.editMode ? 0 : DELETE_RATIO + TRASH_SPACE)}px);
  transition: all 250ms ease;
`

const Content = styled.div`
  align-items: center;
  display: flex;
`

const DeleteIcon = styled.div`
  align-items: center;
  background-color: ${colors.berry}1A;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  flex: 0 0 ${DELETE_RATIO}px;
  height: ${DELETE_RATIO}px;
  margin-right: ${TRASH_SPACE}px;
  padding: ${multiplier}px;
  // if not in editMode, translate over total pixel area that the delete icon takes up (width + margin) + the extra CONTAINER_SPACING padding to move it out of view...JK
  transform: translateX(-${p => (p.editMode ? 0 : DELETE_RATIO + TRASH_SPACE + CONTAINER_SPACE)}px);
  transition: all 250ms ease;
  width: ${DELETE_RATIO}px;

  img {
    margin: auto;
  }
`

const DraftWrapper = styled.div`
  align-items: center;
  cursor: pointer;
  display: flex;
  flex-wrap: nowrap;
  margin-bottom: ${multiplier * 2}px;
  pointer-events: ${p => (p.clickable ? 'auto' : 'none')};
`

const Icon = styled(Image)`
  margin-right: ${multiplier}px;
  width: ${multiplier * 2}px;
`

const NoResults = styled(Title)`
  padding: ${multiplier * 2}px;
`

const Processing = styled(Text)`
  margin-top: ${multiplier}px;
`

const Type = styled(Content)`
  margin-bottom: ${multiplier}px;
`

const VideoProcessing = styled.div`
  align-items: center;
  background-color: ${colors.gray5}F2;
  bottom: 0;
  display: ${p => (p.visible ? 'flex' : 'none')};
  flex-direction: column;
  justify-content: center;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`

const Wrapper = styled(DynamicContainer)`
  padding: ${CONTAINER_SPACE}px;
`

const DraftsList = ({ cta, handleSelectedDraft, itemType }) => {
  const [draftList, setDraftList] = useState(null)
  const [editMode, setEditMode] = useState(false)

  const { getDraftCounts } = useDraftContext()

  useEffect(() => {
    const getDraftsList = async () => {
      const {
        data: { success, draftsList },
      } = await coreApi.post('/feedItemDraft/list', { itemType })

      if (success) setDraftList(draftsList)
    }

    if (itemType) getDraftsList()
  }, [itemType])

  const deleteDraft = async feedItemDraftId => {
    const {
      data: { success },
    } = await coreApi.post('/feedItemDraft/delete', { feedItemDraftId })

    if (success) {
      getDraftCounts()
      setDraftList(dl => dl.filter(d => d.id !== feedItemDraftId))
      if (draftList?.length <= 1 && cta) cta.onClick()
    }
  }

  return (
    <Layout
      cta={cta}
      id='drafts-list'
      inner
      leftCta={{ onClick: () => setEditMode(em => !em), text: editMode ? 'Done' : 'Edit' }}
      noFooter
      title='Drafts'
    >
      <Wrapper>
        {draftList?.length === 0 && <NoResults>You currently have no drafts!</NoResults>}
        {draftList?.map(({ draftData, id, scheduledAt, status }, i) => {
          const failedDraft = status === FEED_ITEM_DRAFT_STATUS.FAILED
          const scheduledTime = scheduledAt && moment(scheduledAt).local().format('MMM D [at] h A')

          return (
            <DraftWrapper clickable={status !== FEED_ITEM_DRAFT_STATUS.VIDEO_PROCESSING} key={id}>
              <DeleteIcon editMode={editMode} onClick={() => deleteDraft(id)}>
                <Image alt='Trash icon' src={TrashIcon} />
              </DeleteIcon>
              <Card
                editMode={editMode}
                onClick={() => handleSelectedDraft(failedDraft ? { ...draftList[i], failedDraft: true } : draftList[i])}
              >
                <Type>
                  <Icon
                    alt={`${scheduledAt ? (failedDraft ? 'Error' : 'Calendar') : 'Draft'} Icon`}
                    src={scheduledAt ? (failedDraft ? ErrorIcon : CalendarIcon2) : EditIcon}
                  />
                  <Text color='gray1' fontSize='12px'>
                    {scheduledAt
                      ? failedDraft
                        ? `Failed to send (scheduled for ${scheduledTime})`
                        : `Scheduled for ${scheduledTime}`
                      : 'Draft'}
                  </Text>
                </Type>
                <Content>
                  <Paragraph color={draftData.content ? 'gray1' : 'gray3'} maxLines={2}>
                    {draftData.content || 'No Message Added'}
                  </Paragraph>
                </Content>
                <VideoProcessing visible={status === FEED_ITEM_DRAFT_STATUS.VIDEO_PROCESSING}>
                  <Image alt='Clock Icon' src={ClockSmallIcon} />
                  <Processing>Video processing, check back later</Processing>
                </VideoProcessing>
              </Card>
            </DraftWrapper>
          )
        })}
      </Wrapper>
    </Layout>
  )
}

DraftsList.propTypes = {
  cta: PropTypes.object,
  handleSelectedDraft: PropTypes.func,
  itemType: PropTypes.number,
}

export default DraftsList
