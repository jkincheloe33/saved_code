import { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices, shadows } from '@assets'
import { AlertBanner, DynamicContainer, Input, Layout, PillButton } from '@components'
import { useUserContext } from '@contexts'
import { formatMobile, formatState, formatZip, isValidEmail, isValidUSPhoneNumber, isValidZipCode } from '@utils'

const BtnWrapper = styled.div`
  margin-top: 30px;
  width: 100%;
`

const Content = styled.form`
  align-items: center;
  background-color: ${colors.white};
  border-radius: 20px;
  box-shadow: ${shadows.card};
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 25px;

  @media (${devices.desktop}) {
    border-radius: 0;
    box-shadow: none;
    margin: auto;
    max-width: 373px;
  }
`

const ErrorWrapper = styled.div`
  margin-bottom: 10px;
`

const Row = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 100%;
`

const Wrapper = styled(DynamicContainer)`
  background-color: ${colors.gray8};
  margin-bottom: 2rem;
  padding: 20px;
  width: 100%;

  @media (${devices.desktop}) {
    background-color: ${colors.white};
  }
`

const ClaimDetails = ({ cta, error, reward, rewardScreens, setActive, submitClaim }) => {
  const { user } = useUserContext()

  const [userData, setUserData] = useState({
    address: '',
    addressTwo: '',
    city: '',
    email: user?.email || '',
    name: '',
    mobile: user?.mobile || '',
    state: '',
    zip: '',
  })
  const [disabled, setDisabled] = useState(false)

  const { requiredPhone, requiredShipping } = reward

  const canSubmit = useCallback(() => {
    const validName = userData.name.length
    const validEmail = isValidEmail(userData.email)

    // Validate only if requiredShipping is true...KA
    const validAddress = !requiredShipping || userData.address.length
    const validCity = !requiredShipping || userData.city.length
    const validState = !requiredShipping || userData.state.length === 2
    const validZip = !requiredShipping || isValidZipCode(userData.zip)

    // Validate only if requiredPhone is true...KA
    const validMobile = !requiredPhone || isValidUSPhoneNumber(userData.mobile)

    if (validAddress && validCity && validMobile && validName && validState && validZip && validEmail) return setDisabled(false)
    setDisabled(true)
  }, [requiredPhone, requiredShipping, userData])

  const handleSubmit = e => {
    e.preventDefault()

    submitClaim({ data: userData, hasAddress: true })
  }

  useEffect(() => {
    canSubmit()
  }, [canSubmit])

  return (
    <Layout
      cta={cta}
      handleBack={() => setActive(rewardScreens.CLAIM_REWARD)}
      id='reward-claim-details'
      inner
      noFooter
      title='Claim Details'
    >
      <Wrapper>
        <Content onSubmit={handleSubmit}>
          <Input
            border
            label='Full Name*'
            onChange={e => setUserData(userData => ({ ...userData, name: e.target.value }))}
            showLabel
            spacing='0 0 20px'
            value={userData.name}
          />
          {requiredShipping === 1 && (
            <>
              <Input
                border
                label='Address*'
                onChange={e => setUserData(userData => ({ ...userData, address: e.target.value }))}
                showLabel
                spacing='0 0 20px'
                value={userData.address}
              />
              <Input
                border
                label='Address Line 2'
                onChange={e => setUserData(userData => ({ ...userData, addressTwo: e.target.value }))}
                showLabel
                spacing='0 0 20px'
                value={userData.addressTwo}
              />
              <Input
                border
                label='City*'
                onChange={e => setUserData(userData => ({ ...userData, city: e.target.value }))}
                showLabel
                spacing='0 0 20px'
                value={userData.city}
              />
              <Row>
                <Input
                  border
                  columns={5}
                  label='State*'
                  maxLength='2'
                  onChange={e => setUserData(userData => ({ ...userData, state: e.target.value }))}
                  showLabel
                  spacing='0 0 20px'
                  value={formatState(userData.state)}
                />
                <Input
                  border
                  columns={5}
                  label='Zip Code*'
                  maxLength='5'
                  onChange={e => setUserData(userData => ({ ...userData, zip: e.target.value }))}
                  showLabel
                  spacing='0 0 20px'
                  value={formatZip(userData.zip)}
                />
              </Row>
            </>
          )}
          {requiredPhone === 1 && (
            <Input
              border
              label='Mobile*'
              onChange={e => setUserData(userData => ({ ...userData, mobile: formatMobile(e.target.value) }))}
              placeholder='(XXX) XXX-XXXX'
              showLabel
              spacing='0 0 20px'
              value={userData.mobile}
            />
          )}
          <Input
            border
            label='Email*'
            onChange={e => setUserData(userData => ({ ...userData, email: e.target.value }))}
            showLabel
            spacing='0 0 20px'
            value={userData.email}
          />

          <BtnWrapper>
            {error && (
              <ErrorWrapper>
                <AlertBanner errors={[error]} />
              </ErrorWrapper>
            )}
            <PillButton disabled={disabled} full id='submit-address-btn' text='Submit' type='submit' />
          </BtnWrapper>
        </Content>
      </Wrapper>
    </Layout>
  )
}

ClaimDetails.propTypes = {
  cta: PropTypes.object,
  error: PropTypes.string,
  reward: PropTypes.object,
  rewardScreens: PropTypes.object,
  setActive: PropTypes.func,
  submitClaim: PropTypes.func,
}

export default ClaimDetails
