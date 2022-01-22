import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import styled from 'styled-components'

import { colors, devices } from '@assets'
import {
  CelebrationWidget,
  DynamicContainer,
  InsightWidget,
  Layout,
  Loader,
  Modal,
  NewsfeedItem,
  PopUp as PopUpBase,
  PostWidget,
  ReactionsPopUp,
  RewardProgressWidget,
  SpotlightReel,
  ViewDetailsWorkflow,
  WambiTrigger,
  ZoomPinch,
} from '@components'
import { useAuthContext, useLessonsContext, useProfileContext, useRefreshDataContext, useRewardContext, useUserContext } from '@contexts'
import { coreApi } from '@services'
import { FEED_ITEM_TYPES, GROUP_ACCESS_LEVELS as levels, NEWSFEED_VIEW, useStore } from '@utils'

const PopUp = styled(PopUpBase)`
  z-index: 5;
`

const VariableList = styled(VariableSizeList)`
  padding-bottom: 140px;
  scroll-behavior: smooth;

  scrollbar-color: ${colors.gray3}99;

  &::-webkit-scrollbar {
    display: ${p => (p.hideScrollBar ? 'none' : 'block')};
    width: 6px;
    -webkit-appearance: none;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${colors.gray3}99;
    border-radius: 5px;
  }

  @media (${devices.desktop}) {
    padding-bottom: 0;
  }
`

const clientTzOffset = new Date().getTimezoneOffset()

