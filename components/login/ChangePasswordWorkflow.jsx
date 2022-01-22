import { useEffect, useState } from 'react'
import moment from 'moment'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices } from '@assets'
import { ChangePassword, Loader, VerifyPassword } from '@components'
import { useUserContext } from '@contexts'

const Container = styled.div`
  flex: 0 0 100%;
  height: 100%;
  opacity: ${p => (p.active === p.index ? 1 : 0)};
  transform: translateX(${p => (p.active - 1) * -100}%);
  transition: all 500ms cubic-bezier(0.88, 0.03, 0.09, 0.98);
  width: 100%;
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

const Wrapper = styled.div`
  align-items: flex-start;
  display: flex;
  flex-wrap: nowrap;
  height: 100%;

  @media (${devices.largeDesktop}) {
    width: 414px;
  }
`

const ChangePasswordWorkflow = ({ handleBack }) => {
  const [active, setActive] = useState(1)
  const [skip, setSkip] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useUserContext()

  useEffect(() => {
    // compares the current timestamp against the last login, if it's within 2 minutes or less then it skips the verify password screen...JK
    const timeDifference = moment().diff(user.lastLoginAt, 'minutes')
    // Jump to change password page and override back button to close modal...CY
    if (timeDifference <= 2 || user.hasPassword === false) {
      setActive(2)
      setSkip(true)
    }
  }, [user])

  const changePasswordData = {
    handleBack: skip ? handleBack : () => setActive(active => active - 1),
    onSubmit: handleBack,
  }

  const verifyPasswordData = {
    handleBack,
  }

  const components = [
    {
      Component: VerifyPassword,
      data: verifyPasswordData,
    },
    {
      Component: ChangePassword,
      data: changePasswordData,
    },
  ]

  return (
    <Wrapper>
      {components.map(({ Component, data }, i) => (
        <Container active={active} index={i + 1} key={i}>
          {Component && (
            <Component
              {...data}
              active={active}
              cta={{ onClick: handleBack, text: 'Close' }}
              setActive={setActive}
              setSubmitting={setSubmitting}
              submitting={submitting}
            />
          )}
        </Container>
      ))}
      <Submitting submitting={submitting}>
        <Loader />
      </Submitting>
    </Wrapper>
  )
}

ChangePasswordWorkflow.propTypes = {
  handleBack: PropTypes.func,
}

export default ChangePasswordWorkflow
