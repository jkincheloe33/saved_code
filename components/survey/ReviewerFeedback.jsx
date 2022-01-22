import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import moment from 'moment'
import InfiniteScroll from 'react-infinite-scroll-component'

import { colors, FairFace, GoodFace, GreatFace, InfoIcon2, MatchIcon, NoteIcon, OkFace, PoorFace } from '@assets'
import { Card, DynamicContainer, Image, Layout, Loader, NumberIndicator, Text } from '@components'
import { api } from '@services'
import { FOLLOW_UP_STATUS, uId } from '@utils'

const CardText = styled(Text)`
  margin-bottom: 20px;
`

const Face = styled(Image)`
  margin: auto 15px auto 0;
`

const FollowUpRow = styled.div`
  background-color: ${colors.gray8};
  border-radius: 15px;
  display: flex;
  padding: 12px 15px;
  width: fit-content;

  img {
    margin: auto 5px auto 0;
  }
`

const InfiniteSurveysScroll = styled(InfiniteScroll)`
  display: flex;
  flex-direction: column;
  padding: 20px;
  -webkit-overflow-scrolling: auto !important;
`

const LoaderWrapper = styled.div`
  align-items: center;
  background-color: ${colors.white}E6;
  display: flex;
  height: 100%;
  justify-content: center;
  left: 0;
  opacity: ${p => (p.isLoading ? 1 : 0)};
  pointer-events: none;
  position: fixed;
  top: 0;
  transition: opacity 250ms ease;
  width: 100%;
  z-index: 5;
`

const NotesWrapper = styled.div`
  position: relative;
`

const NoResultsText = styled(Text)`
  margin-top: 30px;
  text-align: center;
`

const ScoreRow = styled.div`
  display: flex;
  margin-bottom: 10px;
`

const ScoreText = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`

const SurveyCard = styled(Card)`
  cursor: pointer;
  display: flex;
  flex-direction: column;
  margin: 0 auto 20px;
  padding: 20px;
`

const SURVEY_SCORE = {
  1: {
    image: PoorFace,
    text: 'Poor',
  },
  2: {
    image: FairFace,
    text: 'Fair',
  },
  3: {
    image: OkFace,
    text: 'Ok',
  },
  4: {
    image: GoodFace,
    text: 'Good',
  },
  5: {
    image: GreatFace,
    text: 'Great',
  },
}

const ReviewerFeedback = ({ cta, feedbackScreens, handleBack, setActive, setSurveyId, setSurveys, surveyId, surveys }) => {
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)

  const followUpText = uId('follow-up-text')
  const fontSize = ['14px', '16px']

  useEffect(() => {
    const getSurveys = async () => {
      const {
        data: { success, surveys },
      } = await api.get('/survey/listFeedback')

      if (success) {
        setIsLoading(false)
        if (surveys.length === 0) {
          setSurveys([])
          return setHasMore(false)
        }

        setSurveys(surveys)
        setPage(page + 1)
      }
    }

    if (!surveys) getSurveys()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyId])

  const getMore = async () => {
    const {
      data: { success, surveys: moreSurveys },
    } = await api.get(`/survey/listFeedback?page=${page}`)

    if (success) {
      if (moreSurveys.length === 0) return setHasMore(false)

      setSurveys([...surveys, ...moreSurveys])
      setPage(page + 1)
    }
  }

  return (
    <Layout cta={cta} handleBack={handleBack} id='reviewer-feedback' inner noFooter title='View feedback'>
      <DynamicContainer id='scrollable-surveys-list'>
        <InfiniteSurveysScroll
          dataLength={surveys && surveys.length}
          hasMore={hasMore}
          loader={<Loader />}
          next={getMore}
          scrollableTarget='scrollable-surveys-list'
        >
          {surveys?.length > 0 &&
            surveys.map(({ comment, createdAt, followUpStatus, id, lowestScore, noteCount, recipientName }) => (
              <SurveyCard
                id={uId('survey-card')}
                key={id}
                onClick={() => {
                  setActive(feedbackScreens.DETAILS)
                  setSurveyId(id)
                }}
              >
                <ScoreRow>
                  <Face alt={uId('survey-emoji')} src={SURVEY_SCORE[lowestScore]?.image} width='50px' />
                  <ScoreText>
                    <Text color='gray1' fontSize={fontSize}>
                      Lowest Score: {SURVEY_SCORE[lowestScore]?.text}
                    </Text>
                    <Text fontSize={fontSize}>{moment(createdAt).fromNow()}</Text>
                  </ScoreText>
                  {noteCount > 0 && (
                    <NotesWrapper>
                      <Image alt={uId('survey-note')} src={NoteIcon} />
                      <NumberIndicator count={noteCount} ratio='18px' right='-10px' small top='-7px' />
                    </NotesWrapper>
                  )}
                </ScoreRow>
                <CardText color='gray1'>
                  Review on <b>{recipientName}</b>
                </CardText>
                {comment && <CardText>&quot;{comment}&quot;</CardText>}
                {followUpStatus !== FOLLOW_UP_STATUS.NONE && (
                  <FollowUpRow>
                    <Image
                      alt={uId('survey-followup-icon')}
                      id={uId('follow-up-image')}
                      src={followUpStatus === FOLLOW_UP_STATUS.REQUESTED ? InfoIcon2 : MatchIcon}
                    />
                    {followUpStatus === FOLLOW_UP_STATUS.REQUESTED ? (
                      <Text color='berry' id={followUpText}>
                        Follow-up requested
                      </Text>
                    ) : (
                      <Text id={followUpText}>Follow-up completed</Text>
                    )}
                  </FollowUpRow>
                )}
              </SurveyCard>
            ))}
          {surveys?.length === 0 && <NoResultsText fontWeight={700}>There is no feedback for your group.</NoResultsText>}
        </InfiniteSurveysScroll>
        <LoaderWrapper isLoading={isLoading}>
          <Loader />
        </LoaderWrapper>
      </DynamicContainer>
    </Layout>
  )
}

ReviewerFeedback.propTypes = {
  cta: PropTypes.object,
  feedbackScreens: PropTypes.object,
  handleBack: PropTypes.func.isRequired,
  setActive: PropTypes.func,
  setSurveyId: PropTypes.func,
  setSurveys: PropTypes.func,
  surveyId: PropTypes.number,
  surveys: PropTypes.array,
}

export default ReviewerFeedback
