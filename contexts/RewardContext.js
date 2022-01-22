import { createContext, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useRouter } from 'next/router'

import { useAuthContext, useUserContext } from '@contexts'
import { api } from '@services'

const RewardContext = createContext({})

const rewardScreens = {
  BUBBLE_POP: 1,
  CLAIM_REWARD: 2,
  CLAIM_DETAILS: 3,
  PEOPLE_SEARCH: 4,
  GIVE_A_GIFT: 5,
  REWARD_LIST: 6,
  REWARD_DETAIL: 7,
  PROGRESS_REWARD_LIST: 8,
}

export const RewardProvider = ({ children }) => {
  const [initialProgressReady, setInitialProgressReady] = useState(false)
  const [openRewardWorkflow, setOpenRewardWorkflow] = useState(false)
  const [rewardDetails, setRewardDetails] = useState(null)
  const [rewardProgress, setRewardProgress] = useState(null)
  const [rewardProgressId, setRewardProgressId] = useState(null)
  const [selectedActive, setSelectedActive] = useState(null)
  const [updateRewardProgress, setUpdateRewardProgress] = useState(false)

  const { pathname } = useRouter()

  const { isAuthenticated } = useAuthContext()
  const { user } = useUserContext()

  const getRewardDetail = async ({ claimedBy, rewardClaimId }) => {
    const {
      data: { reward, success },
    } = await api.post('/reward/getRewardDetails', { claimedBy, rewardClaimId })

    if (success) setRewardDetails(reward)
  }

  const getRewardProgress = async () => {
    const {
      data: { success, rewardProgress },
    } = await api.post('/reward/getRewardProgress')

    if (success) setRewardProgress(rewardProgress)
  }

  // check that auth and user contexts have loaded and user is not selfRegistered (${initialProgressReady} needed to prevent getRewardProgress from running twice on page refresh)...JK & JC
  useEffect(() => {
    const getRewardProgressByUrls = ['/newsfeed', '/profile']

    if (isAuthenticated && user && !user.isSelfRegistered && getRewardProgressByUrls.includes(pathname)) setInitialProgressReady(true)
  }, [isAuthenticated, pathname, user])

  // once ${initialProgressReady} is true & rewardProgress is still null, run getRewardProgress...JK
  useEffect(() => {
    if (initialProgressReady && !rewardProgress) getRewardProgress()
  }, [initialProgressReady, rewardProgress])

  useEffect(() => {
    // Refresh reward progress play count when user plays a game and reloads profile...JC
    if (updateRewardProgress) {
      setUpdateRewardProgress(false)
      getRewardProgress()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateRewardProgress])

  return (
    <RewardContext.Provider
      value={{
        getRewardDetail,
        getRewardProgress,
        openRewardWorkflow,
        rewardDetails,
        rewardProgress,
        rewardProgressId,
        rewardScreens,
        selectedActive,
        setOpenRewardWorkflow,
        setRewardProgress,
        setRewardProgressId,
        setSelectedActive,
        setUpdateRewardProgress,
        updateRewardProgress,
      }}
    >
      {children}
    </RewardContext.Provider>
  )
}

RewardProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
}

export const useRewardContext = () => useContext(RewardContext)
