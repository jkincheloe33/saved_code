import { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { devices } from '@assets'
import { SignInHelp, VerifyCode } from '@components'
import { useAuthContext, useUserContext } from '@contexts'
import { coreApi } from '@services'

const signInHelpScreens = {
  SIGN_IN_HELP: 1,
  VERIFY_CODE: 2,
}

const Container = styled.div`
  flex: 0 0 100%;
  height: 100%;
  transform: translateX(${p => (p.active - 1) * -100}%);
  transition: transform 500ms cubic-bezier(0.88, 0.03, 0.09, 0.98);
  width: 100%;
`

const Wrapper = styled.div`
  align-items: flex-start;
  display: flex;
  flex-wrap: nowrap;
  height: 100%;

  @media (${devices.largeDesktop}) {
    width: 414px;
  }
`

const SignInHelpWorkflow = ({ handleBack }) => {
  const { setIsAuthenticated } = useAuthContext()
  const { getUser, setLoginDataBundle } = useUserContext()

  const [active, setActive] = useState(signInHelpScreens.SIGN_IN_HELP)
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSendCode = async () => {
    const { data } = await coreApi.post('/auth/requestCode', { email, mobile })

    return data
  }

  const handleVerifyCode = async code => {
    const {
      data: { completedChallenges, hasNewLessons, msg, rewardProgress, success },
    } = await coreApi.post('/auth/verifyCode', { code, email, mobile })

    if (success) {
      setIsAuthenticated(true)
      setLoginDataBundle({ completedChallenges, hasNewLessons, rewardProgress })
      await getUser()
    }

    return { msg, success }
  }

  const signInHelpData = {
    email,
    handleBack,
    handleSendCode,
    mobile,
    setEmail,
    setMobile,
  }

  const verifyCodeData = {
    handleBack: () => {
      setActive(signInHelpScreens.SIGN_IN_HELP)
      setEmail('')
      setMobile('')
    },
    handleSendCode,
    handleVerifyCode,
    email,
    mobile,
  }

  const components = [
    {
      Component: SignInHelp,
      data: signInHelpData,
    },
    {
      Component: (email || mobile) && VerifyCode,
      data: verifyCodeData,
    },
  ]

  return (
    <Wrapper>
      {components.map(({ Component, data }, i) => (
        <Container active={active} key={i}>
          {Component && (
            <Component
              {...data}
              active={active}
              cta={{ onClick: handleBack, text: 'Close' }}
              setActive={setActive}
              setSubmitting={setSubmitting}
              signInHelpScreens={signInHelpScreens}
              submitting={submitting}
            />
          )}
        </Container>
      ))}
    </Wrapper>
  )
}

SignInHelpWorkflow.propTypes = {
  handleBack: PropTypes.func,
}

export default SignInHelpWorkflow
