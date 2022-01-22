import { createContext, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { useAuthContext } from '@contexts'
import { coreApi } from '@services'

const DraftContext = createContext({})

export const DraftProvider = ({ children }) => {
  const [cpcDraftCount, setCpcDraftCount] = useState(0)
  const [cpcDraftData, setCpcDraftData] = useState(null)
  const [postDraftCount, setPostDraftCount] = useState(0)
  const [showDraftsList, setShowDraftsList] = useState(false)
  const [wambiDraftId, setWambiDraftId] = useState(null)
  const { isAuthenticated } = useAuthContext()

  const getDraftCounts = async () => {
    const {
      data: { cpcs, posts, success },
    } = await coreApi.get('/feedItemDraft/getCount')

    if (success) {
      setCpcDraftCount(cpcs ? cpcs.draftCount : 0)
      setPostDraftCount(posts ? posts.draftCount : 0)
    }
  }

  useEffect(() => {
    if (isAuthenticated) getDraftCounts()
  }, [isAuthenticated, showDraftsList])

  return (
    <DraftContext.Provider
      value={{
        cpcDraftCount,
        cpcDraftData,
        postDraftCount,
        getDraftCounts,
        setCpcDraftCount,
        setCpcDraftData,
        setPostDraftCount,
        setShowDraftsList,
        setWambiDraftId,
        showDraftsList,
        wambiDraftId,
      }}
    >
      {children}
    </DraftContext.Provider>
  )
}

DraftProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
}

export const useDraftContext = () => useContext(DraftContext)
