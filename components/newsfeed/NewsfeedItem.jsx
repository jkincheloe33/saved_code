import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { breakpoints, colors, devices } from '@assets'
import { Card, CelebrationsFeed, KabobMenu, PillButton, PostItem, PostWidget, ShareWambiItem, Title, WambiCard } from '@components'
import { useAuthContext, useEditPostContext, usePostContext, useResizeContext } from '@contexts'
import { coreApi } from '@services'
import { FEED_ITEM_TYPES, FEED_ITEM_STATUS, GROUP_ACCESS_LEVELS as levels } from '@utils'

// prettier-ignore
const Container = styled.div`
  margin: 0 auto;
  max-width: 740px;
  padding: 10px 20px;
  position: relative;
  width: 100%;

  @media (${devices.largeDesktop}) {
    ${p => p.inner && `
      padding: 10px 0;
    `}

    ${p => p.isPostWidget && 'display: none;'}
  }
`

const HiddenCard = styled(Card)`
  background-color: ${colors.gray3}4D;
  padding: 15px 25px 25px;
`

const Undo = styled(PillButton)`
  margin-top: 20px;
`

const NewsfeedItem = ({ feedItem, getSingle, handleSize, hideFeedItem, index, setViewDetails, user, ...props }) => {
  const { clientAccount } = useAuthContext()
  const { setExistingPostData, setShowEditCpcWorkflow, setShowEditPostWorkflow } = useEditPostContext()
  const { setShareCpcData, setShowShareCpc } = usePostContext()
  const { windowWidth } = useResizeContext()
  const ref = useRef(null)
  const [hidden, setHidden] = useState(false)

  const { itemType } = feedItem
  const isCelebration = itemType === FEED_ITEM_TYPES.CELEBRATION
  const isCpc = itemType === FEED_ITEM_TYPES.CPC
  const isPost = itemType === FEED_ITEM_TYPES.ANNOUNCEMENT
  const isPostWidget = itemType === FEED_ITEM_TYPES.POST_WIDGET
  const isShare = itemType === FEED_ITEM_TYPES.SHARED_WAMBI

  const hasAccess = user?.groupAccessLevel > levels.TEAM_MEMBER

  // used to set data and open correct edit workflow...JK
  const handleEdit = () => {
    setExistingPostData(feedItem)
    if (isCpc) setShowEditCpcWorkflow(true)
    else if (isShare) {
      setShareCpcData({ content: feedItem.content, feedId: feedItem.id, linkedFeedItem: feedItem.linkedFeedItem })
      setShowShareCpc(true)
    } else setShowEditPostWorkflow(true)
    // needed to close details modal in order to show updated feedItem...JK
    setViewDetails(false)
  }

  // renders HiddenCard in place of a newsfeeditem and changes visible flag in DB for Announcements && CPCs (newsfeed and cpc tables)...JK
  const handleHide = async status => {
    const {
      data: { success },
    } = await coreApi.post('/feedItem/update', { cpcId: feedItem.cpcId, feedId: feedItem.id, status })

    if (success) {
      setHidden(status === FEED_ITEM_STATUS.HIDDEN)
      if (hideFeedItem) hideFeedItem(feedItem.id)
      setViewDetails(false)
    }
  }

  // used to resize NewsfeedItem for the virtual list...JK
  const updateSize = () => {
    if (ref?.current && handleSize) handleSize(index, ref.current.clientHeight)
  }

  useEffect(() => {
    if (isCelebration && ref?.current) {
      // we are hiding the celebrations card on desktop since it is being rendered in the left column...JK
      if (windowWidth >= breakpoints.largeDesktop) ref.current.style.display = 'none'
      else ref.current.style.display = 'block'

      setTimeout(updateSize, 10)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCelebration, windowWidth])

  useEffect(() => {
    // used to get the height of each newsfeed item for virtualization list in newsfeed...JK
    setTimeout(() => {
      if (ref?.current && handleSize) handleSize(index, ref.current.clientHeight)
    }, 10)
  }, [handleSize, hidden, index])

  return (
    <Container inner={!getSingle} isPostWidget={isPostWidget} ref={ref}>
      {hidden ? (
        <HiddenCard backgroundColor='gray4' shadow={false}>
          <Title fontSize='18px'>{isPost ? 'Post' : isCpc ? 'Wambi' : 'Shared Wambi'} hidden</Title>
          <Undo
            buttonType='secondary'
            full
            id='undo-newsfeed-item-btn'
            inverted
            onClick={() => handleHide(FEED_ITEM_STATUS.VISIBLE)}
            text='Undo'
            thin
          />
        </HiddenCard>
      ) : (
        <>
          <Card shadow={Boolean(getSingle)}>
            {isPost && (
              <PostItem
                {...props}
                feedItem={feedItem}
                getSingle={getSingle}
                setViewDetails={setViewDetails}
                updateSize={updateSize}
                user={user}
              />
            )}
            {isCelebration && clientAccount?.settings?.newsfeed?.disableCelebrations !== true && (
              <CelebrationsFeed {...props} feedItem={feedItem} updateSize={updateSize} />
            )}
            {isPostWidget && hasAccess && <PostWidget isFeedItem updateSize={updateSize} />}
            {isCpc && (
              <WambiCard
                {...props}
                feedItem={feedItem}
                getSingle={getSingle}
                setViewDetails={setViewDetails}
                updateSize={updateSize}
                user={user}
              />
            )}
            {isShare && (
              <ShareWambiItem
                {...props}
                feedItem={feedItem}
                getSingle={getSingle}
                setViewDetails={setViewDetails}
                updateSize={updateSize}
                user={user}
              />
            )}
          </Card>
          {(isCpc || isShare || (isPost && (feedItem.isManaging || feedItem.authorId === user?.id))) && (
            <KabobMenu
              {...props}
              canShare={(isCpc || isShare) && feedItem.authorId !== user?.id}
              expanded={!getSingle}
              feedItem={feedItem}
              handleEdit={feedItem.authorId === user?.id ? handleEdit : null}
              handleHide={() => handleHide(FEED_ITEM_STATUS.HIDDEN)}
              isManaging={feedItem.isManaging}
              itemType={itemType}
              type={isPost ? 'Post' : isCpc ? 'Wambi' : 'Shared Wambi'}
            />
          )}
        </>
      )}
    </Container>
  )
}

NewsfeedItem.propTypes = {
  feedItem: PropTypes.object.isRequired,
  getSingle: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
  handleSize: PropTypes.func,
  hideFeedItem: PropTypes.func,
  index: PropTypes.number,
  setViewDetails: PropTypes.func,
  user: PropTypes.object,
}

export default NewsfeedItem
