import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { devices } from '@assets'
import { FeedbackDetails, ReviewerFeedback } from '@components'

const feedbackScreens = {
  LIST: 1,
  DETAILS: 2,
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
    width: 475px;
  }
`

const FeedbackWorkflow = ({ feedbackId, handleBack }) => {
  const [active, setActive] = useState(1)
  const [surveyId, setSurveyId] = useState(null)
  const [surveys, setSurveys] = useState(null)

  useEffect(() => {
    if (feedbackId) {
      setActive(feedbackScreens.DETAILS)
      setSurveyId(feedbackId)
    }
  }, [feedbackId])

  const followUpListData = {
    handleBack,
    setSurveyId,
    setSurveys,
    surveyId,
    surveys,
  }

  const followUpDetailsData = {
    handleBack: () => {
      setActive(feedbackScreens.LIST)
      setTimeout(() => setSurveyId(null), 500)
    },
    setSurveys,
    surveyId,
    surveys,
  }

  const components = [
    {
      Component: ReviewerFeedback,
      data: followUpListData,
    },
    {
      Component: surveyId && FeedbackDetails,
      data: followUpDetailsData,
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
              feedbackScreens={feedbackScreens}
              setActive={setActive}
            />
          )}
        </Container>
      ))}
    </Wrapper>
  )
}

FeedbackWorkflow.propTypes = {
  feedbackId: PropTypes.number,
  handleBack: PropTypes.func,
}

export default FeedbackWorkflow
