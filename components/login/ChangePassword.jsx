import { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { BrainIcon, EyeIcon, EyeCrossedIcon, MatchIcon, NoMatchIcon, RoundCheck, TextCaseIcon } from '@assets'
import { Banner, Checkbox, DynamicContainer, Image, Input, Layout, Paragraph, PillButton, ProgressBar, Text } from '@components'
import { useToastContext, useUserContext } from '@contexts'
import { api } from '@services'
import { testForCase, testForNumber } from '@utils'

const BannerImage = styled(Image)`
  margin: auto 14px auto 0;
  height: auto;
  width: 24px;
`

const BannerRow = styled.div`
  display: flex;
  padding: 13px 24px;

  ${Paragraph} {
    margin: auto 0;
  }
`

const BtnWrapper = styled.div`
  margin: 25px 0 60px 0;
  padding-top: 20px;
  text-align: center;
`

const CheckboxRow = styled(Checkbox)`
  font-size: 14px;
  font-weight: normal;
  margin-bottom: 14px;
`

const Content = styled.form`
  display: flex;
  flex-direction: column;
  padding: 0 45px;
`
const LoginId = styled(Text)`
  padding: 5px;
  text-align: center;
`

const LoginIdBanner = styled(Banner)`
  margin-top: 20px;
`
const MessageImage = styled(Image)`
  margin: auto 7px auto 0;
`

const MessageWrapper = styled.div`
  display: flex;
  margin-bottom: 13px;
`

const ProgressWrapper = styled.div`
  display: ${p => (p.password.length > 0 ? 'flex' : 'none')};
  flex-direction: column;
  margin-bottom: 30px;
  padding-top: 30px;
  width: 100%;
`

const ProgressBarWrapper = styled.div`
  margin-bottom: 30px;
`

const StyledBanner = styled(Banner)`
  display: flex;
  flex-direction: column;
`

const Wrapper = styled(DynamicContainer)`
  padding-bottom: 30px;
`

const ChangePassword = ({ cta, handleBack, onSubmit, setSubmitting }) => {
  const [caseMatch, setCaseMatch] = useState(false)
  const [charMatch, setCharMatch] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)
  const [disabled, setDisabled] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)
  const [numMatch, setNumMatch] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [strength, setStrength] = useState(0)

  const { getUser, user } = useUserContext()
  const { setToastData } = useToastContext()

  const passwordCta = user.hasPassword === false ? 'Set Password' : 'Change Password'

  const passwordRequirements = [
    { checked: charMatch, text: 'Must be at least 8 characters' },
    { checked: numMatch, text: 'Must contain at least 1 number' },
    { checked: caseMatch, text: 'Must contain lowercase and uppercase letters' },
  ]

  const canSubmit = useCallback(() => {
    // checks for length at least 8...KA
    const charTest = password.length >= 8
    setCharMatch(charTest)

    // checks for at least one number...KA
    const numTest = testForNumber(password)
    setNumMatch(numTest)

    // checks for at least one lowercase and one uppercase...KA
    const caseTest = testForCase(password)
    setCaseMatch(caseTest)

    const validPassword = charTest && numTest && caseTest

    if (validPassword && password === confirmPassword) return setDisabled(false)
    setDisabled(true)
  }, [password, confirmPassword])

  const handleSubmit = async e => {
    e && e.preventDefault()
    setSubmitting(true)

    try {
      const { data } = await api.post('/users/updatePassword', { newPassword: password })
      if (data.success) {
        let callout = 'Password changed'
        // Get update user data on success...CY
        if (user.hasPassword === false) {
          // Fix timing issue where it pull unchanged user...CY
          setTimeout(async () => {
            await getUser()
          }, 1000)

          callout = 'Password set'
        }

        setToastData({
          callout,
          gradient: {
            colors: [
              {
                color: 'mint',
                location: '30%',
              },
              {
                color: 'skyBlue',
                location: '100%',
              },
            ],
            position: 'to bottom',
          },
          icon: RoundCheck,
          id: 'password-changed-toast',
        })

        // Close modal when done...CY
        onSubmit()
      } else {
        setErrorMsg(data.msg)
      }
    } catch {
      setErrorMsg('Error changing password')
    }
    setSubmitting(false)
  }

  useEffect(() => {
    canSubmit()
  }, [canSubmit])

  useEffect(() => {
    setStrength(caseMatch + charMatch + numMatch)
  }, [caseMatch, charMatch, numMatch])

  const getMatchText = () => {
    if (strength === 3 && confirmPassword.length !== 0) {
      let text = 'Passwords do not match!'
      let src = NoMatchIcon
      let alt = 'No password match'

      if (confirmPassword === password) {
        text = 'Passwords match!'
        src = MatchIcon
        alt = 'Password match'
      }

      return (
        <MessageWrapper>
          <MessageImage src={src} alt={alt} />
          <Paragraph fontSize='14px' fontWeight='700'>
            {text}
          </Paragraph>
        </MessageWrapper>
      )
    }
  }

  const handlePasswordCancel = () => {
    setPassword('')
    setConfirmPassword('')
    setStrength(0)
    setCaseMatch(false)
    setCharMatch(false)
    setNumMatch(false)
    handleBack()
  }

  return (
    <Layout cta={cta} handleBack={() => handlePasswordCancel()} id='change-password' inner noFooter title={passwordCta}>
      <Wrapper>
        <Content onSubmit={handleSubmit}>
          <LoginIdBanner>
            <LoginId>Login ID: {user.loginId}</LoginId>
          </LoginIdBanner>
          <Input
            border
            handleAction={() => setPasswordVisible(passwordVisible => !passwordVisible)}
            icon={EyeIcon}
            label='Enter new password'
            onChange={e => {
              setErrorMsg('')
              setPassword(e.target.value)
            }}
            showLabel
            spacing='35px 0 5px 0'
            type={passwordVisible ? 'text' : 'password'}
            value={password}
          />
          <ProgressWrapper password={password}>
            <ProgressBarWrapper>
              <ProgressBar max={3} progress={strength} />
            </ProgressBarWrapper>
            {passwordRequirements.map((r, i) => (
              <CheckboxRow color='mint' checked={r.checked} key={i} noCursor spacing='0 14px 0 0' whiteCheckmark>
                <Paragraph fontSize='14px'>{r.text}</Paragraph>
              </CheckboxRow>
            ))}
          </ProgressWrapper>
          <Input
            border
            handleAction={() => setConfirmPasswordVisible(confirmPasswordVisible => !confirmPasswordVisible)}
            icon={EyeIcon}
            label='Confirm new password'
            onChange={e => {
              setErrorMsg('')
              setConfirmPassword(e.target.value)
            }}
            showLabel
            spacing='30px 0 15px 0'
            type={confirmPasswordVisible ? 'text' : 'password'}
            value={confirmPassword}
          />
          {getMatchText()}
          {errorMsg && (
            <MessageWrapper>
              <Paragraph color='berry' fontWeight='600'>
                {errorMsg}
              </Paragraph>
            </MessageWrapper>
          )}
          <BtnWrapper>
            <PillButton disabled={disabled} id='password-change-btn' text={passwordCta} type='submit' />
          </BtnWrapper>
          <StyledBanner title='Password Tips'>
            <BannerRow>
              <BannerImage alt='Text Case' src={TextCaseIcon} />
              <Paragraph fontSize='14px'>Passwords are case sensitive</Paragraph>
            </BannerRow>
            <BannerRow>
              <BannerImage alt='Brain' src={BrainIcon} />
              <Paragraph fontSize='14px'>Your passwords should be memorable (unless using a password manager)</Paragraph>
            </BannerRow>
            <BannerRow>
              <BannerImage alt='Eye Crossed' src={EyeCrossedIcon} />
              <Paragraph fontSize='14px'>Don’t write your password where others can find it</Paragraph>
            </BannerRow>
          </StyledBanner>
        </Content>
      </Wrapper>
    </Layout>
  )
}

ChangePassword.propTypes = {
  cta: PropTypes.object,
  handleBack: PropTypes.func,
  onSubmit: PropTypes.func,
  setSubmitting: PropTypes.func,
}

export default ChangePassword
