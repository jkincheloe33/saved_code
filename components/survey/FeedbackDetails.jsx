import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import moment from 'moment'

import { colors, EmailIcon, FairFace, GoodFace, GreatFace, InfoIcon2, MatchIcon, OkFace, PhoneIcon, PoorFace } from '@assets'
import {
  AddComment,
  Anchor,
  Card,
  Checkbox,
  Comment,
  DynamicContainer,
  Image,
  Layout,
  Loader,
  Paragraph,
  PeopleTile,
  Text,
} from '@components'
import { useUserContext } from '@contexts'
import { api } from '@services'
import { FOLLOW_UP_STATUS, formatMobile } from '@utils'

const CardText = styled(Text)`
  margin-bottom: 20px;
`

const CheckboxRow = styled.div`
  cursor: pointer;
  display: flex;
  margin-bottom: 20px;
`

const ContactRow = styled.div`
  display: flex;
  margin-bottom: 20px;

  img {
    margin-right: 9px;
    width: 23px;
  }
`

const Face = styled(Image)`
  margin: auto 0 auto 10px;
  width: 25px;
`

const FollowUpCompleteCard = styled(Card)`
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
  padding: 20px 20px 0;

  ${Text} {
    margin-left: 13px;
  }
`

const FollowUpRow = styled.div`
  display: flex;
  margin-bottom: 20px;

  img {
    margin: auto 5px auto 0;
  }
`

const InfoWrapper = styled.div`
  background-color: ${colors.gray8};
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
  padding: 20px 20px 0;

  ${Paragraph} {
    margin-bottom: 20px;
  }
`

const LoaderWrapper = styled.div`
  align-items: center;
  background-color: ${colors.white}BF;
  bottom: 0;
  display: flex;
  justify-content: center;
  left: 0;
  opacity: ${p => (p.submitting ? 1 : 0)};
  pointer-events: ${p => (p.submitting ? 'auto' : 'none')};
  position: fixed;
  right: 0;
  top: 0;
  transform: opacity 250ms ease;
  z-index: 5;
`

const NotesWrapper = styled.div`
  border-top: 1px solid ${colors.gray5};
  display: flex;
  flex-direction: column;
  margin: 0 -20px;
  padding: 20px 20px 0;
`

const Person = styled(PeopleTile)`
  margin: 0 0 20px;
`

const Question = styled(Paragraph)`
  width: 65%;
`

const ResponseRow = styled.div`
  background-color: ${colors.gray8};
  border-radius: 15px;
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 15px 20px;

  ${Text} {
    margin: auto 0;
  }
`

const Score = styled.div`
  display: flex;
`

const SurveyCard = styled(Card)`
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  padding: 20px;
`

const Wrapper = styled(DynamicContainer)`
  padding: 20px;
`

const scores = [
  { rating: 1, icon: PoorFace, text: 'Poor' },
  { rating: 2, icon: FairFace, text: 'Fair' },
  { rating: 3, icon: OkFace, text: 'Ok' },
  { rating: 4, icon: GoodFace, text: 'Good' },
  { rating: 5, icon: GreatFace, text: 'Great' },
]

