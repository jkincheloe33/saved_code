import { useState } from 'react'
import OtpInput from 'react-otp-input'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { api } from '@services'

import { colors } from '@assets'
import { Anchor, Card, DynamicContainer, Layout, Loader, PillButton, Text as TextBase } from '@components'
import { useCelebrationContext } from '@contexts'
import { formatUSPhoneNumber, useStore } from '@utils'

const CardWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  margin-bottom: 30px;
  width: 100%;
`

const Content = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  padding: 0 30px;
`

const Message = styled(TextBase)`
  height: 20px;
  margin-top: 20px;
`

// prettier-ignore
const InputWrapper = styled(Card)`
  margin: 30px 0 10px;
  max-width: 500px;
  padding: 30px 35px 20px;
  transition: background-color 250ms ease;

  .otpInputStyle {
    border: none;
    border-bottom: 2px solid ${colors.black};
    border-radius: 0px;
    background-color: transparent;
    color: ${colors.gray1};
    font-size: 36px;
    padding: 0px;
    text-align: center;
    transition: none;

    &:focus {
      outline: none;
    }
  }

  ${p => p.error && `
    background-color: ${colors.berry}33;
  `}
`

const otpContainerStyle = {
  caretColor: 'transparent',
  display: 'flex',
  justifyContent: 'space-between',
}

const SendAgain = styled(Anchor)`
  margin-top: 20px;
`

const Submit = styled(PillButton)`
  margin-bottom: 50px;
`

const Submitting = styled.div`
  align-items: center;
  background-color: ${colors.white}D9;
  display: flex;
  height: 100%;
  justify-content: center;
  left: 0;
  opacity: ${p => (p.submitting ? 1 : 0)};
  pointer-events: ${p => (p.submitting ? 'auto' : 'none')};
  position: fixed;
  top: 0;
  transition: opacity 250ms ease;
  width: 100%;
  z-index: 5;
`

const Title = styled(TextBase)`
  margin-bottom: 5px;
`

const Wrapper = styled(DynamicContainer)`
  padding-top: 40px;
`

const VerifyProfileCode = ({ cta, email, handleBack, mobile, setActive }) => {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { setCelebration } = useCelebrationContext()

  const [setStore, { user }] = useStore()

  const handleChange = code => {
    setCode(code)
    setError('')
    setMessage('')
  }

  const handleSendNewCode = async () => {
    setError('')
    setSubmitting(true)

    const {
      data: { msg, success },
    } = await api.post('/profile/requestCode', { [mobile ? 'mobile' : 'email']: mobile && mobile.length ? mobile : email })

    if (!success) setError(msg)
    setCode('')
    setMessage('A new code has been sent!')
    setSubmitting(false)
  }

  const handleSubmit = async () => {
    setMessage('')
    setSubmitting(true)

    const {
      data: { completedChallenges, msg, rewardProgress, success },
    } = await api.post('/profile/verifyCode', { code, email, mobile })

    if (success) {
      setActive(active => active - 2)
      setError('')
      setCelebration({ completeChallenges: completedChallenges, rewardProgress })
      await setStore({ user: { ...user, email: email.length ? email : user.email, mobile: mobile.length ? mobile : user.mobile } })
    } else {
      setError(msg)
    }

    setCode('')
    setSubmitting(false)
  }

  return (
    <Layout
      cta={cta}
      handleBack={() => {
        handleBack()
        setCode('')
        setError('')
        setMessage('')
      }}
      id='verify-profile-code'
      inner
      noFooter
      title='Verify Code'
    >
      <Wrapper>
        <Content>
          <Title color='gray1' fontSize='20px'>
            We need to verify your identity
          </Title>
          <CardWrapper>
            <TextBase color='gray1'>We sent you a 6-digit code</TextBase>
            <InputWrapper backgroundColor='gray8' error={Boolean(error)} shadow={false}>
              <OtpInput
                containerStyle={otpContainerStyle}
                inputStyle={'otpInputStyle'}
                isInputNum
                numInputs={6}
                onChange={handleChange}
                value={code}
              />
            </InputWrapper>
            <Message color={error ? 'berry' : 'gray1'} fontWeight='600' noClamp>
              {error ? error : message}
            </Message>
          </CardWrapper>
          <Submit disabled={code.length !== 6} id='verify-profile-code-btn' onClick={handleSubmit} text='Verify' type='submit' />
          <Title color='gray1'>{email.length ? 'An email was sent to:' : 'A text message was sent to:'}</Title>
          <TextBase color='gray1'>{email.length ? email : formatUSPhoneNumber(mobile).formatted}</TextBase>
          <SendAgain color='blurple' fontWeight='600' onClick={handleSendNewCode} text="Didn't receive a code? Send again." />
        </Content>
      </Wrapper>
      <Submitting submitting={submitting}>
        <Loader />
      </Submitting>
    </Layout>
  )
}

VerifyProfileCode.propTypes = {
  cta: PropTypes.object,
  email: PropTypes.string,
  handleBack: PropTypes.func.isRequired,
  mobile: PropTypes.string,
  setActive: PropTypes.func.isRequired,
}

export default VerifyProfileCode
