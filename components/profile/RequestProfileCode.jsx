import { useEffect, useState } from 'react'
import OtpInput from 'react-otp-input'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { api } from '@services'

import { colors } from '@assets'
import { Card, DynamicContainer, Input, Layout, Loader, PillButton, Text as TextBase } from '@components'
import { isValidEmail, isValidUSPhoneNumber } from '@utils'

const CardWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  margin-bottom: 30px;
  width: 100%;
`

const Error = styled(TextBase)`
  height: 20px;
`

// prettier-ignore
const InputWrapper = styled(Card)`
  margin: 30px 0 10px;
  max-width: 500px;
  padding: ${p => (p.mobileOrEmail === 'mobile' ? '30px 35px 20px;' : '10px 35px 20px;')};
  position: relative;
  transition: background-color 250ms ease;

  .otpInput {
    display: flex;
    font-size: 25px;
    justify-content: 'space-between';

    &:first-of-type:before {
      content: '(';
    }

    &:nth-of-type(3):after {
      content: ')';
      margin-right: 5px;
    }

    &:nth-of-type(7):before {
      border: 1px solid black;
      content: "";
      display: inline-block;
      margin: 0 5px;
      padding: 0 5px;
      vertical-align: middle;
    }
  }

  .otpInputStyle {
    border: none;
    border-bottom: 2px solid ${colors.black};
    border-radius: 0px;
    background-color: transparent;
    color: ${colors.gray1};
    font-size: 24px;
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

const Text = styled(TextBase)`
  text-align: center;
`

const Title = styled(TextBase)`
  margin-bottom: 5px;
  text-align: center;
`

const Wrapper = styled(DynamicContainer)`
  align-items: center;
  display: flex;
  flex-direction: column;
  padding: 40px 10px;
`

const RequestProfileCode = ({ cta, handleBack, mobileOrEmail, setActive, setEmail, setMobile }) => {
  const [disabled, setDisabled] = useState(true)
  const [error, setError] = useState(null)
  const [inputVal, setInputVal] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const validate = isValidEmail(inputVal) || isValidUSPhoneNumber(inputVal)

  const handleChange = code => {
    setInputVal(code)
    if (error) setError(null)
  }

  const handleSubmit = async () => {
    setSubmitting(true)

    const {
      data: { msg, success },
    } = await api.post('/profile/requestCode', { [mobileOrEmail]: inputVal })

    if (success) goToVerifyCodeView()
    else setError(msg)

    setSubmitting(false)
  }

  const goToVerifyCodeView = () => {
    resetState()
    setActive(active => active + 1)
    mobileOrEmail === 'mobile' ? setMobile(inputVal) : setEmail(inputVal)
  }

  const resetState = () => {
    setDisabled(true)
    setError(null)
    setInputVal('')
  }

  useEffect(() => {
    if (validate) {
      setDisabled(false)
      setError(null)
    } else setDisabled(true)
  }, [inputVal, validate])

  return (
    <Layout
      cta={cta}
      handleBack={() => {
        handleBack()
        resetState()
      }}
      id='request-profile-code'
      inner
      noFooter
      title='Edit My Profile'
    >
      <Wrapper>
        <Title color='gray1' fontSize='20px' fontWeight='500' noClamp>
          Please enter your {mobileOrEmail === 'mobile' ? 'mobile number' : 'email'}
        </Title>
        <Text color='gray1' fontWeight='500' noClamp>
          You will need to verify your information
        </Text>
        <CardWrapper>
          <InputWrapper backgroundColor='gray8' error={Boolean(error)} mobileOrEmail={mobileOrEmail} shadow={false}>
            {mobileOrEmail === 'mobile' ? (
              <OtpInput
                className='otpInput'
                containerStyle={otpContainerStyle}
                inputStyle='otpInputStyle'
                isInputNum
                numInputs={10}
                onChange={handleChange}
                value={inputVal}
              />
            ) : (
              <Input
                border
                label='Enter email'
                onChange={e => {
                  setInputVal(e.target.value)
                  if (validate) setError(null)
                }}
                placeholder='user@example.org'
                showLabel
                spacing='10px 0'
                value={inputVal}
              />
            )}
          </InputWrapper>
          <Error color='berry' fontSize='14px' fontWeight='600' noClamp>
            {error && error}
          </Error>
        </CardWrapper>
        <Submit disabled={disabled} id='request-profile-code-btn' onClick={handleSubmit} text='Continue' type='submit' />
      </Wrapper>
      <Submitting submitting={submitting}>
        <Loader />
      </Submitting>
    </Layout>
  )
}

RequestProfileCode.propTypes = {
  cta: PropTypes.object,
  handleBack: PropTypes.func.isRequired,
  mobileOrEmail: PropTypes.string,
  setActive: PropTypes.func,
  setEmail: PropTypes.func,
  setMobile: PropTypes.func,
}

export default RequestProfileCode