const FeedbackDetails = ({ cta, handleBack, setSurveys, surveyId, surveys }) => {
  const [submitting, setSubmitting] = useState(false)

  const { user } = useUserContext()
  const ref = useRef()
  const [isLoading, setIsLoading] = useState(true)
  const [
    {
      comment,
      createdAt,
      email,
      followUpAt,
      followUpBy,
      followUpByImage,
      followUpStatus,
      jobTitle,
      mobile,
      notes,
      recipientImage,
      recipientName,
      responses,
      reviewerName,
    },
    setSurvey,
  ] = useState({})

  useEffect(() => {
    getSurveyDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addNote = async note => {
    const {
      data: { success, surveyDetails },
    } = await api.post('/survey/saveFeedbackNote', { note, surveyId })

    if (success) setSurvey(surveyDetails)
  }

  useEffect(() => {
    if (ref?.current && surveys?.filter(s => s.id === surveyId)[0]?.noteCount !== notes.length) {
      ref.current.scrollTop = ref.current.scrollHeight

      const surveyIndex = surveys.findIndex(s => s.id === surveyId)

      surveys[surveyIndex].noteCount = notes.length
      setSurveys(surveys)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes])

  useEffect(() => {
    if (followUpStatus && surveys?.filter(s => s.id === surveyId)[0]?.followUpStatus !== followUpStatus) {
      const surveyIndex = surveys.findIndex(s => s.id === surveyId)

      surveys[surveyIndex].followUpStatus = followUpStatus
      setSurveys(surveys)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followUpStatus])

  const getSurveyDetails = async () => {
    const {
      data: { success, surveyDetails },
    } = await api.get(`/survey/getFeedbackDetails?surveyId=${surveyId}`)

    if (success) {
      setSurvey(surveyDetails)
      setIsLoading(false)
    } else {
      handleBack()
    }
  }

  const toggleStatus = async () => {
    setSubmitting(true)

    const {
      data: { success, surveyDetails },
    } = await api.post('/survey/updateFeedbackStatus', { followUpStatus, surveyId })

    if (success) setSurvey(surveyDetails)

    setSubmitting(false)
  }

  return (
    <>
      <Layout cta={cta} handleBack={handleBack} id='feedback-detail' inner noFooter title='Feedback details'>
        {isLoading ? (
          <Loader />
        ) : (
          <Wrapper ref={ref}>
            <SurveyCard>
              <Person images={[recipientImage]} ratio='50px' subtitle={jobTitle} title={recipientName} />
              <CardText>{moment(createdAt).fromNow()}</CardText>
              {followUpStatus !== FOLLOW_UP_STATUS.NONE && (
                <FollowUpRow>
                  <Image alt='survey-followup-icon' src={followUpStatus === FOLLOW_UP_STATUS.REQUESTED ? InfoIcon2 : MatchIcon} />
                  {followUpStatus === FOLLOW_UP_STATUS.REQUESTED ? (
                    <Text color='berry'>Follow-up requested</Text>
                  ) : (
                    <Text>Follow-up completed</Text>
                  )}
                </FollowUpRow>
              )}
              {comment && (
                <InfoWrapper>
                  <CardText fontWeight={500}>How can we do better?</CardText>
                  <Paragraph>{comment}</Paragraph>
                </InfoWrapper>
              )}
              {reviewerName && (
                <InfoWrapper>
                  <CardText color='gray1' fontWeight={600}>
                    Contact: {reviewerName}
                  </CardText>
                  {mobile && (
                    <ContactRow>
                      <Image alt='phone-icon' src={PhoneIcon} />
                      <Anchor color='blurple' fontWeight='600' link={`tel:${mobile.replace(/\D/g, '')}`} text={formatMobile(mobile)} />
                    </ContactRow>
                  )}
                  {email && (
                    <ContactRow>
                      <Image alt='email-icon' src={EmailIcon} />
                      <Anchor color='blurple' fontWeight='600' link={`mailto:${email}`} text={email} />
                    </ContactRow>
                  )}
                </InfoWrapper>
              )}
              {followUpStatus !== FOLLOW_UP_STATUS.NONE && (
                <FollowUpCompleteCard>
                  <CheckboxRow id='follow-up-checkbox' onClick={toggleStatus}>
                    <Checkbox checked={followUpStatus === FOLLOW_UP_STATUS.COMPLETED} />
                    <Text color='gray1'>Follow-up complete</Text>
                  </CheckboxRow>
                  {followUpStatus === FOLLOW_UP_STATUS.COMPLETED && (
                    <Person images={[followUpByImage]} ratio='50px' subtitle={moment(followUpAt).fromNow()} title={followUpBy} />
                  )}
                </FollowUpCompleteCard>
              )}
              {responses &&
                responses.map(({ question, questionId, rating }) => {
                  const { icon, text } = scores.filter(s => s.rating === rating)[0]
                  return (
                    <ResponseRow key={questionId}>
                      <Question fontSize='15px'>{question}</Question>
                      <Score>
                        <Text color='gray1' fontWeight={600}>
                          {text}
                        </Text>
                        <Face alt={`face-${questionId}`} src={icon} />
                      </Score>
                    </ResponseRow>
                  )
                })}
              <NotesWrapper>
                <CardText color='gray1' fontWeight={700}>
                  Notes
                </CardText>
                {notes?.length > 0 &&
                  notes.map(({ authorImage, authorName, createdAt, id, note }) => (
                    <Comment comment={note} createdAt={createdAt} image={authorImage} key={id} name={authorName} />
                  ))}
                <AddComment addCommentClick={addNote} image={user.thumbnailImage} placeholder='Add a note...' />
              </NotesWrapper>
            </SurveyCard>
          </Wrapper>
        )}
      </Layout>
      <LoaderWrapper submitting={submitting}>
        <Loader />
      </LoaderWrapper>
    </>
  )
}

FeedbackDetails.propTypes = {
  cta: PropTypes.object,
  handleBack: PropTypes.func.isRequired,
  setSurveys: PropTypes.func,
  surveyId: PropTypes.number.isRequired,
  surveys: PropTypes.array,
}

export default FeedbackDetails
