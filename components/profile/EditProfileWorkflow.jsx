import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { devices } from '@assets'
import { EditMyProfile, RequestProfileCode, VerifyProfileCode } from '@components'

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
    width: 475px;
  }
`

const EditProfileWorkflow = ({ handleBack }) => {
  const [active, setActive] = useState(1)
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [mobileOrEmail, setMobileOrEmail] = useState('')

  const editMyProfileData = {
    handleBack,
    setMobileOrEmail,
  }

  const requestProfileCodeData = {
    handleBack: () => setActive(active => active - 1),
    mobileOrEmail,
    setEmail,
    setMobile,
  }

  const verifyProfileCodeData = {
    email,
    handleBack: () => setActive(active => active - 1),
    mobile,
  }

  // Cleanup to prevent state edge cases, small timeout to happen after transition...JC
  useEffect(() => {
    if (active === 1) {
      setTimeout(() => {
        setEmail('')
        setMobileOrEmail('')
        setMobile('')
      }, 250)
    }
  }, [active])

  const components = [
    {
      Component: EditMyProfile,
      data: editMyProfileData,
    },
    {
      Component: RequestProfileCode,
      data: requestProfileCodeData,
    },
    {
      Component: VerifyProfileCode,
      data: verifyProfileCodeData,
    },
  ]

  return (
    <Wrapper>
      {components.map(({ Component, data }, i) => (
        <Container active={active} key={i}>
          {Component && <Component {...data} active={active} cta={{ onClick: handleBack, text: 'Close' }} setActive={setActive} />}
        </Container>
      ))}
    </Wrapper>
  )
}

EditProfileWorkflow.propTypes = {
  handleBack: PropTypes.func,
}

export default EditProfileWorkflow
