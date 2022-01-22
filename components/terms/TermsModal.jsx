import { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { devices, shadows } from '@assets'
import { Anchor, Checkbox, CtaFooter, DynamicContainer, Layout, Modal, PillButton, Terms, Text } from '@components'
import { useAuthContext, useLangContext, useUserContext } from '@contexts'
import { LANGUAGE_TYPE } from '@utils'

const AcceptTermsRow = styled.div`
  display: flex;
  margin-top: 20px;

  ${Text} {
    display: inline;
  }
`

const Container = styled(DynamicContainer)`
  padding: 0 0 50px;

  @media (${devices.tablet}) {
    padding: ${p => (p.isPortal ? '0 0 70px' : '0 0 20px')};
  }
`

const MyModal = styled(Modal)`
  ${p =>
    p.isPortal &&
    `overflow: hidden;

  > div {
    border-radius: 20px;
    box-shadow: ${shadows.card};
    height: 100%;
    margin-bottom: 100px;
    padding-bottom: 50px;

    @media (${devices.largeMobile}) {
      margin-bottom: 170px;
    }

    @media (${devices.tablet}) {
      height: 780px;
      margin-bottom: 0;
      padding-bottom: 0;
      width: 763px;
    }
  }`}
`

const TermsModal = ({ acceptTerms, isNested = false, isPortal = false, showTerms }) => {
  const { clientAccount } = useAuthContext()
  const { getAccountLanguage } = useLangContext()
  const { user } = useUserContext()

  const [acceptedClientTerms, setAcceptedClientTerms] = useState(Boolean(user?.clientTermsAt))
  const [acceptedSelfRegisterTerms, setAcceptedSelfRegisterTerms] = useState(Boolean(user?.selfRegisterTermsAcceptedAt))
  const [scrolledToBottom, setScrolledToBottom] = useState(false)

  return (
    <MyModal animationType='slideUp' isNested={isNested} isPortal={isPortal} open={showTerms} small={isPortal}>
      <Layout id='accept-terms' inner isPortal={isPortal} noFooter noHeader>
        <Container isPortal={isPortal} noScroll>
          <Terms full setScrolledToBottom={setScrolledToBottom}>
            {clientAccount?.clientTermsUrl && !isPortal && (
              <AcceptTermsRow>
                <Checkbox
                  checked={acceptedClientTerms}
                  id='client-terms-checkbox'
                  onChange={() => setAcceptedClientTerms(act => !act)}
                  spacing='0 10px 0 0'
                />
                <Text color='gray1'>
                  I accept the {clientAccount?.name}{' '}
                  <Anchor
                    color='blurple'
                    link={clientAccount?.clientTermsUrl}
                    onClick={() => setAcceptedClientTerms(true)}
                    target='_blank'
                    text='Terms of Service'
                  />
                </Text>
              </AcceptTermsRow>
            )}
            {clientAccount?.selfRegisterTermsUrl && user?.isSelfRegistered === 1 && !isPortal && (
              <AcceptTermsRow>
                <Checkbox
                  checked={acceptedSelfRegisterTerms}
                  id='self-register-terms-checkbox'
                  onChange={() => setAcceptedSelfRegisterTerms(asrt => !asrt)}
                  spacing='0 10px 0 0'
                />
                <Text color='gray1'>
                  I accept the {clientAccount?.name}{' '}
                  <Anchor
                    color='blurple'
                    link={clientAccount?.selfRegisterTermsUrl}
                    onClick={() => setAcceptedSelfRegisterTerms(true)}
                    target='_blank'
                    text={`${getAccountLanguage(LANGUAGE_TYPE.SELF_REGISTERED_USER)} Terms of Service`}
                  />
                </Text>
              </AcceptTermsRow>
            )}
          </Terms>
        </Container>
        <CtaFooter>
          <PillButton
            disabled={
              !scrolledToBottom ||
              (clientAccount?.clientTermsUrl && !acceptedClientTerms && !isPortal) ||
              (user?.isSelfRegistered && clientAccount?.selfRegisterTermsUrl && !acceptedSelfRegisterTerms && !isPortal)
            }
            full
            id='accept-terms-btn'
            onClick={acceptTerms}
            text='I accept'
          />
        </CtaFooter>
      </Layout>
    </MyModal>
  )
}

TermsModal.propTypes = {
  acceptTerms: PropTypes.func.isRequired,
  isNested: PropTypes.bool,
  isPortal: PropTypes.bool,
  showTerms: PropTypes.bool.isRequired,
}

export default TermsModal
