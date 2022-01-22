import { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { api } from '@services'

import { EyeIcon, LockIcon } from '@assets'
import { Banner, DynamicContainer, Image, Input, Layout, Paragraph, PillButton } from '@components'

const BannerImage = styled(Image)`
  margin: auto 21px auto 0;
  height: auto;
  width: 20px;
`

const BannerRow = styled.div`
  display: flex;
  padding: 0 24px;
  vertical-align: middle;

  ${Paragraph} {
    margin: auto 0;
  }
`

const Content = styled.form`
  display: flex;
  flex-direction: column;
  padding: 0 45px;
`

const Error = styled(Paragraph)`
  margin-bottom: 10px;
`

const StyledBanner = styled(Banner)`
  display: flex;
  flex-direction: column;
  margin-top: 15px;
`

const StyledPill = styled(PillButton)`
  margin: 40px auto 20px;
`

const Wrapper = styled(DynamicContainer)`
  padding-top: 20px;
`

const VerifyPassword = ({ cta, handleBack, setActive, setSubmitting }) => {
  const [errorMsg, setErrorMsg] = useState(null)
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)

  const handleSubmit = async e => {
    setSubmitting(true)
    // Verify the validity in the current session and issue reauth token that lasts 5 mins...KA
    e?.preventDefault()

    const {
      data: { msg, success },
    } = await api.post('/users/verifyPassword', { password })

    if (success) {
      setActive(active => active + 1)
      setPassword('')
    } else {
      setErrorMsg(msg)
    }

    setSubmitting(false)
  }

  return (
    <Layout
      cta={cta}
      handleBack={() => {
        handleBack()
        setPassword('')
      }}
      id='verify-password'
      inner
      noFooter
      title='Verify Password'
    >
      <Wrapper>
        <Content onSubmit={handleSubmit}>
          <StyledBanner>
            <BannerRow>
              <BannerImage src={LockIcon} />
              <Paragraph fontSize='14px'>Please verify your current password to continue</Paragraph>
            </BannerRow>
          </StyledBanner>
          <Input
            autoFocus
            border
            handleAction={() => setPasswordVisible(passwordVisible => !passwordVisible)}
            icon={EyeIcon}
            label='Current password'
            onChange={e => {
              setErrorMsg('')
              setPassword(e.target.value)
            }}
            showLabel
            spacing='40px 0 15px 0'
            type={passwordVisible ? 'text' : 'password'}
            value={password}
          />
          {errorMsg && (
            <Error color='berry' fontWeight='600' fontSize='14px'>
              {errorMsg}
            </Error>
          )}
          <StyledPill disabled={password.length === 0} id='signin-verify-password-btn' text='Verify' type='submit' />
        </Content>
      </Wrapper>
    </Layout>
  )
}

VerifyPassword.propTypes = {
  cta: PropTypes.object,
  handleBack: PropTypes.func,
  setActive: PropTypes.func,
  setSubmitting: PropTypes.func,
}

export default VerifyPassword
