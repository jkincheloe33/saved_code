import { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, DaisyLogo, devices, InfoIcon } from '@assets'
import {
  Card,
  Checkbox,
  Container,
  DaisyModal,
  Image,
  Input,
  Intro,
  Paragraph,
  PillButton,
  PortalLayout,
  SurveyHeader,
  Text,
  TextArea,
} from '@components'
import { useLangContext } from '@contexts'
import { formatMobile, isValidEmail, isValidUSPhoneNumber } from '@utils'

const Body = styled(Paragraph)`
  text-align: center;
  width: 100%;

  @media (${devices.tablet}) {
    font-size: 18px;
  }
`

const BoldText = styled(Paragraph)`
  align-self: flex-start;
  margin: 2rem 0 0 0;
`

const Comment = styled(TextArea)`
  background-color: ${colors.white};
  border-radius: 20px;
  margin: 20px 0;
  padding: 20px;
`

const DaisyImage = styled(Card)`
  padding: 11px;
`

const Fields = styled.div`
  align-items: flex-start;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin: 1rem 0;
  width: 100%;
`

const FlexContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  width: 100%;
`

const Form = styled.form`
  max-height: ${p => (p.nominate ? `${p.maxHeight}px` : 0)};
  opacity: ${p => (p.nominate ? 1 : 0)};
  pointer-events: ${p => (p.nominate ? 'auto' : 'none')};
  transition: opacity 250ms ease;
  width: 100%;
`

const ImageWrapper = styled.div`
  margin: 31px auto 38px;
  max-width: ${p => (p.nominate ? '176px' : '260px')};
  position: relative;
  transition: all 250ms ease;
  width: 100%;
`

const Info = styled.a`
  bottom: 4px;
  height: 20px;
  position: absolute;
  right: -30px;
  width: 20px;
`

const InputRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  margin: 20px 0;
  width: 100%;

  span {
    margin-right: 10px;
  }

  @media (${devices.tablet}) {
    span {
      font-size: 14px;
      margin-right: 20px;
    }
  }
`

const NoThanks = styled(PillButton)`
  margin-top: 2rem;
`

const Nominate = styled(FlexContainer)`
  margin-top: 25px;
`

const Option = styled(Text)`
  margin-left: 5px;
`

