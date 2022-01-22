import PropTypes from 'prop-types'
import styled from 'styled-components'

import { KabobMenu, WambiCard } from '@components'
import { useEditPostContext, useUserContext } from '@contexts'
import { coreApi } from '@services'
import { FEED_ITEM_STATUS, FEED_ITEM_TYPES } from '@utils'

const Container = styled.div`
  margin: 0 auto;
  padding: 10px;
  position: relative;
  width: 100%;
`

const FeedItemDetail = ({ authorId, feedItem, getSingle, hideKabob = false, profile, setViewDetails, ...detailsProps }) => {
  const { setExistingPostData, setShowEditCpcWorkflow } = useEditPostContext()
  const { user } = useUserContext()

  const { cpcId, id, isManaging, itemType, status } = { ...feedItem }
  const isCpc = itemType === FEED_ITEM_TYPES.CPC

  // used to set data and open correct edit workflow...JK
  const handleEdit = () => {
    setExistingPostData(feedItem)
    if (isCpc) setShowEditCpcWorkflow(true)
  }

  const handleHide = async status => {
    const {
      data: { success },
    } = await coreApi.post('/feedItem/update', { cpcId, feedId: id, status })

    if (success) setViewDetails(false)
  }

  return (
    <Container>
      {itemType && itemType === FEED_ITEM_TYPES.CPC && (
        <WambiCard
          {...detailsProps}
          authorId={authorId}
          feedItem={feedItem}
          getSingle={getSingle}
          setViewDetails={setViewDetails}
          user={profile}
        />
      )}
      {!hideKabob && feedItem && (
        <KabobMenu
          {...detailsProps}
          canShare={isCpc && feedItem.authorId !== user?.id && status === FEED_ITEM_STATUS.VISIBLE}
          expanded={!getSingle}
          feedItem={feedItem}
          feedItemStatus={status}
          handleEdit={feedItem.authorId === user?.id ? handleEdit : null}
          handleHide={() => handleHide(FEED_ITEM_STATUS.HIDDEN)}
          isManaging={isManaging}
          type='Wambi'
        />
      )}
    </Container>
  )
}

FeedItemDetail.propTypes = {
  authorId: PropTypes.number,
  feedItem: PropTypes.object,
  getSingle: PropTypes.func,
  hideKabob: PropTypes.bool,
  profile: PropTypes.object,
  setViewDetails: PropTypes.func,
}

export default FeedItemDetail
