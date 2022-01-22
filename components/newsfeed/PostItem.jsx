import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import moment from 'moment-shortformat'
import styled from 'styled-components'
import Linkify from 'linkifyjs/react'

import { colors, PinIcon, UploadArrowIcon } from '@assets'
import { AddComment, Comment, Image, ListComments, Paragraph, PeopleTile, Reactions, SeeMoreText, Text } from '@components'
import { useCelebrationContext, useReactionsContext, useRefreshDataContext } from '@contexts'
import { coreApi } from '@services'
import { addNewReaction, NEWSFEED_VIEW, postComment, toggleReactions, uId } from '@utils'

// original dimensions for cpc images
const BANNER_HEIGHT = 751
const BANNER_WIDTH = 1296
// returns percentage value for original height/width of banner image...JK
const BANNER_RATIO = BANNER_HEIGHT / BANNER_WIDTH

const Content = styled(Text)`
  cursor: ${p => (p.clickable ? 'pointer' : 'auto')};
`

const ContentWrapper = styled.div`
  padding: 8px 20px 20px;
`

// prettier-ignore
const BannerImage = styled.div`
  background-image: url(${p => p.image});
  background-position: center center;
  background-size: cover;
  border-radius: 15px;
  cursor: ${p => (p.clickable ? 'pointer' : 'auto')};
  height: 52vw;
  margin-bottom: 10px;
  max-height: ${BANNER_HEIGHT}px;
  position: relative;
  width: 100%;

  ${p => p.width && `
    height: ${p.width * BANNER_RATIO}px;
  `}
`

const Edited = styled(Text)`
  display: block;
  padding-bottom: 12px;
`

const LinkifyText = styled(Linkify)`
  a {
    color: -webkit-link;
    text-decoration: underline;
  }
`

const Message = styled(Paragraph)`
  margin: 13px 0 20px;
  position: relative;
  white-space: pre-line;
`

const PinHeader = styled.div`
  align-items: center;
  border-bottom: 0.45px solid ${colors.gray3}38;
  cursor: pointer;
  display: flex;
  margin-bottom: 20px;
  padding: 12px 0 20px;
`

const Tags = styled(Text)`
  display: inline;
`

const UnpinText = styled(Text)`
  margin-left: 7px;
`

// prettier-ignore
const Video = styled.video`
  border-radius: 15px;
  cursor: ${p => (p.clickable ? 'pointer' : 'auto')};
  height: 52vw;
  max-height: ${BANNER_HEIGHT}px;
  width: 100%;

  ${p => p.width && `
    height: ${p.width * BANNER_RATIO}px;
  `}
`

const VideoOverlay = styled.div`
  align-items: center;
  background-color: ${colors.gray1}30;
  border-radius: 15px;
  display: flex;
  height: 100%;
  justify-content: center;
  position: absolute;
  width: 100%;
`

const ViewAll = styled.div`
  cursor: pointer;
`

const ViewCommentWrapper = styled.div`
  color: ${colors.gray3};
  padding-bottom: 25px;
`

