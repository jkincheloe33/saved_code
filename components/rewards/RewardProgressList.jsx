import { useEffect, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices } from '@assets'
import { DynamicContainer, Layout, Loader, PlayButton, RewardCard, RewardProgressBar, Text } from '@components'
import { useRewardContext } from '@contexts'
import { api } from '@services'
import { REWARD_GIFT_STATUS } from '@utils'

const InfiniteRewardScroll = styled(InfiniteScroll)`
  display: flex;
  flex-direction: column;
`

const ProgressWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 0 auto 25px;
  padding: 10px 0;
  width: 90%;

  @media (${devices.tablet}) {
    background-color: ${colors.white};
    max-width: 373px;
  }
`

const RewardListWrapper = styled(DynamicContainer)`
  background-color: ${colors.gray8};
  margin-bottom: 2rem;
  padding: 20px 0;

  @media (${devices.tablet}) {
    background-color: ${colors.white};
  }
`

const RewardText = styled(Text)`
  margin-bottom: 1rem;
  width: 100%;
`

const RewardProgressList = ({ cta, handleClose, rewardList, setActive, setGiftClaimed, setReward, setRewardList, updatedRewardList }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const { getRewardDetail, rewardProgress, rewardScreens, setSelectedActive } = useRewardContext()

  const wrapperId = 'scrollable-rewardsProgress-list'

  const getMore = async () => {
    const {
      data: { list: newRewards, success },
    } = await api.post('/reward/rewardProgressList', { page })
    if (success) {
      setHasMore(newRewards.length > 0)
      setPage(p => p + 1)
      setRewardList([...rewardList, ...newRewards])
    }
  }

  const openDetails = reward => {
    getRewardDetail(reward)
    setReward(reward)
    setActive(rewardScreens.REWARD_DETAIL)
  }

  const openRewardScreen = reward => {
    const { giftEndDate, claimExpiresAt, hasInventory, rewardProgressId, status } = reward
    const expiredClaim = new Date() > new Date(claimExpiresAt)
    const expiredGift = giftEndDate && new Date() > new Date(giftEndDate)
    const isActive = status === REWARD_GIFT_STATUS.ACTIVE || status === REWARD_GIFT_STATUS.MANUAL

    getRewardDetail(reward)
    setReward(reward)
    setActive(
      /* statement is true if:
       - there is no inventory but has a rewardProgressId -> reward list
       - the claim isn't expired but the gift has -> reward list
       - if it's not active -> reward list...PS */
      (!hasInventory && rewardProgressId) || (!expiredClaim && expiredGift) || !isActive
        ? rewardScreens.REWARD_LIST
        : rewardScreens.CLAIM_REWARD
    )
    // send the user to the correct screen when choosing another gift...PS
    if (screen === rewardScreens.CLAIM_REWARD) setSelectedActive(null)
    else setSelectedActive(rewardScreens.PROGRESS_REWARD_LIST)
  }

  const screenHandler = reward => {
    const { claimedAt: claimed, claimExpiresAt, giftEndDate, rewardProgressId, sentByMe, status } = reward
    const expiredClaim = new Date() > new Date(claimExpiresAt)
    const expiredGift = giftEndDate && new Date() > new Date(giftEndDate)
    const isActive = status === REWARD_GIFT_STATUS.ACTIVE || status === REWARD_GIFT_STATUS.MANUAL

    if (
      isActive &&
      (sentByMe ||
        claimed ||
        expiredClaim ||
        // if the reward is a winning raffle and the gift end date has not passed then go to reward details...PS
        (!rewardProgressId && expiredGift))
    )
      return openDetails(reward)
    // if the gift is deactivated and has been sent by me || is a raffle win || has been claimed then route the user to reward details...PS
    else if (!isActive && (sentByMe || !rewardProgressId || claimed)) return openDetails(reward)

    return openRewardScreen(reward)
  }

  useEffect(() => {
    setIsLoading(true)

    const getList = async () => {
      const {
        data: { list, success },
      } = await api.post('/reward/rewardProgressList')
      if (success) {
        setHasMore(list.length > 0)
        setPage(1)
        setRewardList(list)
        setIsLoading(false)
      }
    }
    getList()
  }, [setRewardList, updatedRewardList])

  return (
    <Layout cta={cta} handleBack={handleClose} id='my-progress-list' inner loading={isLoading} noFooter title='My Surprises'>
      <RewardListWrapper id={wrapperId}>
        <InfiniteRewardScroll
          dataLength={rewardList.length}
          hasMore={hasMore}
          loader={<Loader />}
          next={getMore}
          scrollableTarget={wrapperId}
        >
          <ProgressWrapper>
            <RewardText fontSize='14px' noClamp>
              Be active on Wambi to unlock surprises
            </RewardText>
            <RewardProgressBar overallProgress={rewardProgress?.currentProgress} />
            {rewardProgress?.plays > 0 && (
              <PlayButton
                clickEvent={() => {
                  setActive(rewardScreens.BUBBLE_POP)
                }}
                plays={rewardProgress.plays}
              />
            )}
          </ProgressWrapper>
          {rewardList.length > 0 &&
            rewardList.map((reward, i) => (
              <RewardCard
                clickEvent={() => {
                  screenHandler(reward)
                  if (!reward.claimedAt) setGiftClaimed(false)
                }}
                key={i}
                openRewardScreen={openRewardScreen}
                reward={reward}
                rewardScreens={rewardScreens}
              />
            ))}
        </InfiniteRewardScroll>
      </RewardListWrapper>
    </Layout>
  )
}

RewardProgressList.propTypes = {
  cta: PropTypes.object,
  handleClose: PropTypes.func,
  rewardList: PropTypes.array,
  setActive: PropTypes.func,
  setGiftClaimed: PropTypes.func,
  setReward: PropTypes.func,
  setRewardList: PropTypes.func,
  updatedRewardList: PropTypes.object,
}

export default RewardProgressList
