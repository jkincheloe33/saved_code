import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled, { keyframes } from 'styled-components'

import { colors, gradients, shadows, WambiLogo } from '@assets'
import { Image } from '@components'
import { useRewardContext } from '@contexts'
import { useInterval } from '@utils'

const TIMING = 1500

const progress = (endProgress, startProgress) => keyframes`
  from { width: ${startProgress}% }
  to { width: ${endProgress}% }
`

const ProgressBar = styled.div`
  animation: ${p => progress(p.endProgress, p.startProgress)} ${TIMING}ms ${p => (p.loop ? 'infinite' : 'forwards')};
  align-items: center;
  border-radius: inherit;
  background: ${gradients.blurple};
  display: flex;
  height: 18px;
  position: relative;
  transform: translateY(-4px);
`

const ProgressIcon = styled.div`
  align-items: center;
  background-color: ${colors.white};
  border-radius: 50%;
  box-shadow: ${shadows.card};
  display: flex;
  height: 40px;
  justify-content: center;
  left: 92%;
  position: absolute;
  width: 40px;
`

const Wrapper = styled.div`
  border-radius: 50px;
  background: ${colors.gray5};
  height: 10px;
  margin-top: ${p => p.spacing}px;
  width: 100%;
`

const RewardProgressBar = ({
  animate = false,
  canAddPlays = false,
  overallProgress,
  setBarCompleted,
  setOpenPecksPopup,
  spacing = 0,
  startProgress = 1,
}) => {
  const { rewardProgress, setRewardProgress } = useRewardContext()
  const [progress, setProgress] = useState(overallProgress)
  const ref = useRef(null)
  const maxAddedPlays = Math.floor((overallProgress + startProgress) / 100) + rewardProgress?.plays

  useEffect(() => {
    setProgress(overallProgress)
  }, [overallProgress])

  useInterval(() => {
    if (progress > 100 && animate) {
      setProgress(progress => progress - 100)
      if (maxAddedPlays >= rewardProgress.plays && canAddPlays) setRewardProgress(progress => ({ ...progress, plays: progress.plays + 1 }))
    }
  }, TIMING)

  useEffect(() => {
    if (progress < overallProgress && overallProgress > 100 && setBarCompleted) {
      setBarCompleted(true)
    }
    if (progress === overallProgress % 100 && setOpenPecksPopup) {
      setTimeout(() => setOpenPecksPopup(true), TIMING)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress])

  return (
    <Wrapper spacing={spacing}>
      <ProgressBar
        startProgress={animate ? (progress < overallProgress ? 1 : startProgress) : progress % 100}
        endProgress={progress > 100 && animate ? 100 : progress % 100}
        ref={ref}
        loop={progress > 100}
      >
        <ProgressIcon>
          <Image alt='Wambi Logo' src={WambiLogo} width='25px' />
        </ProgressIcon>
      </ProgressBar>
    </Wrapper>
  )
}

RewardProgressBar.propTypes = {
  animate: PropTypes.bool,
  canAddPlays: PropTypes.bool,
  overallProgress: PropTypes.number,
  setBarCompleted: PropTypes.func,
  setOpenPecksPopup: PropTypes.func,
  spacing: PropTypes.number,
  startProgress: PropTypes.number,
}

export default RewardProgressBar
