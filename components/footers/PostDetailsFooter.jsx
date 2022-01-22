import PropTypes from 'prop-types'
import styled from 'styled-components'

import { AddReactionIcon, colors, LeftArrowFillIcon, MessageIcon, RightArrowFillIcon } from '@assets'
import { RoundButton } from '@components'

const Button = styled(RoundButton)`
  margin: 0 15px;
`

const Wrapper = styled.div`
  align-items: center;
  display: flex;
  justify-content: center;
`

const PostDetailsFooter = ({ handleBack, handleForward }) => (
  <Wrapper>
    {handleBack && (
      <Button
        background={colors.white}
        image={{ alt: 'left arrow icon', src: LeftArrowFillIcon }}
        onClick={handleBack}
        ratio={'45px'}
        shadow
        small
      />
    )}
    <Button image={{ alt: 'send message icon', src: MessageIcon }} ratio={'45px'} shadow small />
    <Button iconWidth='25px' image={{ alt: 'add reaction icon', src: AddReactionIcon }} ratio={'45px'} shadow small />
    {handleForward && (
      <Button
        background={colors.white}
        image={{ alt: 'right arrow icon', src: RightArrowFillIcon }}
        onClick={handleForward}
        ratio={'45px'}
        small={true}
        shadow
      />
    )}
  </Wrapper>
)

PostDetailsFooter.propTypes = {
  handleBack: PropTypes.func,
  handleForward: PropTypes.func,
}

export default PostDetailsFooter
