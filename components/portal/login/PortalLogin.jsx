import { useState } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

import { devices } from '@assets'

import { Container, Intro, PortalLayout, ScreenNavigation, SendCodeForm, Title, VerifyCodeForm } from '@components'
import { useLangContext, useReviewerContext } from '@contexts'

const DesktopBackButtonContainer = styled.div`
  margin-top: 30px;
`

const Subtitle = styled(Title)`
  font-size: 12px;

  @media (${devices.tablet}) {
    font-size: 16px;
  }
`

const PortalLogin = ({ portalScreens, setActive }) => {
  const { getText } = useLangContext()
  const { setReviewer } = useReviewerContext()

  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [showVerificationPage, setShowVerificationPage] = useState(false)

  const onSendCodeSuccess = async ({ email, mobile, reviewer }) => {
    setMobile(mobile)
    setEmail(email)
    setReviewer(reviewer)
    setShowVerificationPage(true)
  }

  const onVerifyCodeSuccess = async reviewer => {
    setActive(portalScreens.PERSON)
    setReviewer(reviewer)
  }

  return (
    <PortalLayout handleStartOver={() => setActive(portalScreens.LOCATION)}>
      <Container>
        <Intro squiggly='right' text={getText('Recognize the people who')} text2={getText('impacted your experience')} />
        {!showVerificationPage && <Subtitle color='brightPurple'>{getText('Receive a 4-digit security code to begin')}</Subtitle>}
        {showVerificationPage ? (
          <VerifyCodeForm email={email} mobile={mobile} onSuccess={onVerifyCodeSuccess} />
        ) : (
          <SendCodeForm onSuccess={onSendCodeSuccess} />
        )}
        <DesktopBackButtonContainer>
          <ScreenNavigation
            onClick={() => {
              if (showVerificationPage) {
                setShowVerificationPage(show => !show)
              } else {
                setActive(portalScreens.LOCATION)
              }
            }}
            text={getText('BACK')}
          />
        </DesktopBackButtonContainer>
      </Container>
    </PortalLayout>
  )
}

PortalLogin.propTypes = {
  portalScreens: PropTypes.object,
  setActive: PropTypes.func,
}

export default PortalLogin
