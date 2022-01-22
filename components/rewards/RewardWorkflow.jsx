import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices, StarIcon } from '@assets'
import {
  BubblePop,
  ClaimDetails,
  ClaimReward,
  GiveAGift,
  RewardDetails,
  RewardList,
  RewardProgressList,
  SearchPersonToGift,
} from '@components'
import { useRewardContext, useToastContext } from '@contexts'
import { api } from '@services'

const Container = styled.div`
  flex: 0 0 100%;
  height: 100%;
  opacity: ${p => (p.active === p.index ? 1 : 0)};
  transform: translateX(${p => (p.active - 1) * -100}%);
  transition: all 500ms cubic-bezier(0.88, 0.03, 0.09, 0.98);
  width: 100%;
`

const Wrapper = styled.div`
  align-items: flex-start;
  background-color: ${colors.gray8};
  display: flex;
  flex-wrap: nowrap;
  height: 100%;
  width: 100%;

  @media (${devices.desktop}) {
    background-color: ${colors.white};
  }
`

const RewardWorkflow = ({ bubbleAmount, handleBack, rewardClaimId, sentReward, setIsBubbleActive, selectedActive, ...props }) => {
  const [active, setActive] = useState(rewardClaimId ? 2 : selectedActive ? selectedActive : 1)
  const [error, setError] = useState(null)

  const [gameComplete, setGameComplete] = useState(false)
  const [giftClaimed, setGiftClaimed] = useState(false)
  const [reward, setReward] = useState(null)
  const [rewardList, setRewardList] = useState([])
  const [selectedPerson, setSelectedPerson] = useState(null)

  const {
    openRewardWorkflow,
    rewardDetails,
    rewardScreens,
    setOpenRewardWorkflow,
    setRewardProgressId,
    setSelectedActive,
    setUpdateRewardProgress,
  } = useRewardContext()
  const { setToastData } = useToastContext()
  const { beforePopState, pathname, replace } = useRouter()

  const handleClose = () => {
    rewardClaimId && handleBack()
    resetState()
    // If game was completed, call setUpdateRewardProgress so reward progress widget updates...JC
    if ((pathname.includes('profile') || pathname.includes('newsfeed')) && active > rewardScreens.BUBBLE_POP && gameComplete)
      setUpdateRewardProgress(true)
  }

  const resetState = () => {
    setError(null)
    setGameComplete(false)
    setGiftClaimed(false)
    setOpenRewardWorkflow(false)
    setReward(null)
    setRewardProgressId(null)
    setSelectedActive(null)
    setSelectedPerson(null)
    setTimeout(() => setActive(rewardScreens.BUBBLE_POP), 500)
  }

  const submitClaim = async ({ data, hasAddress = false } = {}) => {
    const {
      data: { msg, success },
    } = await api.post('/reward/claimReward', {
      rewardClaimId: reward.rewardClaimId,
      userData: {
        ...data,
        // format state to have upper case...PS
        state: data?.state.toUpperCase(),
        // remove dashes from mobile number...PS
        mobile: data?.mobile.replace(/\D/g, ''),
      },
    })
    if (success) {
      // updates reward list item with new status...PS
      setRewardList(rewardList => rewardList.map(r => (r.id === reward.rewardClaimId ? { ...r, claimedAt: true } : r)))
      // show confirmation element...PS
      setGiftClaimed(true)
      // if hasAddress return to claim...PS
      if (hasAddress) setActive(rewardScreens.CLAIM_REWARD)
    } else setError(msg)
  }

  const submitGiveGift = async sendNote => {
    const {
      data: { msg, success },
    } = await api.post('/reward/sendReward', {
      rewardClaimId: reward.rewardClaimId,
      selectedPersonId: selectedPerson.id,
      sendNote,
    })
    if (success) {
      handleClose()

      setToastData({
        callout: 'Surprise sent!',
        icon: StarIcon,
        id: 'gift-sent-toast',
        spin: true,
      })
    } else if (!success) {
      setError(msg)
    }
  }

  const bubblePopData = {
    ...props,
    bubbleAmount,
    setActive,
    handleClose,
    setGameComplete,
    setReward,
  }

  const claimRewardData = {
    ...props,
    error,
    handleClose,
    gameComplete,
    giftClaimed,
    reward,
    rewardClaimId,
    setActive,
    setRewardList,
    setOpenRewardWorkflow,
    setReward,
    submitClaim,
  }

  const shippingData = {
    ...props,
    reward,
    error,
    setGiftClaimed,
    submitClaim,
  }

  const searchPersonToGiftData = {
    ...props,
    reward,
    selectedPerson,
    setActive,
    setSelectedPerson,
  }

  const sendGiftData = {
    ...props,
    error,
    reward,
    selectedPerson,
    setActive,
    submitGiveGift,
  }

  const rewardListData = {
    ...props,
    handleClose,
    reward,
    selectedActive,
    setReward,
  }

  const rewardDetailsData = {
    ...props,
    handleClose,
    reward,
    rewardScreens,
  }

  const rewardProgressData = {
    ...props,
    handleClose,
    rewardList,
    rewardScreens,
    setGiftClaimed,
    setReward,
    setRewardList,
    updatedRewardList: reward,
  }

  const components = [
    {
      Component: BubblePop,
      data: bubblePopData,
    },
    {
      Component: reward && ClaimReward,
      data: claimRewardData,
    },
    {
      Component: reward && ClaimDetails,
      data: shippingData,
    },
    {
      Component: active === rewardScreens.PEOPLE_SEARCH && SearchPersonToGift,
      data: searchPersonToGiftData,
    },
    {
      Component: reward && selectedPerson && GiveAGift,
      data: sendGiftData,
    },
    {
      Component: reward && active === rewardScreens.REWARD_LIST && RewardList,
      data: rewardListData,
    },
    {
      Component: reward && RewardDetails,
      data: rewardDetailsData,
    },
    {
      Component: active === rewardScreens.PROGRESS_REWARD_LIST && RewardProgressList,
      data: rewardProgressData,
    },
  ]

  // Set data for sent gift...PS
  useEffect(() => {
    if (rewardClaimId) setReward(sentReward)
  }, [rewardClaimId, sentReward])

  useEffect(() => {
    if (!rewardClaimId && rewardDetails) setReward(rewardDetails)
  }, [rewardClaimId, rewardDetails])

  useEffect(() => {
    if (setIsBubbleActive) {
      if (active === rewardScreens.BUBBLE_POP) return setIsBubbleActive(true)
      setIsBubbleActive(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  useEffect(() => {
    if (openRewardWorkflow) {
      beforePopState(() => {
        resetState()
        replace(pathname)
      })
    }

    return () => beforePopState(() => true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Wrapper>
      {components.map(({ Component, data }, i) => (
        <Container active={active} index={i + 1} key={i}>
          {Component && (
            <Component
              {...data}
              active={active}
              cta={{ onClick: handleClose, text: 'Close' }}
              rewardScreens={rewardScreens}
              setActive={setActive}
            />
          )}
        </Container>
      ))}
    </Wrapper>
  )
}

RewardWorkflow.propTypes = {
  bubbleAmount: PropTypes.number,
  handleBack: PropTypes.func,
  rewardClaimId: PropTypes.number,
  selectedActive: PropTypes.number,
  sentReward: PropTypes.object,
  setIsBubbleActive: PropTypes.func,
}

export default RewardWorkflow
