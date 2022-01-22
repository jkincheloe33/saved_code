import { useEffect, useState } from 'react'
import { createContext, useContext } from 'react'
import PropTypes from 'prop-types'
import { parseCookies } from 'nookies'

import { api } from '@services'

const ReviewerContext = createContext({})

export const ReviewerProvider = ({ children }) => {
  const [isReturningVolunteer, setIsReturningVolunteer] = useState(false)
  const [openVolunteerModal, setOpenVolunteerModal] = useState(false)
  const [reviewer, setReviewer] = useState(null)

  const resetReviewerContext = () => {
    setIsReturningVolunteer(false)
    setOpenVolunteerModal(false)
    setReviewer(null)
  }

  const { review_tkn } = parseCookies()
  const validReviewTkn = review_tkn?.split('.')[2]

  // Anytime valid reviewer needs to refetch data (page reload) or get review data after verifying w/ chatbot...JC
  useEffect(() => {
    const getReviewerData = async () => {
      const {
        data: { reviewer, success },
      } = await api.get('/portal/reviewer/getReviewerData')

      if (success) setReviewer(reviewer)
    }

    if (validReviewTkn && !reviewer) {
      getReviewerData()
    }
  }, [reviewer, validReviewTkn])

  return (
    <ReviewerContext.Provider
      value={{
        isReturningVolunteer,
        openVolunteerModal,
        resetReviewerContext,
        reviewer,
        setIsReturningVolunteer,
        setOpenVolunteerModal,
        setReviewer,
      }}
    >
      {children}
    </ReviewerContext.Provider>
  )
}

ReviewerProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
}

export const useReviewerContext = () => useContext(ReviewerContext)
