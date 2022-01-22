import PropTypes from 'prop-types'
import styled from 'styled-components'

import { devices, Squiggly } from '@assets'
import { Image, Title } from '@components'

const StyledTitle = styled(Title)`
  font-size: 24px;
  transition: 500ms all ease;
  white-space: nowrap;

  @media (${devices.mobile}) {
    font-size: 28px;
  }

  @media (${devices.tablet}) {
    font-size: 50px;
  }
`

const ImageContainer = styled.div`
  display: flex;
  justify-content: ${props => (props.squiggly === 'left' ? 'flex-start' : 'flex-end')};
  transform: ${props => (props.squiggly === 'left' ? 'translateX(-25px)' : 'translateX(0)')};
`

const SquigglyImg = styled(Image)`
  height: 36px;
  width: 136px;
  @media (${devices.tablet}) {
    height: initial;
    width: initial;
  }
`

const Intro = ({ squiggly, text, text2 }) => {
  return (
    <div>
      <StyledTitle color='darkBlue'>{text}</StyledTitle>
      {text2 && <StyledTitle color='darkBlue'>{text2}</StyledTitle>}
      {squiggly && (
        <ImageContainer squiggly={squiggly}>
          <SquigglyImg alt='Squiggly' src={Squiggly} />
        </ImageContainer>
      )}
    </div>
  )
}

Intro.propTypes = {
  squiggly: PropTypes.string,
  text: PropTypes.string,
  text2: PropTypes.string,
}

export default Intro
