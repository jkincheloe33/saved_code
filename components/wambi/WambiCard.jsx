import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors } from '@assets'
import {
  AddComment,
  Comment,
  DetailsTile,
  ListComments,
  Paragraph,
  Reactions,
  RecipientsList,
  SeeMoreText,
  Text,
  WambiBanner,
} from '@components'
import { useCelebrationContext, useLangContext, useProfileContext, useReactionsContext } from '@contexts'
import { addNewReaction, FEED_ITEM_STATUS, LANGUAGE_TYPE, NEWSFEED_VIEW, numberFormatter, postComment, toggleReactions, uId } from '@utils'

const Content = styled.div`
  padding-bottom: 15px;
`

const Edited = styled(Text)`
  display: block;
  padding-top: 15px;
`

const Message = styled(Paragraph)`
  padding-top: 20px;
  position: relative;
  white-space: pre-line;
`

const MessageContent = styled(Text)`
  cursor: ${p => (p.clickable ? 'pointer' : 'auto')};
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

const WambiCard = ({
  feedItem,
  getSingle,
  mergeUpdatedFeedItem,
  setActive,
  setReactionsData,
  setRecipientsData,
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
    banner,
    comments,
    commentCount,
    content,
    createdAt,
    editedAt,
    id,
    reactions,
    recipientCount,
    recipients,
    status,
    type,
  } = feedItem
  const [maxLines, setMaxLines] = useState(getSingle ? 6 : 1000)

  const { setCelebration } = useCelebrationContext()
  const { getAccountLanguage } = useLangContext()
  const { setProfileType, setSelectedProfileId, setShowProfile } = useProfileContext()
  const { postingReaction, setPostingReaction } = useReactionsContext()

  // needed to calculate banner image height. can't use a ref due to re-renders...JK
  const length = recipients.length
  const single = length === 1
  const storycardParagraph = uId('storycard-paragraph')

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
          if (getSingle) setViewDetails(false)
        },
      },
    })
  }

  const handleMaxLines = number => {
    setMaxLines(number)
    // setTimeout needed to give maxLines time to pass new value to children before recalculating size...JK
    if (updateSize) setTimeout(updateSize, 10)
  }

  const handleReactionClick = async reaction => {
    // prevents reaction function from running again when user double clicks...JK
    setPostingReaction(true)

    const { completedChallenges, rewardProgress } = await toggleReactions({ feedItem, mergeUpdatedFeedItem, reaction, reactions })

    setCelebration({ completeChallenges: completedChallenges, rewardProgress })
    setPostingReaction(false)
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

  const handleRecipients = () => {
    if (!single) {
      setViewDetails(true)
      setRecipientsData({
        component: RecipientsList,
        props: {
          cta: {
            // allows you to close the modal mid workflow...JK
            onClick: () => {
              setViewDetails(false)
              setTimeout(() => {
                setActive(NEWSFEED_VIEW.DETAILS)
                setRecipientsData(null)
              }, 250)
            },
            text: 'Close',
          },
          feedId: id,
          handleBack: () => {
            setActive(NEWSFEED_VIEW.DETAILS)
            if (getSingle) setViewDetails(false)
            setTimeout(() => {
              setRecipientsData(null)
            }, 250)
          },
          setActive,
          setViewDetails,
        },
      })
      setActive(NEWSFEED_VIEW.RECIPIENTS)
    } else {
      setProfileType(recipients[0].type)
      setSelectedProfileId(recipients[0].recipientId)
      setShowProfile(true)
      setViewDetails(false)
    }
  }

  // added here because there were some scenarios where the parent component mounted before calculating whether card was single or to multiple recipients...JK
  useEffect(() => {
    if (updateSize) updateSize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Wrapper>
      <DetailsTile
        authorId={authorId}
        authorImg={authorImg}
        authorName={authorName ?? getAccountLanguage(LANGUAGE_TYPE.PATIENT)}
        createdAt={createdAt}
        idPrefix='cpc-card'
        isPrivate={status === FEED_ITEM_STATUS.NON_PUBLIC}
        recipients={recipients}
        recipientCount={recipientCount}
        setViewDetails={setViewDetails}
        type={type}
      />
      <WambiBanner
        banner={banner}
        handleBannerClick={() => handleBannerClick(id)}
        handleRecipients={() => handleRecipients()}
        recipients={recipients}
        recipientCount={recipientCount}
        showCursor={Boolean(getSingle || setViewImage)}
        updateSize={() => updateSize && updateSize()}
      />
      <Content>
        <Message id={storycardParagraph} maxLines={maxLines}>
          <MessageContent clickable={Boolean(getSingle)} color='gray1' noClamp onClick={() => getSingle && getSingle({ feedId: id })}>
            {content}
          </MessageContent>
          <SeeMoreText maxLines={maxLines} setMaxLines={handleMaxLines} targetEle={storycardParagraph} />
        </Message>
        {editedAt && <Edited id={uId('edited-cpc-text')}>(edited)</Edited>}
      </Content>
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

WambiCard.propTypes = {
  feedItem: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  getSingle: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
  mergeUpdatedFeedItem: PropTypes.func,
  setActive: PropTypes.func,
  setReactionsData: PropTypes.func,
  setRecipientsData: PropTypes.func,
  setSeeMoreComments: PropTypes.func,
  setShowReactions: PropTypes.func,
  setViewDetails: PropTypes.func,
  setViewImage: PropTypes.func,
  updateSize: PropTypes.func,
  user: PropTypes.object,
}

export default WambiCard
