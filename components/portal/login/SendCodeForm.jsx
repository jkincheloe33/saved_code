import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { devices } from '@assets'
import { Input, PillButton, Text } from '@components'
import { useLangContext } from '@contexts'
import { api } from '@services'
import { formatMobile, isValidEmail, isValidUSPhoneNumber } from '@utils'

const Error = styled(Text)`
  min-height: 22px;
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

const Identity = styled(Text)`
  margin-top: 10px;
  text-align: center;
`

const SubmitButton = styled(PillButton)`
  margin-top: 35px;
`

const SendCodeForm = ({ onSuccess }) => {
  const { getText } = useLangContext()

  const [disabled, setDisabled] = useState(true)
  const [email, setEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(null)
  const [mobile, setMobile] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()

    setIsSubmitting(true)
    const {
      data: { reviewer, success },
    } = await api.post('/portal/requestCode', { email, mobile })
    if (success) {
      onSuccess({ email, mobile, reviewer })
    } else {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const validateEmail = isValidEmail(email)
    const validatePhone = isValidUSPhoneNumber(mobile)
    const canSubmit = (validateEmail && mobile.length === 0) || (validatePhone && email.length === 0)

    if (canSubmit) {
      setDisabled(false)
      setErrorMessage('')
    } else {
      setDisabled(true)
      if (mobile && email) setErrorMessage('Please enter either a mobile number or email')
    }
  }, [mobile, email])

  return (
    <Form autoComplete='off' onSubmit={handleSubmit}>
      <Input
        border
        label='Enter your mobile number'
        onChange={e => setMobile(formatMobile(e.target.value))}
        showLabel
        spacing='16px 0 34px'
        type='tel'
        value={mobile}
      />
      <Text fontWeight='700'>{getText('or')}</Text>
      <Input border label='Enter your email' onChange={e => setEmail(e.target.value)} showLabel spacing='0 0 16px' value={email} />
      <Error color='berry' fontSize='14px' fontWeight='600' noClamp>
        {getText(errorMessage)}
      </Error>
      <Identity fontWeight='700' noClamp>
        {getText('Your identity will not be shared unless you ask for follow up.')}
      </Identity>
      <SubmitButton
        disabled={disabled || isSubmitting}
        id='send-portal-code-submit-btn'
        text={getText(isSubmitting ? 'SUBMITTING...' : 'SUBMIT')}
        type='submit'
      />
    </Form>
  )
}

SendCodeForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
}

export default SendCodeForm
