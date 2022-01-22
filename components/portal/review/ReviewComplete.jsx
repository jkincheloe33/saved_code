import PropTypes from 'prop-types'
import styled from 'styled-components'

import { devices, ReviewCompleteImage } from '@assets'
import { Container, Image, Intro, PillButton, PortalLayout, Title } from '@components'
import { useLangContext } from '@contexts'

const Asset = styled(Image)`
  margin-bottom: -3.5rem;
`

const DonationButton = styled(PillButton)`
  margin-top: 20px;
`

const Subtitle = styled(Title)`
  margin: 1rem 0 2rem 0;
  text-align: center;

  @media (${devices.tablet}) {
    font-size: 16px;
  }
`

const ReviewCompletePage = ({ donationLink, portalScreens, setActive }) => {
  const { getText } = useLangContext()

  return (
    <PortalLayout handleStartOver={() => setActive(portalScreens.LOCATION)}>
      <Container>
        <Intro squiggly='left' text={getText('Grateful for you!')} />
        <Subtitle color='brightPurple' fontSize='12px'>
          {getText('Thank you! Your response')}
          <br />
          {getText('has been submitted.')}
        </Subtitle>
        <Asset alt='Person with heart' src={ReviewCompleteImage} />
        <PillButton id='review-complete-btn' onClick={() => setActive(portalScreens.PERSON)} text={getText('DONE')} />
        {donationLink && (
          <DonationButton
            id='donate-btn'
            inverted
            link={donationLink}
            rel='noopener noreferrer'
            target='_blank'
            text={getText('DONATE A GIFT OF GRATITUDE')}
          />
        )}
      </Container>
    </PortalLayout>
  )
}

ReviewCompletePage.propTypes = {
  donationLink: PropTypes.string,
  portalScreens: PropTypes.object,
  setActive: PropTypes.func,
}

export default ReviewCompletePage
