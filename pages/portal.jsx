import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { parseCookies } from 'nookies'
import styled from 'styled-components'
import { api } from '@services'

import { colors } from '@assets'
import {
  DaisyAward,
  EmployeeSearch,
  Loader,
  LocationSearch,
  PortalLogin,
  ReviewComplete,
  ShareGratitude,
  SurveyComments,
  SurveyQuestions,
} from '@components'
import { useAuthContext, useLangContext, useReviewerContext } from '@contexts'

const portalScreens = {
  LOCATION: 1,
  LOGIN: 2,
  PERSON: 3,
  SURVEY: 4,
  COMMENTS: 5,
  GRATITUDE: 6,
  DAISY: 7,
  COMPLETE: 8,
}

const Container = styled.div`
  flex: 0 0 100%;
  height: 100%;
  opacity: ${p => (p.active === p.index ? 1 : 0)};
  transform: translateX(${p => (p.active - 1) * -100}%);
  transition: all 500ms cubic-bezier(0.88, 0.03, 0.09, 0.98);
  width: 100%;
`

const LoaderWrapper = styled.div`
  align-items: center;
  background-color: ${colors.gray8};
  bottom: 0;
  display: flex;
  height: 100%;
  justify-content: center;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  width: 100%;
`

const Wrapper = styled.div`
  align-items: flex-start;
  background-color: ${colors.gray8};
  display: flex;
  flex-wrap: nowrap;
  height: 100vh;
`

const Portal = () => {
  const { clientAccount } = useAuthContext()
  const { lang } = useLangContext()
  const { setIsReturningVolunteer } = useReviewerContext()

  const router = useRouter()
  const { query } = router

  const [active, setActive] = useState(portalScreens.LOCATION)
  const [isLoading, setIsLoading] = useState(false)
  const [questions, setQuestions] = useState([])
  const [reviewData, setReviewData] = useState({
    answers: [],
    comment: '',
    contactInfo: {
      contact: false,
      email: '',
      firstName: '',
      lastName: '',
      mobile: '',
    },
    daisyInfo: null,
    gratitude: '',
    groupId: query?.groupId || '',
    location: null,
    noQuestions: false,
    person: null,
    portalId: '',
    questionSetId: null,
  })

  useEffect(() => {
    const { review_tkn } = parseCookies()

    if (active === portalScreens.LOCATION) {
      setActive(portalScreens.LOCATION)
    } else if (review_tkn && review_tkn.split('.')[2] && active === portalScreens.LOGIN) {
      setActive(portalScreens.PERSON)
    } else if (review_tkn && review_tkn.split('.')[2]) {
      setActive(active)
    } else {
      setActive(portalScreens.LOGIN)
    }

    if (active === portalScreens.COMPLETE) {
      setReviewData(data => ({
        ...data,
        answers: [],
        comment: '',
        contactInfo: {
          ...data.contactInfo,
          contact: false,
        },
        daisyInfo: null,
        gratitude: '',
        groupId: null,
        person: null,
        questionSetId: null,
      }))
    }
  }, [active])

  useEffect(() => {
    const getReviewData = async () => {
      const {
        data: { awards, questions, success },
      } = await api.post('/portal/survey/getQuestions', {
        groupId: reviewData.groupId,
        lang,
        peopleId: reviewData.person.id,
        sid: reviewData.portalId,
      })

      if (success) {
        setQuestions(questions)

        if (questions && questions[0]) {
          setReviewData(data => ({ ...data, questionSetId: questions[0].questionSetId }))
          setActive(portalScreens.SURVEY)
        } else {
          setReviewData(data => ({ ...data, noQuestions: true }))
        }

        if (awards?.some(a => a.awardType === 'daisy')) {
          setReviewData(data => ({
            ...data,
            daisyInfo: {
              awardTypeId: awards.filter(a => a.awardType === 'daisy')[0].id,
              comment: '',
              email: '',
              firstName: '',
              lastName: '',
              mobile: '',
              nominatorType: 'patient',
            },
          }))
        }
      }
    }

    if (reviewData.groupId && reviewData.person && reviewData.portalId) {
      getReviewData()
    }
  }, [lang, reviewData.groupId, reviewData.person, reviewData.portalId])

  // If chatbot user is a volunteer, update global state so employees page can load the returning modal...JC
  useEffect(() => {
    if (query.isVolunteer) {
      setIsReturningVolunteer(true)
      delete query.isVolunteer
      router.replace({ query })
    }
    //eslint-disable-next-line
  }, [query])

  const submitReview = async () => {
    setIsLoading(true)

    const { data } = await api.post('/portal/survey/submitSurvey', reviewData)

    if (data.success) setActive(portalScreens.COMPLETE)
    else alert('Error submitting survey, please try again.')

    setIsLoading(false)
  }

  const completeData = {
    donationLink: reviewData.location?.donationLink || '',
  }

  const daisyData = {
    submitReview,
  }

  const locationData = {
    query,
  }

  const personSearchData = {
    query,
  }

  const gratitudeData = {
    commentPromptThreshold: reviewData.location?.commentPromptThreshold,
    showCpcText: clientAccount?.settings?.surveys?.disableWambiWebPublish !== true,
    showDaisy: reviewData.daisyInfo != null,
    submitReview,
  }

  const questionsData = {
    commentPromptThreshold: reviewData.location?.commentPromptThreshold || 3,
    questions,
  }

  const surveyCommentsData = {
    // Convert to bool so we don't render 0 / pass down wrong prop type...JC
    showContactToggle: Boolean(reviewData?.location?.showReviewFollowup),
  }

  const components = [
    {
      Component: LocationSearch,
      data: locationData,
    },
    {
      Component: PortalLogin,
      data: {},
    },
    {
      Component: EmployeeSearch,
      data: personSearchData,
    },
    {
      Component: SurveyQuestions,
      data: questionsData,
    },
    {
      Component: SurveyComments,
      data: surveyCommentsData,
    },
    {
      Component: ShareGratitude,
      data: gratitudeData,
    },
    {
      Component: DaisyAward,
      data: daisyData,
    },
    {
      Component: ReviewComplete,
      data: completeData,
    },
  ]

  return (
    <>
      {isLoading ? (
        <LoaderWrapper>
          <Loader />
        </LoaderWrapper>
      ) : (
        <Wrapper>
          {components.map(({ Component, data }, i) => (
            <Container active={active} index={i + 1} key={i}>
              {Component && active === i + 1 && (
                <Component
                  {...data}
                  active={active}
                  reviewData={reviewData}
                  portalScreens={portalScreens}
                  setActive={setActive}
                  setReviewData={setReviewData}
                />
              )}
            </Container>
          ))}
        </Wrapper>
      )}
    </>
  )
}

export default Portal
