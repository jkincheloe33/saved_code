import PropTypes from 'prop-types'
import styled from 'styled-components'
import moment from 'moment'

import { WambiLogo, WambiTagline } from '@assets'
import { Anchor, Avatar, Image, ProfileMenu, Text, Title } from '@components'

const PADDINGY = 25

const Greeting = styled.div`
  margin-left: 15px;
`

const Header = styled.div`
  align-items: center;
  display: flex;
  padding: ${PADDINGY}px 0 ${PADDINGY}px 30px;

  &:last-of-type {
    justify-content: space-between;
    padding-right: 25px;
    padding-top: 40px;
  }
`

const Logo = styled(Image)`
  width: 40px;
`

const Name = styled.div`
  align-items: center;
  display: flex;
`

const SupportLink = styled(Anchor)`
  flex: 0 1 auto;
`

const Tag = styled(Image)`
  width: 100px;
`

const TaglineWrapper = styled.div`
  align-items: center;
  display: flex;
  flex: 1 0 auto;
  margin-right: 5px;
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  overflow: auto;
`

const SideBar = ({ image, name, setShowCollectReviews, setShowFeedbackWorkflow, setShowProfileApproval, setShowVerifyPassword }) => {
  const getWelcomeText = () => {
    const now = moment()
    const morning = moment('00:00', 'h:mm')
    const afternoon = moment('12:00', 'h:mm')
    const evening = moment('17:00', 'h:mm')

    if (now.isBetween(morning, afternoon)) return 'Good Morning,'
    if (now.isBetween(afternoon, evening)) return 'Good Afternoon,'
    return 'Good Evening,'
  }

  return (
    <Wrapper>
      <Header>
        <Avatar alt='avatar image' image={image.src} ratio='60px' shadow />
        <Greeting>
          <Text color='blurple'>{getWelcomeText()}</Text>
          <Name>
            <Title fontSize='23px' id='header-name'>
              {name}
            </Title>
          </Name>
        </Greeting>
      </Header>
      <ProfileMenu
        setShowCollectReviews={setShowCollectReviews}
        setShowFeedbackWorkflow={setShowFeedbackWorkflow}
        setShowProfileApproval={setShowProfileApproval}
        setShowVerifyPassword={setShowVerifyPassword}
      />
      <Header>
        <TaglineWrapper>
          <Logo src={WambiLogo} />
          <Tag src={WambiTagline} />
        </TaglineWrapper>
        <SupportLink
          color='gray1'
          fontSize='14px'
          id='sidebar-terms-of-use-link'
          link='https://wambi.org/privacy-policy/'
          noClamp
          rel='noopener noreferrer'
          target='_blank'
          text='Terms of Service & Privacy Policy'
        />
      </Header>
    </Wrapper>
  )
}

SideBar.propTypes = {
  image: PropTypes.shape({
    alt: PropTypes.string,
    src: PropTypes.string,
  }),
  name: PropTypes.string,
  setShowCollectReviews: PropTypes.func,
  setShowFeedbackWorkflow: PropTypes.func,
  setShowProfileApproval: PropTypes.func,
  setShowVerifyPassword: PropTypes.func,
}

export default SideBar
