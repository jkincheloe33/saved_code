import { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { numberFormatter } from '@utils'

import { colors, devices, FlowerImage, VolunteerImage } from '@assets'
import { Image, Input, Loader, Modal, PillButton, Text, Title } from '@components'
import { useLangContext, useReviewerContext } from '@contexts'
import { api } from '@services'
import { useStore } from '@utils'

const BoldText = styled.span`
  font-weight: bold;
`

const flexProps = {
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
}

const FlowerImgContainer = styled.div`
  max-width: 275px;
  position: relative;
`

const FlowerSubtitle = styled(Text)`
  margin-top: -10px;
  text-transform: lowercase;
`

const FlowerTextContainer = styled.div`
  ${({ flexProps }) => ({ ...flexProps })};
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 55px;
`

const FlowerTitle = styled(Text)`
  letter-spacing: 1.2px;
  text-transform: uppercase;
`

const Form = styled.form`
  ${({ flexProps }) => ({ ...flexProps })};
  width: 90%;

  @media (${devices.tablet}) {
    max-width: 300px;
  }
`

const SubmitButton = styled(PillButton)`
  margin-top: 20px;
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

const TextWrapper = styled.div`
  ${({ flexProps }) => ({ ...flexProps })};
  margin-top: 20px;
  text-align: center;
`

const VolunteerImg = styled(Image)`
  max-width: 275px;
`

const VolunteerInput = styled(Input)`
  label::after {
    content: '*';
  }
`

// Set z-index higher than employee modal incase user clicks employee modal before volunteer modal loads...JC
const VolunteerStyledModal = styled(Modal)`
  z-index: 6;
`

// prettier-ignore
const VolunteerText = styled(Text)`
  margin-top: 20px;

  ${p => p.returningVolunteer && `
    line-height: 28px;
    text-align: center;
    width: 220px;
  `}
`

const VolunteerTitle = styled(Title)`
  width: ${p => (p.returningVolunteer ? '215px' : '205px')};
`

const Wrapper = styled.div`
  ${({ flexProps }) => ({ ...flexProps })};
  margin: auto;
  max-height: 90vh;
  overflow: auto;
  padding: 15px 15px 30px 15px;
  position: relative;
  width: 90vw;

  @media (${devices.tablet}) {
    max-height: 629px;
    padding: 60px 30px 60px 30px;
    width: 522px;
  }
`

const VolunteerModal = ({ open, setOpen }) => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [, { lang }] = useStore()

  const { getText } = useLangContext()
  const { reviewer, setReviewer } = useReviewerContext()
  let { isVolunteer, reviewsCompleted } = { ...reviewer }
  isVolunteer = Boolean(isVolunteer)

  const closeModal = () => {
    setFirstName('')
    setLastName('')
    setOpen(false)
  }

  const handleSubmit = async e => {
    e?.preventDefault()
    setSubmitting(true)

    const volunteerInfo = {
      firstName,
      lastName,
      reviewerId: reviewer.id,
    }

    const {
      data: { success },
    } = await api.post('/portal/volunteer/createVolunteer', { volunteerInfo })

    setSubmitting(false)

    if (success) {
      setOpen(false)
      setReviewer({ ...reviewer, firstName, lastName, isVolunteer: 1 })
    }
  }

  const getReturningVolunteerTitle = () => (
    <>
      <VolunteerTitle color='darkBlue' id='returning-volunteer-form-title' returningVolunteer>
        {`${lang === 'es' ? '\u00a1' : ''}${getText('Welcome back')},`}
      </VolunteerTitle>
      <VolunteerTitle color='darkBlue' id='returning-volunteer-form-title-2'>
        {`${reviewer.firstName}!`}
      </VolunteerTitle>
    </>
  )

  const getReturningVolunteerBtn = () => (
    // eslint-disable-next-line quotes
    <SubmitButton id='returning-volunteer-btn' onClick={() => setOpen(false)} text={getText("LET'S GO!")} />
  )

  return (
    <VolunteerStyledModal animationType='slideUp' handleClose={closeModal} onClickOut={closeModal} open={open} small>
      <Wrapper flexProps={flexProps}>
        {!isVolunteer && (
          <>
            <VolunteerImg alt='New volunteer image' src={VolunteerImage} />
            <TextWrapper flexProps={flexProps}>
              <VolunteerTitle color='darkBlue' id='volunteer-form-title'>
                {getText('Thank you for being a volunteer!')}
              </VolunteerTitle>
              <VolunteerText color='darkBlue' id='volunteer-form-text' noClamp>
                {getText('Please enter your name to register.')}
              </VolunteerText>
            </TextWrapper>
            <Form flexProps={flexProps}>
              <VolunteerInput
                border
                id='volunteer-first-name-input'
                label='First name'
                onChange={e => setFirstName(e.target.value)}
                showLabel
                spacing='10px 0'
                type='text'
                value={firstName}
              />
              <VolunteerInput
                border
                id='volunteer-last-name-input'
                label='Last name'
                onChange={e => setLastName(e.target.value)}
                showLabel
                spacing='10px 0'
                type='text'
                value={lastName}
              />
              <SubmitButton
                disabled={!firstName || !lastName || submitting}
                id='submit-new-volunteer-btn'
                onClick={handleSubmit}
                text={getText('REGISTER')}
                type='submit'
              />
            </Form>
          </>
        )}
        {isVolunteer && reviewsCompleted > 0 && (
          <>
            <TextWrapper flexProps={flexProps}>
              {getReturningVolunteerTitle()}
              <VolunteerText color='darkBlue' id='returning-volunteer-form-text' noClamp returningVolunteer>
                {`${getText('Thank you for volunteering. You have')} `}
                <BoldText>{getText('made a difference')}</BoldText>
              </VolunteerText>
            </TextWrapper>
            <FlowerImgContainer>
              <FlowerTextContainer flexProps={flexProps}>
                <FlowerTitle color='digitalBlue' fontSize='49px' fontWeight='600'>
                  {numberFormatter(reviewsCompleted)}
                </FlowerTitle>
                <FlowerSubtitle color='digitalBlue' fontSize='20px'>
                  {reviewsCompleted === 1 ? getText('Time') : getText('Times')}
                </FlowerSubtitle>
              </FlowerTextContainer>
              <Image alt='Flower image' src={FlowerImage} />
            </FlowerImgContainer>
            {getReturningVolunteerBtn()}
          </>
        )}
        {isVolunteer && reviewsCompleted === 0 && (
          <>
            <VolunteerImg alt='Returning volunteer image' src={VolunteerImage} />
            <TextWrapper flexProps={flexProps}>
              {getReturningVolunteerTitle()}
              <VolunteerText color='darkBlue' id='returning-volunteer-form-text' noClamp>
                {getText('Thank you for volunteering!')}
              </VolunteerText>
            </TextWrapper>
            {getReturningVolunteerBtn()}
          </>
        )}
        {submitting && (
          <Submitting submitting={submitting}>
            <Loader />
          </Submitting>
        )}
      </Wrapper>
    </VolunteerStyledModal>
  )
}

VolunteerModal.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
}

export default VolunteerModal
