import { useEffect, useState } from 'react'
import styled from 'styled-components'

import { FeatureWidget, PlayButton, RewardProgressBar, Text } from '@components'
import { useCelebrationContext, useRewardContext } from '@contexts'

const ProgressWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 0 auto;
  width: 100%;
`

const RewardText = styled(Text)`
  margin-bottom: 28px;
`

const RewardProgressWidget = () => {
  const [updateReward, setUpdateReward] = useState({
    startAnimation: false,
    endProgress: null,
    startProgress: null,
  })

  const { celebration } = useCelebrationContext()
  const { rewardProgress, rewardScreens, setOpenRewardWorkflow, setSelectedActive } = useRewardContext()
  const { rewardProgress: updatedRewardProgress } = { ...celebration }

  // Update widget progress bar user reward progress updates...CY
  useEffect(() => {
    if (updatedRewardProgress) {
      const { overallProgress, startProgress } = updatedRewardProgress
      setUpdateReward({
        startAnimation: true,
        overallProgress,
        startProgress,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatedRewardProgress])

  return (
    <FeatureWidget
      title='My Progress'
      viewAll={{
        id: 'view-all-reward-progress',
        onClick: () => {
          setSelectedActive(rewardScreens.PROGRESS_REWARD_LIST)
          setOpenRewardWorkflow(true)
        },
      }}
    >
      <ProgressWrapper>
        <RewardText fontSize='14px' noClamp>
          Be active on Wambi to unlock surprises
        </RewardText>
        <RewardProgressBar
          animate={updateReward.startAnimation}
          overallProgress={updateReward.overallProgress || rewardProgress.currentProgress}
          startProgress={updateReward.startProgress}
        />
        {rewardProgress.plays > 0 && <PlayButton plays={rewardProgress.plays} />}
      </ProgressWrapper>
    </FeatureWidget>
  )
}

RewardProgressWidget.propTypes = {}

export default RewardProgressWidget
