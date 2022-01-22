import { useState } from 'react'
import OtpInput from 'react-otp-input'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, multiplier } from '@assets'
import { Anchor, Card, DynamicContainer, Layout, Loader, PillButton, Text } from '@components'
import { formatUSPhoneNumber } from '@utils'

const ErrorMessage = styled(Text)`
  margin-bottom: ${multiplier * 6}px;
`

// prettier-ignore
const InputWrapper = styled(Card)`
  margin: ${multiplier *6}px 0;
  padding: ${multiplier * 3}px;
  transition: background-color 250ms ease;

  .otpInputStyle {
    border: none;
    border-bottom: 2px solid ${colors.black};
    border-radius: 0px;
    background-color: transparent;
    color: ${colors.gray1};
    font-size: 36px;
    line-height: 32px;
    padding: 0;

    &:focus {
      outline: none;
    }
  }

  ${p => p.error && `
    background-color: ${colors.berry}33;
  `}
`

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

const Message = styled(Text)`
  margin-top: ${multiplier * 6}px;
`

const otpContainerStyle = {
  caretColor: 'transparent',
  display: 'flex',
  justifyContent: 'space-between',
}

const SendAgain = styled(Anchor)`
  margin-top: ${multiplier * 6}px;
`

const Title = styled(Text)`
  margin-bottom: ${multiplier}px;
`

const Wrapper = styled(DynamicContainer)`
  align-items: center;
  display: flex;
  flex-direction: column;
  padding: ${multiplier * 6}px ${multiplier * 3}px;
`

const VerifyCode = ({ cta, email, handleBack, handleSendCode, handleVerifyCode, mobile, setSubmitting, submitting }) => {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleChange = code => {
    setCode(code)
    setError('')
    setMessage('')
  }

  const handleSendNewCode = async () => {
    setError('')
    setSubmitting(true)

    const { msg, success } = await handleSendCode()

    if (!success) setError(msg)
    setSubmitting(false)
    setCode('')
    setMessage('A new code has been sent!')
    setTimeout(() => setMessage(''), 2500)
  }

  const handleSubmit = async () => {
    setMessage('')
    setSubmitting(true)

    const { msg, success } = await handleVerifyCode(code)

    if (success) {
      setError('')
    } else {
      setError(msg)
      setCode('')
      setSubmitting(false)
    }
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
      id='verify-code'
      inner
      noFooter
      title='Verify Code'
    >
      <Wrapper>
        <Title color='gray1' fontSize='18px' fontWeight={700}>
          We need to verify your identity
        </Title>
        <Text color='gray1'>We sent you a 6-digit code</Text>
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
        {(error || message) && (
          <ErrorMessage color={error ? 'berry' : 'gray1'} fontWeight={600}>
            {error || message}
          </ErrorMessage>
        )}
        <PillButton disabled={code.length !== 6} id='verify-code-btn' onClick={handleSubmit} text='Verify' thin type='submit' />
        <Message color='gray1'>{email.length ? 'An email was sent to:' : 'A text message was sent to:'}</Message>
        <Text color='gray1'>{email.length ? email : formatUSPhoneNumber(mobile).formatted}</Text>
        <SendAgain color='blurple' fontWeight='600' onClick={handleSendNewCode} text="Didn't receive a code? Send again." />
        <LoaderWrapper loading={submitting ? 1 : 0}>
          <Loader />
        </LoaderWrapper>
      </Wrapper>
    </Layout>
  )
}

VerifyCode.propTypes = {
  cta: PropTypes.object,
  email: PropTypes.string,
  handleBack: PropTypes.func.isRequired,
  handleSendCode: PropTypes.func.isRequired,
  handleVerifyCode: PropTypes.func.isRequired,
  mobile: PropTypes.string,
  setSubmitting: PropTypes.func,
  submitting: PropTypes.bool,
}

export default VerifyCode
