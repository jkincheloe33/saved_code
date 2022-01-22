import { useState } from 'react'
import moment from 'moment'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, multiplier } from '@assets'
import {
  AddComment,
  Comment,
  DetailsTile,
  ListComments,
  Paragraph,
  PeopleTile as PeopleTileBase,
  Reactions,
  SeeMoreText,
  Text,
  WambiBanner,
} from '@components'
import { useCelebrationContext, useLangContext, useReactionsContext } from '@contexts'
import { addNewReaction, LANGUAGE_TYPE, NEWSFEED_VIEW, numberFormatter, postComment, toggleReactions, uId } from '@utils'

const Content = styled.div`
  padding-top: ${multiplier * 2}px;
`

const Message = styled(Paragraph)`
  position: relative;
  white-space: pre-line;
`

const MessageContent = styled(Text)`
  cursor: ${p => (p.clickable ? 'pointer' : 'auto')};
`

const P = styled(Paragraph)`
  padding-top: ${multiplier * 2}px;
`

const PeopleTile = styled(PeopleTileBase)`
  margin: 0;
`

const SharedCard = styled.div`
  pointer-events: none;
`

const SharedWrapper = styled.div`
  border: 0.5px solid ${colors.gray5};
  border-radius: 20px;
  cursor: pointer;
  margin: ${multiplier * 2}px 0;
  padding: ${multiplier * 2}px;
`

const ViewAll = styled.div`
  cursor: pointer;
  padding-bottom: 25px;
`

const ViewCommentWrapper = styled.div`
  color: ${colors.gray3};
  padding: 15px 0 0;
`

const Wrapper = styled.div`
  padding: 20px;
`

const ShareWambiItem = ({
  blockGetSingle = false,
  feedItem,
  getSingle,
  mergeUpdatedFeedItem,
  setActive,
  setReactionsData,
  setSeeMoreComments,
  setShowReactions,
  setViewDetails,
  updateSize,
  user,
}) => {
  const [maxLines, setMaxLines] = useState(getSingle ? 6 : 1000)

  const { setCelebration } = useCelebrationContext()
  const { getAccountLanguage } = useLangContext()
  const { postingReaction, setPostingReaction } = useReactionsContext()

  const { authorId, authorImg, authorName, authorTitle, comments, commentCount, content, createdAt, id, linkedFeedItem, reactions } = {
    ...feedItem,
  }
  const shareCardParagraph = uId('sharecard-paragraph')

  const addComment = async comment => {
    const { completedChallenges, rewardProgress } = await postComment(comment, feedItem, mergeUpdatedFeedItem)
    setCelebration({ completeChallenges: completedChallenges, rewardProgress })
  }

  const handleComments = () => {
    setViewDetails(true)
    setActive(NEWSFEED_VIEW.COMMENTS)
    setSeeMoreComments({
      component: ListComments,
      props: {
        cta: {
          // allows you to close the modal mid workflow...JK
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
          if (!blockGetSingle && getSingle) setViewDetails(false)
        },
      },
    })
  }

  const handleMaxLines = number => {
    setMaxLines(number)
    // setTimeout needed to give maxLines time to pass new value to children before recalculating size...JK
    if (updateSize) setTimeout(updateSize, 10)
  }

  const handleNewReaction = async reaction => {
    // prevents reaction function from running again when user double clicks...JK
    setPostingReaction(true)

    const { completedChallenges, rewardProgress } = await addNewReaction({
      feedItem,
      handleReactionClick,
      mergeUpdatedFeedItem,
      reaction,
      reactions,
    })

    setCelebration({ completeChallenges: completedChallenges, rewardProgress })
    setPostingReaction(false)
  }

  const handleReactionClick = async reaction => {
    // prevents reaction function from running again when user double clicks...JK
    setPostingReaction(true)

    const { completedChallenges, rewardProgress } = await toggleReactions({ feedItem, mergeUpdatedFeedItem, reaction, reactions })

    setCelebration({ completeChallenges: completedChallenges, rewardProgress })
    setPostingReaction(false)
  }

  return (
    <Wrapper>
      <PeopleTile
        extraInfo={moment(createdAt).fromNow()}
        images={[authorImg]}
        personId={authorId}
        subtitle={authorTitle}
        title={authorName}
      />
      {content && (
        <Content>
          <Message id={shareCardParagraph} maxLines={maxLines}>
            <MessageContent
              clickable={Boolean(!blockGetSingle && getSingle)}
              color='gray1'
              noClamp
              onClick={() => !blockGetSingle && getSingle && getSingle({ feedId: id })}
            >
              {content}
            </MessageContent>
            <SeeMoreText maxLines={maxLines} setMaxLines={handleMaxLines} targetEle={shareCardParagraph} />
          </Message>
        </Content>
      )}
      {linkedFeedItem && (
        <SharedWrapper onClick={() => getSingle && getSingle({ feedId: linkedFeedItem.id })}>
          <SharedCard>
            <DetailsTile
              authorId={linkedFeedItem.authorId}
              authorImg={linkedFeedItem.authorImg}
              authorName={linkedFeedItem.authorName ?? getAccountLanguage(LANGUAGE_TYPE.PATIENT)}
              createdAt={linkedFeedItem.createdAt}
              idPrefix='original-share-cpc'
              recipients={linkedFeedItem.recipients}
              recipientCount={linkedFeedItem.recipientCount}
              type={linkedFeedItem.type}
            />
            <WambiBanner
              banner={linkedFeedItem.banner}
              recipients={linkedFeedItem.recipients}
              recipientCount={linkedFeedItem.recipientCount}
            />
            <P maxLines={3}>{linkedFeedItem.content}</P>
          </SharedCard>
        </SharedWrapper>
      )}
      <Reactions
        // !postingReaction prevents function from running again when user double clicks...JK
        onNewReaction={!postingReaction && handleNewReaction}
        onReactionClick={!postingReaction && handleReactionClick}
        reactions={reactions}
        setReactionsData={setReactionsData}
        setShowReactions={setShowReactions}
      />
      <ViewCommentWrapper>
        {commentCount > 1 && (
          <ViewAll id={uId('view-all-comments')} onClick={() => handleComments()}>
            View all {numberFormatter(commentCount)} comments
          </ViewAll>
        )}
      </ViewCommentWrapper>
      {comments.map(({ authorId, authorImg, comment, createdAt, name }, i) => (
        <Comment
          authorId={authorId}
          comment={comment}
          createdAt={createdAt}
          image={authorImg}
          key={i}
          name={name}
          updateSize={updateSize}
          setViewDetails={setViewDetails}
        />
      ))}
      <AddComment
        addCommentClick={addComment}
        handleChange={() => updateSize && setTimeout(updateSize, 10)}
        image={user?.thumbnailImage}
        personId={user?.id}
        placeholder='Add a comment...'
        setViewDetails={setViewDetails}
      />
    </Wrapper>
  )
}

ShareWambiItem.propTypes = {
  blockGetSingle: PropTypes.bool,
  feedItem: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  getSingle: PropTypes.func,
  mergeUpdatedFeedItem: PropTypes.func,
  setActive: PropTypes.func,
  setBoostersData: PropTypes.func,
  setReactionsData: PropTypes.func,
  setRecipientsData: PropTypes.func,
  setSeeMoreComments: PropTypes.func,
  setShowReactions: PropTypes.func,
  setViewDetails: PropTypes.func,
  setViewImage: PropTypes.func,
  updateSize: PropTypes.func,
  user: PropTypes.object,
  viewDetails: PropTypes.bool,
}

export default ShareWambiItem
