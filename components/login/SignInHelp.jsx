import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, MagicLink, multiplier } from '@assets'
import { Anchor, DynamicContainer, Image, Input, Layout, Loader, PillButton, Text, Title } from '@components'
import { useAuthContext } from '@contexts'
import { formatMobile, isValidEmail, isValidUSPhoneNumber } from '@utils'

const LoaderWrapper = styled.div`
  align-items: center;
  background-color: ${colors.white}D9;
  display: flex;
  height: 100%;
  justify-content: center;
  left: 0;
  opacity: ${p => p.loading};
  pointer-events: ${p => (p.loading ? 'auto' : 'none')};
  position: fixed;
  top: 0;
  transition: opacity 250ms ease;
  width: 100%;
  z-index: 5;
`

const StyledText = styled(Text)`
  margin-bottom: ${multiplier * 3}px;
`

const StyledTitle = styled(Title)`
  margin-left: ${multiplier * 2}px;
`

const SupportLink = styled(Anchor)`
  margin-top: ${multiplier * 5}px;
  text-align: center;
`

const TitleWrapper = styled.div`
  align-items: center;
  display: flex;
`

const ToggleText = styled(Text)`
  cursor: pointer;
  margin-bottom: ${multiplier * 3}px;
`

const Wrapper = styled(DynamicContainer)`
  display: flex;
  flex-direction: column;
  padding: ${multiplier * 6}px ${multiplier * 3}px;
`

const SignInHelp = ({
  cta,
  email,
  handleBack,
  handleSendCode,
  mobile,
  setActive,
  setEmail,
  setMobile,
  setSubmitting,
  signInHelpScreens,
  submitting,
}) => {
  const { clientAccount } = useAuthContext()

  const [activeInput, setActiveInput] = useState('email')
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
  }, [email, mobile])

  const handleSubmit = async e => {
    e?.preventDefault()
    setSubmitting(true)

    const { msg, success } = await handleSendCode()

    if (success) setActive(signInHelpScreens.VERIFY_CODE)
    else setError(msg)

    setSubmitting(false)
  }

  const toggleInput = () => {
    if (activeInput === 'email') {
      setActiveInput('mobile')
      setEmail('')
    } else {
      setActiveInput('email')
      setMobile('')
    }
  }

  return (
    <Layout
      cta={cta}
      handleBack={() => {
        handleBack()
        setEmail('')
        setError('')
        setMobile('')
      }}
      id='sign-in-help'
      inner
      noFooter
      title='Sign in with a code'
    >
      <Wrapper>
        <TitleWrapper>
          <Image alt='Magic Link' src={MagicLink} width='56px' />
          <StyledTitle fontSize='18px'>We&apos;ll send you a code to sign in</StyledTitle>
        </TitleWrapper>
        <form onSubmit={handleSubmit}>
          {activeInput === 'email' && (
            <Input
              border
              label='Enter email'
              onChange={e => setEmail(e.target.value)}
              showLabel
              spacing={`${multiplier * 3}px 0`}
              value={email}
            />
          )}
          {activeInput === 'mobile' && (
            <Input
              border
              label='Enter mobile number'
              onChange={e => setMobile(formatMobile(e.target.value))}
              showLabel
              spacing={`${multiplier * 3}px 0`}
              type='tel'
              value={mobile}
            />
          )}
          <ToggleText color='blurple' fontWeight={700} id='input-toggle-text' onClick={toggleInput}>
            Use {activeInput === 'email' ? 'mobile number' : 'email'} instead
          </ToggleText>
          {error && (
            <StyledText color='berry' fontSize='14px' fontWeight={700}>
              {error}
            </StyledText>
          )}
          <PillButton
            disabled={!((isValidEmail(email) && !mobile) || (isValidUSPhoneNumber(mobile) && !email))}
            id='sign-in-help-send-code-btn'
            text='Send a code'
            thin
            type='submit'
          />
        </form>
        <SupportLink
          color='blurple'
          fontWeight={700}
          id='sign-in-help-support-link'
          link={clientAccount?.settings?.helpSupportUrl}
          rel='noreferrer'
          target='_blank'
          text="I've tried this - ask for support."
        />
      </Wrapper>
      <LoaderWrapper loading={submitting ? 1 : 0}>
        <Loader />
      </LoaderWrapper>
    </Layout>
  )
}

SignInHelp.propTypes = {
  cta: PropTypes.object,
  email: PropTypes.string,
  handleBack: PropTypes.func.isRequired,
  handleSendCode: PropTypes.func.isRequired,
  mobile: PropTypes.string,
  setActive: PropTypes.func.isRequired,
  setEmail: PropTypes.func,
  setMobile: PropTypes.func,
  setSubmitting: PropTypes.func,
  signInHelpScreens: PropTypes.object.isRequired,
  submitting: PropTypes.bool,
}

export default SignInHelp
