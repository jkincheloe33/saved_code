import { createContext, useContext, useState } from 'react'
import PropTypes from 'prop-types'

import { CELEBRATION_TYPES } from '@utils'

const CelebrationContext = createContext({})

export const CelebrationProvider = ({ children }) => {
  const initialState = {
    completeChallenges: [],
    rewardProgress: null,
    type: CELEBRATION_TYPES.CHALLENGE_COMPLETE,
  }

  const [celebration, setData] = useState(initialState)

  // Preserve type default until it's overriden...JC
  const setCelebration = ({ ...newVal }) => setData({ ...celebration, ...newVal })

  const resetCelebration = () => setCelebration(initialState)

  return <CelebrationContext.Provider value={{ celebration, resetCelebration, setCelebration }}>{children}</CelebrationContext.Provider>
}

CelebrationProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
}

export const useCelebrationContext = () => useContext(CelebrationContext)
