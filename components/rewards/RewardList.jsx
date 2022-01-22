import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import InfiniteScroll from 'react-infinite-scroll-component'
import { colors, devices } from '@assets'
import { DynamicContainer, Layout, Loader, RewardCard, Title } from '@components'
import { api } from '@services'

const InfiniteRewardScroll = styled(InfiniteScroll)`
  display: flex;
  flex-direction: column;
  padding: 20px;
`

const NoResultsText = styled(Title)`
  margin-top: 50px;
`

const Wrapper = styled(DynamicContainer)`
  align-items: center;
  background-color: ${colors.gray8};
  display: flex;
  flex-direction: column;
  margin-bottom: 2rem;
  width: 100%;

  @media (${devices.desktop}) {
    background-color: ${colors.white};
    margin: auto;
  }
`

const RewardList = ({ cta, reward, rewardScreens, selectedActive, setActive, setReward }) => {
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [rewards, setRewards] = useState(null)

  const wrapperId = 'scrollable-rewards-list'

  useEffect(() => {
    // Don't pull list until user completes game or chooses a new gift...JC
    setIsLoading(true)
    if (reward) {
      const getRewards = async () => {
        const {
          data: { rewards, success },
        } = await api.post('/reward/getRewardList', { rewardClaimId: reward.rewardClaimId })
        if (success) {
          setHasMore(rewards.length > 0)
          setPage(1)
          setRewards(rewards)
        }
      }
      getRewards()
      setIsLoading(false)
    }
  }, [reward])

  const getMore = async () => {
    const {
      data: { rewards: newRewards, success },
    } = await api.post('/reward/getRewardList', { page, rewardClaimId: reward.rewardClaimId })
    if (success) {
      setHasMore(newRewards.length > 0)
      setPage(page + 1)
      setRewards([...rewards, ...newRewards])
    }
  }

  const chooseNewReward = async (oldReward, newReward) => {
    setIsLoading(true)
    const {
      data: { reward, success },
    } = await api.post('/reward/chooseNewReward', { newGiftId: newReward.id, rewardClaimId: oldReward.rewardClaimId })
    if (success) {
      // Reset scroll to top so this component doesnt start scrolled at bottom since it needs to stay rendered in workflow...JC
      const ele = document.getElementById(wrapperId)
      if (ele) ele.scrollTop = 0
      setHasMore(true)
      setPage(0)
      setReward(reward)
      setRewards([])
      setActive(rewardScreens.CLAIM_REWARD)
      setIsLoading(false)
    }
  }

  return (
    <Layout
      cta={cta}
      handleBack={() =>
        selectedActive === rewardScreens.PROGRESS_REWARD_LIST
          ? setActive(rewardScreens.PROGRESS_REWARD_LIST)
          : setActive(rewardScreens.CLAIM_REWARD)
      }
      id='reward-list-layout'
      inner
      loading={isLoading}
      noFooter
      title='Claim'
    >
      <Wrapper id={wrapperId}>
        {rewards?.length > 0 ? (
          <InfiniteRewardScroll
            dataLength={rewards.length}
            hasMore={hasMore}
            loader={<Loader />}
            next={getMore}
            scrollableTarget={wrapperId}
          >
            {rewards.map((rewardOption, i) => (
              <RewardCard
                clickEvent={() => chooseNewReward(reward, rewardOption)}
                key={i}
                reward={rewardOption}
                rewardScreens={rewardScreens}
              />
            ))}
          </InfiniteRewardScroll>
        ) : rewards && !rewards.length ? (
          <NoResultsText>No other gifts available</NoResultsText>
        ) : (
          <Loader />
        )}
      </Wrapper>
    </Layout>
  )
}

RewardList.propTypes = {
  cta: PropTypes.object,
  handleClose: PropTypes.func,
  reward: PropTypes.object,
  rewardScreens: PropTypes.object,
  selectedActive: PropTypes.number,
  setActive: PropTypes.func,
  setReward: PropTypes.func,
}

export default RewardList