const PostItem = ({
  feedItem,
  getSingle,
  mergeUpdatedFeedItem,
  setActive,
  setReactionsData,
  setSeeMoreComments,
  setShowReactions,
  setViewDetails,
  setViewImage,
  updateSize,
  user,
}) => {
  const {
    authorId,
    authorImg,
    authorName,
    authorTitle,
    banner,
    comments,
    commentCount,
    content,
    createdAt,
    editedAt,
    id,
    isPinned,
    reactions,
    recipients,
  } = feedItem
  const [maxLines, setMaxLines] = useState(getSingle ? 6 : 1000)

  const { setCelebration } = useCelebrationContext()
  const { postingReaction, setPostingReaction } = useReactionsContext()
  const { refreshData } = useRefreshDataContext()

  const announcementParagraphId = uId('post-paragraph')
  // needed to calculate banner image height. can't use a ref due to re-renders...JK
  const bannerNode = document.getElementsByClassName('post-banner')[0]

  const addComment = async comment => {
    const { completedChallenges, rewardProgress } = await postComment(comment, feedItem, mergeUpdatedFeedItem)
    setCelebration({ completeChallenges: completedChallenges, rewardProgress })
  }

  const handleBannerClick = id => {
    if (getSingle) getSingle({ feedId: id })
    if (setViewImage) setViewImage(true)
  }

  const handleComments = () => {
    setViewDetails(true)
    setActive(NEWSFEED_VIEW.COMMENTS)
    setSeeMoreComments({
      component: ListComments,
      props: {
        cta: {
          onClick: () => {
            setViewDetails(false)
            setTimeout(setActive(NEWSFEED_VIEW.DETAILS), 250)
          },
          text: 'Close',
        },
        feedId: id,
        newComments: comments,
        handleBack: () => {
          setActive(NEWSFEED_VIEW.DETAILS)
          if (getSingle) setViewDetails(false)
        },
      },
    })
  }

  const handleMaxLines = number => {
    setMaxLines(number)
    // setTimeout needed to give maxLines time to pass new value to children before recalculating size
    setTimeout(() => {
      updateSize()
    }, 10)
  }

  const handleReactionClick = async reaction => {
    setPostingReaction(true)

    const { completedChallenges, rewardProgress } = await toggleReactions({ feedItem, mergeUpdatedFeedItem, reaction, reactions })
    if (completedChallenges?.length) {
      setCelebration({ completeChallenges: completedChallenges, rewardProgress })
    }

    setPostingReaction(false)
  }

  const handleNewReaction = async reaction => {
    setPostingReaction(true)

    const { completedChallenges, rewardProgress } = await addNewReaction({
      feedItem,
      handleReactionClick,
      mergeUpdatedFeedItem,
      reaction,
      reactions,
    })
    if (completedChallenges?.length) {
      setCelebration({ completeChallenges: completedChallenges, rewardProgress })
    }

    setPostingReaction(false)
  }

  const linkProps = {
    onClick: e => !e.target.href && getSingle && getSingle({ feedId: id }),
    rel: 'noreferrer',
  }

  const dismissedPin = async () => {
    const {
      data: { success },
    } = await coreApi.post('newsfeed/announcements/dismissedAnnouncement', { feedId: id })
    if (success) refreshData({ action: 'removeFeedItem', data: { feedId: id } })
  }

  // added here because there were some scenarios where the parent component mounted before calculating whether card was single or to multiple recipients...JK
  useEffect(() => {
    if (updateSize) updateSize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tagLength = recipients && recipients.length
  const extraTags = tagLength > 1 && ` + ${tagLength - 1} ${recipients.length === 2 ? 'other' : 'others'}`
  // NOTE: We will need to wrap the video into a class so it doesn't flicker when we re-render
  return (
    <ContentWrapper>
      {isPinned && (
        <PinHeader id='unpin-header' onClick={() => dismissedPin()}>
          <Image id='unpin-icon' alt='file upload icon' src={PinIcon} />

          <UnpinText id='unpin-text' color='blurple' fontSize={['14px', '15px']}>
            Dismiss
          </UnpinText>
        </PinHeader>
      )}

      <PeopleTile
        extraInfo={moment(createdAt).fromNow()}
        images={[authorImg]}
        personId={authorId}
        subtitle={authorTitle}
        title={authorName}
      />
      {banner &&
        (banner?.lastIndexOf('.mp4') !== -1 ? (
          <Video
            controls={getSingle ? false : true}
            autoPlay={getSingle ? false : true}
            className='post-banner'
            clickable={Boolean(getSingle) || Boolean(setViewImage)}
            loadedmetadata={() => updateSize && updateSize()}
            onClick={() => getSingle && handleBannerClick(id)}
            onLoad={() => updateSize && updateSize()}
            src={banner}
            width={bannerNode?.clientWidth}
          />
        ) : (
          <BannerImage
            className='post-banner'
            clickable={Boolean(getSingle) || Boolean(setViewImage)}
            image={banner}
            onClick={() => handleBannerClick(id)}
            onLoad={() => updateSize && updateSize()}
            width={bannerNode?.clientWidth}
          >
            {banner.includes('/videoStill/') && (
              <VideoOverlay>
                <Image alt='Video Upload Arrow' src={UploadArrowIcon} />
              </VideoOverlay>
            )}
          </BannerImage>
        ))}
      <Message id={announcementParagraphId} maxLines={maxLines}>
        <Content clickable={Boolean(getSingle)} color='gray1' noClamp onClick={e => linkProps.onClick(e)}>
          <LinkifyText options={{ attributes: linkProps }}>{content}</LinkifyText>
        </Content>
        <SeeMoreText maxLines={maxLines} setMaxLines={handleMaxLines} targetEle={announcementParagraphId} />
        {recipients && recipients.length > 0 && (
          <Tags color='gray3'>
            - with {recipients[0].name}
            {extraTags && extraTags}
          </Tags>
        )}
      </Message>
      {editedAt && <Edited id={uId('edited-post-text')}>(edited)</Edited>}
      <Reactions
        onNewReaction={!postingReaction && handleNewReaction}
        onReactionClick={!postingReaction && handleReactionClick}
        reactions={reactions}
        setReactionsData={setReactionsData}
        setShowReactions={setShowReactions}
      />
      {commentCount > 1 && (
        <ViewCommentWrapper>
          <ViewAll id={uId('view-all-comments')} onClick={() => handleComments()}>
            View all {commentCount} comments
          </ViewAll>
        </ViewCommentWrapper>
      )}
      {comments.map(({ authorId, authorImg, comment, createdAt, name }, i) => (
        <Comment
          authorId={authorId}
          comment={comment}
          createdAt={createdAt}
          image={authorImg}
          key={i}
          name={name}
          updateSize={updateSize}
        />
      ))}
      <AddComment
        addCommentClick={addComment}
        handleChange={() =>
          setTimeout(() => {
            updateSize()
          }, 10)
        }
        image={user?.thumbnailImage}
        personId={user?.id}
        placeholder='Add a comment...'
      />
    </ContentWrapper>
  )
}

PostItem.propTypes = {
  feedItem: PropTypes.object.isRequired,
  getSingle: PropTypes.func,
  mergeUpdatedFeedItem: PropTypes.func,
  setActive: PropTypes.func,
  setReactionsData: PropTypes.func,
  setSeeMoreComments: PropTypes.func,
  setShowReactions: PropTypes.func,
  setShowSeeMore: PropTypes.func,
  setViewDetails: PropTypes.func,
  setViewImage: PropTypes.func,
  updateSize: PropTypes.func,
  user: PropTypes.object,
}

export default PostItem
