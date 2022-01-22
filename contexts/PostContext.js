import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useRouter } from 'next/router'

import { useAuthContext, useDraftContext, useUserContext } from '@contexts'
import { coreApi } from '@services'
import { GROUP_ACCESS_LEVELS as levels } from '@utils'

const PostContext = createContext({})

const postScreens = {
  DRAFTS_LIST: 1,
  DRAFT_POST: 2,
  UPLOAD_VIDEO: 3,
  IMAGE_EDITOR: 4,
  SUBMIT_PROFILE_IMAGE: 5,
}

export const PostProvider = ({ children }) => {
  const [autoFocusSearch, setAutoFocusSearch] = useState(false)
  const [selectedCpcTheme, setSelectedCpcTheme] = useState(null)
  const [selectedCpcType, setSelectedCpcType] = useState(null)
  const [selectedRecipient, setSelectedRecipient] = useState(null)
  const [shareCpcData, setShareCpcData] = useState(null)
  const [showPostWorkflow, setShowPostWorkflow] = useState(false)
  const [showSendCpc, setShowSendCpc] = useState(false)
  const [showShareCpc, setShowShareCpc] = useState(false)
  const [skipCpcSearch, setSkipCpcSearch] = useState(false)

  const { isAuthenticated } = useAuthContext()
  const { setWambiDraftId } = useDraftContext()
  const { user } = useUserContext()

  const hasAccess = useMemo(() => user?.groupAccessLevel > levels.TEAM_MEMBER, [user])
  const { isReady, pathname, query, replace } = useRouter()

  useEffect(() => {
    const getCpcType = async cpcTypeId => {
      const {
        data: { success, type },
      } = await coreApi.post('/wambi/types/getWambiTypeById', { cpcTypeId })

      if (success) setSelectedCpcType(type)
    }

    const getCpcTheme = async cpcThemeId => {
      const {
        data: { success, theme },
      } = await coreApi.post('/wambi/themes/getWambiThemeById', { cpcThemeId })

      if (success) setSelectedCpcTheme(theme)
    }

    // Shows the CPC workflow if the sendCpc or sendWambi query param exists...KA
    if ((query?.sendCpc === 'true' || query?.sendWambi === 'true') && isReady && isAuthenticated) {
      setShowSendCpc(true)

      // temporarily allowing for both cpc and wambi query params as to now break any previously created links...JK
      if (query.cpcTypeId) getCpcType(query.cpcTypeId)
      else if (query.cpcThemeId) getCpcTheme(query.cpcThemeId)

      if (query.wambiTypeId) getCpcType(query.wambiTypeId)
      else if (query.wambiThemeId) getCpcTheme(query.wambiThemeId)

      if (query.wambiDraftId) setWambiDraftId(query.wambiDraftId)
      replace(pathname)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isReady, query])

  // open post modal via query params...JK
  useEffect(() => {
    if (hasAccess && isAuthenticated && (query?.sendPost === 'true' || query?.sendAnnouncement === 'true')) {
      setShowPostWorkflow(true)
      replace(pathname)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess, isAuthenticated, query])

  return (
    <PostContext.Provider
      value={{
        autoFocusSearch,
        postScreens,
        selectedCpcTheme,
        selectedCpcType,
        selectedRecipient,
        setAutoFocusSearch,
        setSelectedCpcTheme,
        setSelectedCpcType,
        setSelectedRecipient,
        setShareCpcData,
        setShowPostWorkflow,
        setShowSendCpc,
        setShowShareCpc,
        setSkipCpcSearch,
        shareCpcData,
        showPostWorkflow,
        showSendCpc,
        showShareCpc,
        skipCpcSearch,
      }}
    >
      {children}
    </PostContext.Provider>
  )
}

PostProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
}

export const usePostContext = () => useContext(PostContext)
