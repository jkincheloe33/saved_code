import { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices } from '@assets'
import { Container, Input, Paragraph, PillButton, PortalLayout, SurveyHeader, Switch, TextArea } from '@components'
import { useLangContext } from '@contexts'
import { api } from '@services'
import { formatMobile, isValidEmail, isValidUSPhoneNumber } from '@utils'

const CommentInput = styled(TextArea)`
  background-color: ${colors.white};
  border-radius: 20px;
  margin-bottom: 50px;
  padding: 20px;
  resize: vertical;
`

const ContactFields = styled.div`
  height: 100%;
  margin: ${p => (p.showContactInfo ? '0 0 3rem 0' : '0')};
  max-height: ${p => (p.showContactInfo ? `${p.maxHeight}px` : 0)};
  opacity: ${p => (p.showContactInfo ? 1 : 0)};
  pointer-events: ${p => (p.showContactInfo ? 'auto' : 'none')};
  transition: max-height 250ms ease, opacity 250ms ease;
`

const Fields = styled.div`
  align-items: flex-start;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
`

const QuestionText = styled(Paragraph)`
  line-height: 33px;
  margin: 30px 0;
  text-align: center;

  @media (${devices.tablet}) {
    margin: 45px 0;
    font-size: 28px;
  }
`

const Required = styled(Paragraph)`
  align-self: flex-start;
  margin: 0.5rem 0;
`

const ToggleWrapper = styled.div`
  align-items: center;
  background-color: ${colors.gray6};
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  margin: 0 0 30px;
  padding: 20px;
  width: 75%;
`

const SurveyComments = ({ portalScreens, reviewData, setActive, setReviewData, showContactToggle, showPhoneEmail = true }) => {
  const { getText } = useLangContext()
  const contactRef = useRef(null)

  const [disabled, setDisabled] = useState(true)
  const [maxHeight, setMaxHeight] = useState(0)

  const { contactInfo } = reviewData

  useEffect(() => {
    const getContactInfo = async () => {
      const {
        data: { reviewerContactInfo, success },
      } = await api.get('/portal/survey/getContactInfo')

      if (success) {
        setReviewData(data => ({
          ...data,
          contactInfo: {
            ...data.contactInfo,
            ...reviewerContactInfo,
          },
        }))
      }
    }

    if (showContactToggle) getContactInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const canSubmit = useCallback(() => {
    const { contact, email, firstName, lastName, mobile } = contactInfo
    const validateEmail = isValidEmail(email) || !contact || !showPhoneEmail
    const validateFName = firstName.length > 0 || !contact // required if contact is true
    const validateLName = lastName.length > 0 || !contact // required if contact is true
    const validatePhone = isValidUSPhoneNumber(mobile) || !contact || !showPhoneEmail

    if ((reviewData.comment || contact) && validateEmail && validateFName && validateLName && validatePhone) return setDisabled(false)
    setDisabled(true)
  }, [reviewData.comment, contactInfo, showPhoneEmail])

  const handleBack = () => {
    reviewData.answers.pop()
    setActive(portalScreens.SURVEY)
  }

  const handleContact = (property, value) => {
    setReviewData(data => ({ ...data, contactInfo: { ...data.contactInfo, [property]: value } }))
  }

  const handleSkip = () => {
    setReviewData(data => ({ ...data, comment: '' }))
    setActive(portalScreens.GRATITUDE)
  }

  useEffect(() => {
    if (contactRef?.current) setMaxHeight(contactRef?.current?.clientHeight)
  }, [contactInfo.contact])

  useEffect(() => {
    canSubmit()
  }, [canSubmit, disabled])

  return (
    <PortalLayout noHeader>
      <SurveyHeader onBackPress={handleBack} onSkipPress={handleSkip} />
      <Container>
        <QuestionText color='darkBlue' fontSize='24px' fontWeight={700}>
          {getText('What could have been done better?')}
        </QuestionText>
        <CommentInput
          id='do-better-text-area'
          label={getText('Comment')}
          onChange={e => setReviewData(data => ({ ...data, comment: e.target.value }))}
          placeholder={getText('Share your thoughts here (optional)...')}
          rows={14}
          shadow
          spellCheck
          value={reviewData.comment}
        />
        {showContactToggle && (
          <>
            <ToggleWrapper>
              <Paragraph color='darkBlue' fontWeight={700}>
                {getText('I would like to be contacted')}
              </Paragraph>
              <Switch
                color='digitalBlue'
                id='do-better-switch'
                onChange={() => handleContact('contact', !contactInfo.contact)}
                value={contactInfo.contact}
              />
            </ToggleWrapper>

            <ContactFields maxHeight={maxHeight} showContactInfo={contactInfo.contact}>
              <Required color='darkBlue' fontWeight={700}>
                {getText('All fields are required.')}
              </Required>
              <div ref={contactRef}>
                <Fields>
                  <Input
                    border
                    columns={5.5}
                    label='First name'
                    onChange={e => handleContact('firstName', e.target.value)}
                    showLabel
                    spacing='0 0 1rem'
                    value={contactInfo.firstName}
                  />
                  <Input
                    border
                    columns={5.5}
                    label='Last name'
                    onChange={e => handleContact('lastName', e.target.value)}
                    showLabel
                    spacing='0 0 1rem'
                    value={contactInfo.lastName}
                  />
                  {showPhoneEmail && (
                    <>
                      <Input
                        border
                        label='Email'
                        onChange={e => handleContact('email', e.target.value)}
                        showLabel
                        spacing='0 0 1rem'
                        type='email'
                        value={contactInfo.email}
                      />
                      <Input
                        border
                        label='Mobile number'
                        onChange={e => handleContact('mobile', formatMobile(e.target.value))}
                        showLabel
                        spacing='0 0 1rem'
                        value={contactInfo.mobile}
                      />
                    </>
                  )}
                </Fields>
              </div>
            </ContactFields>
          </>
        )}
        <PillButton disabled={disabled} id='do-better-next-btn' onClick={() => setActive(portalScreens.GRATITUDE)} text={getText('NEXT')} />
      </Container>
    </PortalLayout>
  )
}

SurveyComments.propTypes = {
  onSubmit: PropTypes.func,
  portalScreens: PropTypes.object,
  reviewData: PropTypes.object,
  setActive: PropTypes.func,
  setReviewData: PropTypes.func,
  showPhoneEmail: PropTypes.bool,
  showContactToggle: PropTypes.bool,
}

export default SurveyComments
