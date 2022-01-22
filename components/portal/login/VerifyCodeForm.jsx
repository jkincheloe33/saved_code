import { useEffect, useState } from 'react'
import OtpInput from 'react-otp-input'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices, shadows } from '@assets'
import { Checkbox, PillButton, TermsModal, Text, Title } from '@components'
import { useLangContext, useReviewerContext } from '@contexts'
import { api } from '@services'
import { formatMobile } from '@utils'

const Accept = styled(Text)`
  margin-left: 10px;
`

const AcceptTermsContainer = styled.div`
  align-items: center;
  display: flex;
  margin-top: 17px;
`

const ErrorMessage = styled(Text)`
  min-height: 22.5px;
  text-align: center;
`

const Form = styled.form`
  align-items: center;
  display: flex;
  flex-direction: column;
  width: 100%;

  @media (${devices.mobile}) {
    width: 350px;
  }
`

const InputWrapper = styled.div`
  .otpInputStyle {
    background-color: ${colors.white};
    border: none;
    border-radius: 12px;
    box-shadow: ${shadows.input};
    color: ${colors.darkBlue};
    font-size: 36px;
    height: 67px;
    line-height: 51px;
    min-width: 60px;
    text-align: center;
    transition: none;
    width: 73px;
  }
`

const NewCode = styled(Text)`
  margin: 18px auto;
`

const otpContainerStyle = {
  caretColor: 'transparent',
  marginBottom: '20px',
}

const otpErrorStyle = {
  border: `2px solid ${colors.berry}`,
}

const Separator = styled.span`
  content: '';
  width: 16px;
`

const StyledText = styled(Text)`
  letter-spacing: 0.2px;
  margin-top: 25px;
  text-align: center;
`

const Submit = styled(PillButton)`
  margin-top: 35px;
`

const TermsLink = styled(Text)`
  cursor: pointer;
  margin-left: 3px;
`

const VerifyCodeForm = ({ email, mobile, onSuccess }) => {
  const { getText } = useLangContext()
  const { reviewer, setIsReturningVolunteer } = useReviewerContext()
  const { acceptedTermsAt, id: reviewerId } = { ...reviewer }

  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [code, setCode] = useState('')
  const [disabled, setDisabled] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(null)
  const [message, setMessage] = useState('')
  const [newCodeState, setNewCodeState] = useState('idle')
  const [otpHasErrored, setOtpHasErrored] = useState(false)

  const handleChange = e => {
    setCode(e)
    setOtpHasErrored(false)
    if (e.length === 4) {
      setDisabled(false)
      if (!acceptedTerms) setMessage('Please accept the terms before continuing')
    } else {
      setMessage('')
      setDisabled(true)
    }
  }

  const handleSubmit = async e => {
    e?.preventDefault()

    setIsSubmitting(true)
    setMessage('')
    setNewCodeState('idle')
    setOtpHasErrored(false)

    const {
      data: { reviewer, success },
    } = await api.post('/portal/verifyCode', { code, reviewerId })

    if (success) {
      onSuccess(reviewer)
      if (reviewer.isVolunteer) setIsReturningVolunteer(true)
    } else {
      setOtpHasErrored(true)
      setMessage('Incorrect code, please try again.')
    }
    setIsSubmitting(false)
  }

  const handleSendNewCode = async () => {
    setCode('')
    setDisabled(true)
    setMessage('')
    setNewCodeState('sending')
    setOtpHasErrored(false)

    const {
      data: { success },
    } = await api.post('/portal/requestCode', { mobile, email })

    if (success) {
      setNewCodeState('success')
      setMessage('A new code has been sent!')
    } else {
      setNewCodeState('idle')
      setMessage('Please try again, something went wrong')
    }
  }

  const acceptedTermsHandler = () => {
    setMessage('')
    setAcceptedTerms(true)
    setIsModalOpen(false)
  }

  useEffect(() => {
    if (acceptedTermsAt != null) setAcceptedTerms(true)
  }, [acceptedTermsAt])

  return (
    <>
      <Title color='darkBlue' fontSize='22px'>
        {getText(`Let's verify your ${email ? 'email' : 'number'}`)}
      </Title>
      <StyledText color='darkBlue' noClamp>
        {/* eslint-disable-next-line quotes */}
        {email ? `${getText("We'll email you at")} ${email}` : `${getText("We'll text you on")} ${formatMobile(mobile)}`}
      </StyledText>
      <NewCode as='a' color='digitalBlue' disabled={newCodeState === 'sending'} fontWeight='700' onClick={handleSendNewCode}>
        {getText(newCodeState === 'sending' ? 'Sending...' : 'Send me a new code')}
      </NewCode>
      <Form autoComplete='off' onSubmit={handleSubmit}>
        <InputWrapper>
          <OtpInput
            containerStyle={otpContainerStyle}
            errorStyle={otpErrorStyle}
            hasErrored={otpHasErrored}
            id='code-input'
            inputStyle={'otpInputStyle'}
            isInputNum
            numInputs={4}
            onChange={handleChange}
            separator={<Separator />}
            shouldAutoFocus
            value={code}
          />
        </InputWrapper>
        <ErrorMessage color={newCodeState === 'success' ? 'gray1' : 'berry'}>{getText(message)}</ErrorMessage>
        <AcceptTermsContainer>
          <Checkbox
            checked={acceptedTerms}
            color='white'
            id='verify-code-check-box'
            onChange={terms => {
              setAcceptedTerms(terms => !terms)
              setNewCodeState('idle')
              setMessage('')
              if (code.length === 4 && !terms) setMessage('Please accept the terms before continuing')
            }}
          />
          <Accept>{getText('I accept the')}</Accept>
          <TermsLink color='digitalBlue' fontWeight={700} onClick={() => setIsModalOpen(true)}>
            {getText('Terms and Conditions')}
          </TermsLink>
        </AcceptTermsContainer>
        <Submit
          disabled={disabled || !acceptedTerms || isSubmitting}
          id='verify-portal-code-submit-btn'
          text={getText(isSubmitting ? 'SUBMITTING...' : 'SUBMIT')}
          type='submit'
        />
      </Form>
      <TermsModal acceptTerms={acceptedTermsHandler} isPortal showTerms={isModalOpen} />
    </>
  )
}

VerifyCodeForm.propTypes = {
  email: PropTypes.string,
  mobile: PropTypes.string,
  onSuccess: PropTypes.func.isRequired,
}

export default VerifyCodeForm
