import { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { devices, PoorFace, FairFace, OkFace, GoodFace, GreatFace } from '@assets'
import { EmployeeTile, Image, Paragraph, PortalLayout, ProgressBar, SurveyHeader, Text } from '@components'
import { useLangContext } from '@contexts'

const Divider = styled.div`
  border: 1px solid #f2f2f2;
  height: 1px;
  width: 100%;
`

const PersonTile = styled(EmployeeTile)`
  cursor: auto;
  margin: 30px;
  max-width: 255px;
  width: 55vw;
`

const ProgressWrapper = styled.div`
  width: 115px;
`

const Question = styled.div`
  display: flex;
  max-width: 437px;
  transform: translateX(${p => (p.currentIndex - 1) * -100}%);
  transition: transform 500ms cubic-bezier(0.93, 0.02, 0.07, 0.98);
  width: 100%;
`

const QuestionText = styled(Paragraph)`
  backface-visibility: hidden;
  cursor: ${p => (p.index === p.currentIndex ? 'auto' : 'default')};
  flex: 0 0 100%;
  line-height: 28px;
  margin: 30px 0;
  opacity: ${p => (p.index === p.currentIndex ? 1 : 0)};
  text-align: center;
  transition: opacity 500ms cubic-bezier(0.93, 0.02, 0.07, 0.98);
  -webkit-backface-visibility: hidden;

  @media (${devices.tablet}) {
    margin: 45px 0;
    font-size: 26px;
  }
`

const RatingBtn = styled(Image)`
  cursor: pointer;
  transition: transform 250ms ease;
  width: 52px;

  &:hover {
    transform: scale(1.1);
  }

  @media (${devices.tablet}) {
    width: 69px;
  }
`

const RatingBtnContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  padding: 7.5px;
`

const RatingBtnText = styled(Text)`
  @media (${devices.tablet}) {
    font-size: 16px;
  }
`

const SurveyAnswerContainer = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 60px;
  width: calc(100% + 15px);
`

const SurveyLayoutContent = styled.section`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
`

const scores = [
  { rating: 1, icon: PoorFace, label: 'Poor' },
  { rating: 2, icon: FairFace, label: 'Fair' },
  { rating: 3, icon: OkFace, label: 'Ok' },
  { rating: 4, icon: GoodFace, label: 'Good' },
  { rating: 5, icon: GreatFace, label: 'Great' },
]

const SurveyQuestions = ({ commentPromptThreshold, portalScreens, questions, reviewData, setActive, setReviewData }) => {
  const { getText } = useLangContext()

  const [currentQuestion, setCurrentQuestion] = useState(reviewData.answers.length + 1)

  const handleRatingClick = async rating => {
    setReviewData(s => ({
      ...s,
      answers: [
        ...s.answers,
        {
          rating,
          questionId: questions[currentQuestion - 1].id,
        },
      ],
    }))

    if (currentQuestion === questions.length) {
      // filters the answers to see if any have ratings below the commentPromptThreshold
      const hasLowRatings = reviewData.answers.some(a => a.rating <= commentPromptThreshold)

      if ((hasLowRatings || rating <= commentPromptThreshold) && commentPromptThreshold !== 0) setActive(portalScreens.COMMENTS)
      else setActive(portalScreens.GRATITUDE)
    } else {
      setCurrentQuestion(q => q + 1)
    }
  }

  const handleBack = () => {
    if (currentQuestion === 1) {
      setActive(portalScreens.PERSON)
      setReviewData({ ...reviewData, answers: [], daisyInfo: null, groupId: '' })
    } else {
      reviewData.answers.pop()
      setCurrentQuestion(q => q - 1)
    }
  }

  return (
    <PortalLayout noHeader>
      <SurveyHeader onBackPress={handleBack}>
        <ProgressWrapper>
          <ProgressBar
            colors={{ background: 'lightestPurple', complete: 'brightPurple', progress: 'brightPurple' }}
            label={`${currentQuestion} / ${questions.length}`}
            max={questions.length}
            progress={currentQuestion}
          />
        </ProgressWrapper>
      </SurveyHeader>
      <SurveyLayoutContent>
        <PersonTile {...reviewData.person} single />
        <Divider />
        <Question currentIndex={currentQuestion}>
          {questions.map(({ question }, i) => (
            <QuestionText color='darkBlue' currentIndex={currentQuestion} fontSize='20px' fontWeight={700} index={i + 1} key={i}>
              {question}
            </QuestionText>
          ))}
        </Question>
        <SurveyAnswerContainer>
          {scores.map(({ icon, label, rating }, i) => {
            return (
              <RatingBtnContainer key={i}>
                <RatingBtn onClick={() => handleRatingClick(rating)} src={icon} />
                <RatingBtnText color='darkBlue' fontSize='14px' fontWeight={700}>
                  {getText(label)}
                </RatingBtnText>
              </RatingBtnContainer>
            )
          })}
        </SurveyAnswerContainer>
      </SurveyLayoutContent>
    </PortalLayout>
  )
}

SurveyQuestions.propTypes = {
  commentPromptThreshold: PropTypes.number,
  person: PropTypes.object,
  portalScreens: PropTypes.object,
  questions: PropTypes.array,
  reviewData: PropTypes.object,
  setActive: PropTypes.func,
  setReviewData: PropTypes.func,
}

export default SurveyQuestions
