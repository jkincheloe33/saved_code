import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, ConfirmationBG } from '@assets'

import { Image, PillButton, Text } from '@components'

const ChildrenWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 18px;
  text-align: center;
  width: 70%;
`

const Header = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
`

const StyledImage = styled(Image)`
  margin-bottom: 2rem;
`

const Wrapper = styled.div`
  align-items: center;
  background: url(${ConfirmationBG}) no-repeat;
  background-color: ${colors.blurple};
  background-size: cover;
  display: flex;
  flex-direction: column;
  height: 100vh;
  // for IOS Mobile to account for navigation bars...JK
  height: -webkit-fill-available;
  justify-content: space-evenly;
`

const ConfirmationPage = ({ buttonText = 'Done', children, icon, onClick, text }) => {
  return (
    <Wrapper>
      <Header>
        <StyledImage alt={text} src={icon} />
        <Text color='white' fontSize={'24px'} fontWeight={700}>
          {text}
        </Text>
        <ChildrenWrapper>{children}</ChildrenWrapper>
      </Header>
      <PillButton id='confirmation-btn' inverted onClick={onClick} text={buttonText} />
    </Wrapper>
  )
}

ConfirmationPage.propTypes = {
  buttonText: PropTypes.string.isRequired,
  children: PropTypes.any,
  icon: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  text: PropTypes.string.isRequired,
}

export default ConfirmationPage