const DaisyAward = ({ portalScreens, reviewData: { daisyInfo }, setActive, setReviewData, submitReview }) => {
  const { getText } = useLangContext()
  const ref = useRef(null)

  const [disabled, setDisabled] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [maxHeight, setMaxHeight] = useState(0)
  const [nominate, setNominate] = useState(false)

  const canSubmit = useCallback(() => {
    if (daisyInfo) {
      const { comment, email, firstName, lastName, mobile } = daisyInfo
      const validComment = comment.length
      const validEmail = isValidEmail(email) // email needs to match the correct format
      const validFName = firstName.length
      const validLName = lastName.length
      const validMobile = isValidUSPhoneNumber(mobile) // phone can be blank or be correct format

      if (validComment && validEmail && validFName && validLName && validMobile) return setDisabled(false)
      setDisabled(true)
    }
  }, [daisyInfo])

  const handleBack = () => {
    if (nominate) setNominate(false)
    else setActive(portalScreens.GRATITUDE)
  }

  const handleChange = (property, value) => {
    setReviewData(data => ({ ...data, daisyInfo: { ...data.daisyInfo, [property]: value } }))
  }

  const handleSkip = () => {
    setNominate(false)
    setReviewData(data => ({ ...data, daisyInfo: null }))
    submitReview()
  }

  const handleSubmit = async e => {
    e.preventDefault()
    submitReview()
  }

  useEffect(() => {
    canSubmit()
  }, [canSubmit, disabled])

  useEffect(() => {
    if (ref?.current) setMaxHeight(ref.current?.clientHeight)
  }, [nominate])

  return (
    <PortalLayout noHeader>
      <SurveyHeader onBackPress={handleBack} onSkipPress={handleSkip} />
      <Container>
        <Intro squiggly='left' text={getText('Nominate this nurse')} />
        <ImageWrapper borderRadius='12px' nominate={nominate}>
          <DaisyImage>
            <Image alt='Daisy logo' src={DaisyLogo} />
          </DaisyImage>
          <Info onClick={() => setIsModalOpen(true)}>
            <Image alt='Info icon' src={InfoIcon} />
          </Info>
        </ImageWrapper>
        <Body color='darkBlue' fontSize='14px'>
          {nominate
            ? getText(
                'Thank you for taking the time to nominate an extraordinary nurse for this award. Please tell us about yourself so you may be included in the celebration of this award in the event the nurse you nominated is chosen for this honor.'
              )
            : getText('The DAISY Award celebrates nurses who provide extraordinary compassionate and skillful care every day.')}
        </Body>
        {!nominate && (
          <>
            <br />
            <Body color='darkBlue' fontSize='14px'>
              {getText('Would you like to nominate this nurse for The DAISY Award?')}
            </Body>
            <br />
            <Nominate>
              <PillButton id='nominate-btn' onClick={() => setNominate(true)} text={getText('NOMINATE')} />
              <NoThanks id='no-thanks-btn' inverted onClick={handleSkip} text={getText('NO THANKS')} />
            </Nominate>
          </>
        )}
        <Form maxHeight={maxHeight} nominate={nominate} onSubmit={handleSubmit}>
          {nominate && (
            <FlexContainer ref={ref}>
              <BoldText color='darkBlue' fontWeight={700}>
                {getText('All fields are required.')}
              </BoldText>
              <Fields>
                <Input
                  border
                  columns={5.5}
                  label='First name'
                  onChange={e => handleChange('firstName', e.target.value)}
                  showLabel
                  spacing='0 0 20px'
                  value={daisyInfo.firstName}
                />
                <Input
                  border
                  columns={5.5}
                  label='Last name'
                  onChange={e => handleChange('lastName', e.target.value)}
                  showLabel
                  spacing='0 0 20px'
                  value={daisyInfo.lastName}
                />
                <Input
                  border
                  label='Mobile number'
                  onChange={e => handleChange('mobile', formatMobile(e.target.value))}
                  showLabel
                  spacing='0 0 20px'
                  value={daisyInfo.mobile}
                />
                <Input
                  border
                  label='Email'
                  onChange={e => handleChange('email', e.target.value)}
                  showLabel
                  spacing='0 0 20px'
                  value={daisyInfo.email}
                />
                <Comment
                  id='daisy-comment-text-area'
                  label='Comment'
                  onChange={e => handleChange('comment', e.target.value)}
                  placeholder={getText(
                    'Please describe a specific situation or story that demonstrates how this nurse made a meaningful difference in your care.'
                  )}
                  rows={14}
                  shadow
                  spellCheck
                  value={daisyInfo.comment}
                />
                <InputRow>
                  <Text color='darkBlue' fontSize='12px' fontWeight={700} noClamp>
                    {getText('I am (please check one)*')}
                  </Text>
                  <Checkbox
                    id='patient-checkbox'
                    checked={daisyInfo.nominatorType === 'patient'}
                    color='white'
                    onChange={() => handleChange('nominatorType', 'patient')}
                    value='patient'
                  >
                    <Option color='darkBlue' fontSize='12px' fontWeight={700} noClamp>
                      {getText('Patient')}
                    </Option>
                  </Checkbox>
                  <Checkbox
                    id='family-checkbox'
                    checked={daisyInfo.nominatorType === 'family'}
                    color='white'
                    onChange={() => handleChange('nominatorType', 'family')}
                    value='family'
                  >
                    <Option color='darkBlue' fontSize='12px' fontWeight={700} noClamp>
                      {getText('Family / Visitor')}
                    </Option>
                  </Checkbox>
                </InputRow>
              </Fields>
              <PillButton disabled={disabled} id='daisy-submit-btn' text={getText('SUBMIT')} type='submit' />
            </FlexContainer>
          )}
        </Form>
        <DaisyModal handleClose={() => setIsModalOpen(false)} open={isModalOpen} />
      </Container>
    </PortalLayout>
  )
}

DaisyAward.propTypes = {
  portalScreens: PropTypes.object,
  reviewData: PropTypes.object,
  setActive: PropTypes.func,
  setReviewData: PropTypes.func,
  submitReview: PropTypes.func,
}

export default DaisyAward