const Newsfeed = () => {
  const { clientAccount, isAuthenticated } = useAuthContext()
  const { setShowLessons } = useLessonsContext()
  const { setShowProfile, showProfile } = useProfileContext()
  const { newsfeedUpdate } = useRefreshDataContext()
  const { rewardProgress } = useRewardContext()
  const { user } = useUserContext()
  const { query, replace } = useRouter()
  const [setStore, { hasNewLessons }] = useStore()

  const [active, setActive] = useState(NEWSFEED_VIEW.DETAILS)
  const [feedItems, setFeedItems] = useState([])
  const [loadMore, setLoadMore] = useState(true)
  const [page, setPage] = useState(0)
  const [reactionsData, setReactionsData] = useState(null)
  const [recipientsData, setRecipientsData] = useState(null)
  const [seeMoreCelebrations, setSeeMoreCelebrations] = useState(null)
  const [seeMoreComments, setSeeMoreComments] = useState(null)
  const [showReactions, setShowReactions] = useState(false)
  const [showSeeMore, setShowSeeMore] = useState(false)
  const [showSeeMoreCelebrations, setShowSeeMoreCelebrations] = useState(false)
  const [, setShowSeeMoreCPCs] = useState(false)
  const [seeAllInsights, setSeeAllInsights] = useState(false)
  const [showAllInsights, setShowAllInsights] = useState(false)

  const [viewDetails, setViewDetails] = useState(false)
  const [viewDetailsData, setViewDetailsData] = useState(null)
  const [viewImage, setViewImage] = useState(false)
  const [viewImageData, setViewImageData] = useState(null)

  const hasAccess = user && user.groupAccessLevel > levels.TEAM_MEMBER
  const FEED_ITEM_LIMIT = 10

  // can't store in state due to rerenders when newsfeed list has to recalculate a newsfeed item's size when it changes due to SeeMore or new comments...JK
  const itemSize = useMemo(() => () => {}, [])
  const infiniteRef = useRef(null)
  const listRef = useRef(null)
  const storyRef = useRef(null)
  const isItemLoaded = index => !loadMore || index < feedItems.length
  // these props are shared between the single newsfeed item view and the newsfeed items within the infinite scroll...JK
  const newsfeedItemProps = {
    mergeUpdatedFeedItem: feedItem => setFeedItems(feedItems.map(fi => (fi.id === feedItem.id ? { ...fi, ...feedItem } : fi))),
    setActive,
    setReactionsData,
    setRecipientsData,
    setSeeMoreCelebrations,
    setSeeMoreComments,
    setShowSeeMoreCPCs,
    setShowReactions,
    setShowSeeMore,
    setShowSeeMoreCelebrations,
    setViewDetails,
    showSeeMore,
    user,
  }

  const getContent = index => {
    const content = !isItemLoaded(index) ? (
      <Loader />
    ) : (
      <NewsfeedItem {...newsfeedItemProps} feedItem={feedItems[index]} getSingle={getSingle} handleSize={handleSize} index={index} />
    )
    return content
  }

  const getMore = async () => {
    // This will pull the next page of items following the latest id in feedItems...JK
    if (page > 0) {
      const {
        data: { success, feedItems: latestFeedItems },
      } = await coreApi.post('/newsfeed/getLatest', { clientTzOffset, page })

      if (success) {
        if (latestFeedItems.length > 0) {
          setPage(page + 1)
          return setFeedItems([...feedItems, ...latestFeedItems])
        }
        // prevent getMore function from running again if latestFeedItems returns an empty array...JK
        setLoadMore(false)
      }
    }
  }

  const getSingle = async ({ feedId }) => {
    const {
      data: { success, feedItem },
    } = await coreApi.post('/newsfeed/getFeedItem', { clientTzOffset, feedId })
    if (success) {
      setViewDetails(true)
      setViewDetailsData({
        component: NewsfeedItem,
        props: {
          ...newsfeedItemProps,
          // needed to prevent user's from firing getSingle on the share Wambi text once already opened in Modal...JK
          blockGetSingle: feedItem.itemType === FEED_ITEM_TYPES.SHARED_WAMBI,
          feedItem,
          hideFeedItem: feedId => setFeedItems(fi => fi.filter(item => item.id !== feedId)),
          setViewImage,
          // pass in getSingle for shared wambi types in order to allow users to expand the original wambi...JK
          getSingle: feedItem.itemType === FEED_ITEM_TYPES.SHARED_WAMBI && getSingle,
        },
      })
      setViewImageData({ image: { alt: 'Item Image', src: feedItem.banner } })
    } else {
      alert('You cannot view feed item')
    }
  }

  // tracks the scrollOffset of the infinite scroll list. pushes the SpotlightReel in/out of the viewport and
  // the InfiniteScrollWrapper up/down. InfiniteScrollWrapper will only move up as far as the StorReel is tall (roughly 180px)...JK
  const handleScroll = scrollOffset => {
    if (infiniteRef && infiniteRef.current) {
      const story = storyRef.current
      const storyHeight = story.clientHeight
      const el = infiniteRef.current
      if (scrollOffset <= storyHeight) {
        el.style.transform = `translateY(-${scrollOffset}px)`
        story.style.transform = `translateY(-${scrollOffset}px)`
      } else {
        el.style.transform = `translateY(-${storyHeight}px)`
        story.style.transform = `translateY(-${storyHeight}px)`
      }
    }
  }

  const handleSize = useCallback(
    (index, number) => {
      if (itemSize[index] === number) return
      itemSize[index] = number
      if (listRef?.current) listRef.current.resetAfterIndex(index)
    },
    [itemSize]
  )

  const renderComponent = ({ component, props }) => {
    const Component = component
    return <Component {...props} />
  }

  useEffect(() => {
    // opens the lessons modal and sets hasNewLessons to false in the store to prevent the modal from opening any time other than initial sign in...JK
    if (hasNewLessons) {
      setShowLessons(true)
      setStore({ hasNewLessons: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNewLessons])

  useEffect(() => {
    // keeps user from scrolling the window and forces them to scroll the newsfeed items container...JK
    if (!showSeeMoreCelebrations && !showProfile && !showReactions && !viewDetails) document.documentElement.style.overflow = 'hidden'
  }, [feedItems, showReactions, showSeeMoreCelebrations, showProfile, viewDetails])

  useEffect(() => {
    // Parse out query from url...CY
    const { feedId } = query
    if (feedId && isAuthenticated) {
      getSingle({ feedId })
      replace('/newsfeed')
    }
    // disabled to prevent from re-running when new feedItems are added...JK
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isAuthenticated])

  useEffect(() => {
    const pullLatest = async () => {
      // This will pull the latest newsfeed items, and go to the top of the scroll...EK
      const {
        data: { success, feedItems: latestFeedItems },
      } = await coreApi.post('/newsfeed/getLatest', { clientTzOffset })
      if (success) {
        // NOTE: Items may not always be in the exact same order, so we may need to handle this differently then with Ids??
        setFeedItems(latestFeedItems)
        setPage(page + 1)
        if (latestFeedItems.length < FEED_ITEM_LIMIT) setLoadMore(false)
      }
    }

    // Initial load of the latest feed items...EK
    pullLatest()

    // since we have overflow hidden on the page, we need to prevent scrollRestoration and start users at the top of the page...JK
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const {
      action,
      data: { feedId },
    } = newsfeedUpdate
    if (feedId) {
      if (action === 'updateFeedItem') pullUpdatedFeedItem(feedId)
      else if (action === 'removeFeedItem') setFeedItems(i => i.filter(({ id }) => feedId !== id))
      else pullUpdatedFeedList()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newsfeedUpdate])

  const pullUpdatedFeedItem = async feedId => {
    const {
      data: { success, feedItem: updatedFeedItem },
    } = await coreApi.post('/newsfeed/getFeedItem', { feedId, updatingNewsfeed: true })
    if (success) {
      setFeedItems(feedItems.map(item => (item.id === updatedFeedItem.id ? { ...item, ...updatedFeedItem } : item)))
    }
  }

  // Pulls a fresh newsfeed list after a user update, such as posting an post or CPC...JC
  const pullUpdatedFeedList = async () => {
    const {
      data: { success, feedItems: latestFeedItems },
    } = await coreApi.post('/newsfeed/getLatest', { clientTzOffset })

    if (success) {
      listRef.current.scrollTo(0, 500)
      setFeedItems(latestFeedItems)
      setPage(1)
      if (latestFeedItems.length < FEED_ITEM_LIMIT) setLoadMore(false)
    }
  }

  return (
    <>
      <Layout
        head='Newsfeed'
        id='newsfeed'
        leftColumn={
          <>
            {rewardProgress && user && !user.isSelfRegistered && <RewardProgressWidget />}
            {user && !user.isSelfRegistered && (
              <InsightWidget setSeeAllInsight={setSeeAllInsights} setShowAllInsights={setShowAllInsights} />
            )}
            {clientAccount && clientAccount.settings?.newsfeed?.disableCelebrations !== true && (
              <CelebrationWidget setShowSeeMoreCelebrations={setShowSeeMoreCelebrations} setSeeMoreCelebrations={setSeeMoreCelebrations} />
            )}
          </>
        }
        rightColumn={
          <>
            <WambiTrigger />
            {hasAccess && <PostWidget />}
          </>
        }
      >
        {/* TODO: Fix this hacky solution that allows scroll on one newsfeed item...KA */}
        <DynamicContainer outer noScroll={feedItems.length > 3}>
          <div ref={storyRef}>
            <SpotlightReel setShowProfile={setShowProfile} />
          </div>
          <DynamicContainer fixed outer ref={infiniteRef} noScroll>
            <InfiniteLoader
              itemCount={loadMore ? feedItems.length + 1 : feedItems.length}
              isItemLoaded={index => isItemLoaded(index)}
              loadMoreItems={getMore}
              threshold={2}
            >
              {({ onItemsRendered, ref }) => (
                <AutoSizer ref={ref}>
                  {({ height, width }) => (
                    <VariableList
                      height={height}
                      hideScrollBar={feedItems.length < 4}
                      itemCount={loadMore ? feedItems.length + 1 : feedItems.length}
                      itemSize={index => itemSize[index] ?? 186}
                      onItemsRendered={onItemsRendered}
                      onScroll={({ scrollOffset }) => handleScroll(scrollOffset)}
                      ref={listRef}
                      width={width}
                    >
                      {({ index, style }) => (feedItems[index] ? <div style={style}>{getContent(index)}</div> : <div style={style} />)}
                    </VariableList>
                  )}
                </AutoSizer>
              )}
            </InfiniteLoader>
          </DynamicContainer>
        </DynamicContainer>
      </Layout>
      <Modal open={viewDetails}>
        <ViewDetailsWorkflow
          active={active}
          handleBack={() => setViewDetails(false)}
          recipientsData={recipientsData}
          seeMoreComments={seeMoreComments}
          setActive={setActive}
          setViewDetailsData={setViewDetailsData}
          viewDetails={viewDetails}
          viewDetailsData={viewDetailsData}
        />
      </Modal>
      <Modal handleClose={viewImage ? () => setViewImage(false) : null} open={showAllInsights || showSeeMoreCelebrations || viewImage}>
        {viewImage && (viewImageData ? renderComponent({ component: ZoomPinch, props: viewImageData }) : <Loader />)}
        {showSeeMoreCelebrations && seeMoreCelebrations && renderComponent(seeMoreCelebrations)}
        {showAllInsights && seeAllInsights && renderComponent(seeAllInsights)}
      </Modal>
      <PopUp handleClose={() => setShowReactions(false)} open={showReactions}>
        {reactionsData && <ReactionsPopUp {...reactionsData} />}
      </PopUp>
    </>
  )
}

Newsfeed.propTypes = {}

export default Newsfeed
