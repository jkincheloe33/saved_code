import { createContext, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { useAuthContext } from '@contexts'
import { coreApi } from '@services'

const ReactionsContext = createContext({})

export const ReactionsProvider = ({ children }) => {
  const { isAuthenticated } = useAuthContext()

  const [availableReactions, setAvailableReactions] = useState([])
  const [postingReaction, setPostingReaction] = useState(false)

  useEffect(() => {
    const getAvailableReactions = async () => {
      const {
        data: { reactions, success },
      } = await coreApi.get('/newsfeed/reactionList')

      if (success) setAvailableReactions(reactions)
    }

    if (isAuthenticated) getAvailableReactions()
  }, [isAuthenticated])

  return (
    <ReactionsContext.Provider value={{ availableReactions, postingReaction, setPostingReaction }}>{children}</ReactionsContext.Provider>
  )
}

ReactionsProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
}

export const useReactionsContext = () => useContext(ReactionsContext)
