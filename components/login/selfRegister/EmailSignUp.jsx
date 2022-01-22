import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import ReactMarkdown from 'react-markdown'
import gfm from 'remark-gfm'
import styled from 'styled-components'

import { multiplier } from '@assets'
import { Anchor, Banner, DynamicContainer, Input, Layout, PillButton, Select, Text, Title } from '@components'
import { useAuthContext, useLangContext } from '@contexts'
import { LANGUAGE_TYPE } from '@utils'

const BannerInnerWrapper = styled.div`
  padding: 0 ${multiplier * 2}px;
`

const ContinueButton = styled(PillButton)`
  margin: ${multiplier * 2}px 0 ${multiplier * 6}px;
`

const DomainSelect = styled(Select)`
  border-radius: 40px;
`

const EmailInput = styled(Input)`
  transform: translateY(-${multiplier * 2}px);
`

const EmailWrapper = styled.div`
  align-items: center;
  display: flex;
  margin: ${multiplier * 6}px 0 ${multiplier * 4}px;
`

const ErrorMessage = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${multiplier * 2}px;
  text-align: center;
`

const Wrapper = styled(DynamicContainer)`
  display: flex;
  flex-direction: column;
  padding: ${multiplier * 6}px ${multiplier * 3}px;

  ${Title} {
    margin-top: ${multiplier}px;
  }
`

const EmailSignUp = ({ handleBack, handleSendCode, selfRegisterScreens, setActive, setEmail, setLoading }) => {
  const { clientAccount } = useAuthContext()
  const { getAccountLanguage } = useLangContext()

  const emailDomains = clientAccount?.settings?.selfRegister?.emailDomains?.split(',') ?? []

  const [domain, setDomain] = useState(emailDomains[0])
  const [error, setError] = useState('')
  const [username, setUsername] = useState('')

  useEffect(() => {
    setError('')
  }, [domain, username])

  const handleContinue = async () => {
    setLoading(true)
    const email = `${username}@${domain}`

    const { msg, success } = await handleSendCode(email)

    if (success) {
      setEmail(email)
      setActive(selfRegisterScreens.VERIFY_CODE)
    } else {
      setError(msg)
    }
    setLoading(false)
  }

  return (
    <Layout handleBack={handleBack} inner noFooter title='Sign Up'>
      <Wrapper>
        <Title fontSize='18px'>Please enter your email</Title>
        <Title fontSize='16px' fontWeight={400}>
          You will need to verify your information
        </Title>
        <EmailWrapper>
          <EmailInput
            border
            label='Email address'
            onChange={e => setUsername(e.target.value)}
            showLabel
            spacing={`0 ${multiplier}px 0 0`}
            value={username}
          />
          <DomainSelect
            name='emailDomains'
            onChange={e => setDomain(e.target.value)}
            options={emailDomains.map(d => ({ name: `@${d.trim()}`, value: d.trim() })) ?? []}
            value={domain}
          />
        </EmailWrapper>
        {error && (
          <ErrorMessage>
            <Text color='berry'>{error}</Text>
            <Anchor color='blurple' fontWeight={700} id='self-registered-user-sign-up' onClick={handleBack} text='Return to sign in' />
          </ErrorMessage>
        )}
        <ContinueButton
          disabled={!username || !domain || !!error.length}
          full
          id='verify-self-register-email'
          onClick={handleContinue}
          text='Continue'
          thin
        />
        <Banner title="What's this?">
          <BannerInnerWrapper>
            <ReactMarkdown remarkPlugins={[gfm]}>{getAccountLanguage(LANGUAGE_TYPE.WHAT_IS_A_SELF_REGISTERED_USER)}</ReactMarkdown>
          </BannerInnerWrapper>
        </Banner>
      </Wrapper>
    </Layout>
  )
}

EmailSignUp.propTypes = {
  handleBack: PropTypes.func.isRequired,
  handleSendCode: PropTypes.func.isRequired,
  selfRegisterScreens: PropTypes.object,
  setActive: PropTypes.func,
  setEmail: PropTypes.func,
  setLoading: PropTypes.func,
}

export default EmailSignUp
