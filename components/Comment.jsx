import { useState } from 'react'
import PropTypes from 'prop-types'
import moment from 'moment-shortformat'
import styled from 'styled-components'

import { colors } from '@assets'
import { Avatar, Paragraph, SeeMoreText, Text } from '@components'
import { uId } from '@utils'

const CommentorAvatar = styled(Avatar)`
  margin-right: 5.5px;
`

const CommentBubble = styled.div`
  display: flex;
  margin-bottom: 30px;
`

const CommentInfo = styled.div`
  align-items: center;
  display: flex;
`

const CommentorName = styled(Text)`
  margin-right: 5px;
`

const CommentParagraph = styled(Paragraph)`
  position: relative;
`

const TextWrapper = styled.div`
  background-color: ${colors.gray8};
  border-radius: 20px;
  display: flex;
  flex: 1;
  flex-direction: column;
  font-size: 15px;
  font-weight: 400;
  max-width: 85%;
  padding: 7.5px 17px;
  position: relative;
  white-space: pre-line;
  width: 100%;
  word-wrap: break-word;
`

const TimeAgo = styled(Text)`
  flex: 0 0 auto;
`

const Comment = ({ authorId, className, comment, createdAt, image, name, updateSize, setViewDetails }) => {
  const [maxLines, setMaxLines] = useState(3)
  const commentId = uId('comment')

  const handleMaxLines = number => {
    setMaxLines(number)
    // setTimeout needed to give maxLines time to pass new value to children before recalculating size...JK
    if (updateSize) setTimeout(updateSize, 10)
  }

  return (
    <CommentBubble className={className}>
      <CommentorAvatar image={image} personId={authorId} ratio={'40px'} setViewDetails={setViewDetails} />
      <TextWrapper>
        <CommentInfo>
          <CommentorName color='gray1' fontWeight={700} id={uId('author-name')}>
            {name}
          </CommentorName>
          <TimeAgo>{moment(createdAt).short(true)}</TimeAgo>
        </CommentInfo>
        <CommentParagraph color='gray2' id={commentId} maxLines={maxLines}>
          {comment}
          <SeeMoreText
            backgroundColor={colors.gray8}
            color='gray2'
            maxLines={maxLines}
            setMaxLines={handleMaxLines}
            targetEle={commentId}
          />
        </CommentParagraph>
      </TextWrapper>
    </CommentBubble>
  )
}

Comment.propTypes = {
  authorId: PropTypes.number,
  className: PropTypes.string,
  comment: PropTypes.string,
  createdAt: PropTypes.string,
  image: PropTypes.string,
  name: PropTypes.string,
  updateSize: PropTypes.func,
  setViewDetails: PropTypes.func,
}

export default Comment
