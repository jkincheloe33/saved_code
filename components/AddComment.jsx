import { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, MessageIcon } from '@assets'
import { Avatar, RoundButton, TextArea } from '@components'
import { uId } from '@utils'

const Comment = styled(RoundButton)`
  button {
    padding: 0 9px;
  }
`

const CommentWrapper = styled.div`
  display: flex;
  flex-direction: column-reverse;
`

const Person = styled(Avatar)`
  margin-right: 5.5px;
`

const TextWrapper = styled.div`
  background-color: ${colors.gray8};
  border-radius: 20px;
  display: flex;
  flex: 1;
  font-size: 15px;
  font-weight: 400;
  min-height: 45px;
  padding: 7.5px 5.5px 7.5px 17px;
  position: relative;
  width: 100%;
`

const Wrapper = styled.div`
  align-items: center;
  display: flex;
`

const AddComment = ({ addCommentClick, handleChange, image, personId, placeholder, setViewDetails }) => {
  const [comment, setComment] = useState('')

  const handleSubmit = e => {
    e?.preventDefault()

    if (comment) {
      setComment('')
      addCommentClick(comment)
    }
  }

  const onChange = e => {
    setComment(e.target.value)
    if (handleChange) handleChange()
  }

  return (
    <Wrapper>
      <Person image={image} personId={personId} ratio='40px' setViewDetails={setViewDetails} />
      <TextWrapper>
        <TextArea
          grow
          id={uId('add-comment-input')}
          onChange={onChange}
          onSubmit={handleSubmit}
          placeholder={placeholder}
          value={comment}
        />
        <CommentWrapper>
          {comment.length > 0 && (
            <Comment
              id={uId('add-comment-button')}
              image={{ alt: 'Add comment button', src: MessageIcon }}
              onClick={handleSubmit}
              ratio='30px'
              shadow
            />
          )}
        </CommentWrapper>
      </TextWrapper>
    </Wrapper>
  )
}

AddComment.propTypes = {
  addCommentClick: PropTypes.func.isRequired,
  handleChange: PropTypes.func,
  image: PropTypes.string,
  personId: PropTypes.number,
  placeholder: PropTypes.string,
  setViewDetails: PropTypes.func,
}

export default AddComment
