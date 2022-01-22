import moment from 'moment-shortformat'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { CancelBlackIcon, CheckmarkIcon4, colors, devices, shadows } from '@assets'
import { Card, Image, PillButton, Text, Title } from '@components'
import { REWARD_GIFT_STATUS, uId } from '@utils'

const BtnWrapper = styled.div`
  margin-top: 25px;
`

const CardTitle = styled(Title)`
  justify-content: flex-start;
  margin: 0 0 8px 0;
`

const Icon = styled(Image)`
  margin-right: 5px;
`

const Badge = styled.div`
  align-items: center;
  /* backdrop-filter: blur(8px); */
  background-color: ${colors.gray8};
  box-shadow: ${shadows.round};
  border-radius: 30px;
  display: flex;
  position: absolute;
  padding: 10px 15px;
  right: 14px;
  top: 14px;
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  padding: 25px;
`

const ErrorMessage = styled(Text)`
  margin-bottom: 8px;
  text-transform: uppercase;
`
const ImageWrapper = styled.div`
  max-height: 224px;
  overflow: hidden;
  position: relative;
`

const UnlockedDate = styled.div`
  align-items: center;
  display: flex;
`

const Wrapper = styled(Card)`
  cursor: pointer;
  margin: 0 auto 25px;
  width: 90%;

  @media (${devices.tablet}) {
    max-width: 373px;
  }
`

const RewardCard = ({ clickEvent, reward }) => {
  const {
    claimedAt,
    claimedByMe,
    claimExpiresAt,
    ctaText,
    giftEndDate,
    hasInventory,
    image,
    rewardClaimId,
    rewardProgressId,
    sentBy,
    sentByMe,
    status,
  } = reward

  const expiredClaim = claimExpiresAt && new Date() > new Date(claimExpiresAt)
  const expiredGift = giftEndDate && new Date() > new Date(giftEndDate)
  const isActive = status === REWARD_GIFT_STATUS.ACTIVE || status === REWARD_GIFT_STATUS.MANUAL

  const badgeMessage = () => {
    // if reward is claimed or is sent by someone...PS
    if (claimedAt || sentBy)
      return (
        <Badge id={uId('reward-badge')}>
          <Icon alt='badge icon' src={CheckmarkIcon4} width='8px' />
          <Text color='gray1' fontSize='15px'>
            {claimedAt && claimedByMe ? 'Claimed' : sentByMe ? 'Sent' : 'Received'}
          </Text>
        </Badge>
      )

    // if the reward has the claim expired but the user did not claim it, it should say Expired...PS
    if (expiredClaim && !claimedAt)
      return (
        <Badge id={uId('reward-badge')}>
          <Icon alt='badge icon' src={CancelBlackIcon} width='9px' />
          <Text color='gray1' fontSize='15px'>
            Expired
          </Text>
        </Badge>
      )

    /* 
      if the reward claim is not expired, but the gift end date has passed, and did not get claimed then show it as OoS
      if the gift has not been claimed and that gifts' status is 2 then show OoS ...PS 
    */
    if (!claimedAt && ((!expiredClaim && expiredGift) || status === REWARD_GIFT_STATUS.ARCHIVED))
      return (
        <Badge id={uId('reward-badge')}>
          <Icon alt='badge icon' src={CancelBlackIcon} width='9px' />
          <Text color='gray1' fontSize='15px'>
            Out of Stock
          </Text>
        </Badge>
      )
  }

  return (
    <Wrapper id={uId('reward-list-item')} onClick={clickEvent}>
      {image && (
        <ImageWrapper>
          <Image alt='reward option image' src={image} width='100%' />
          {badgeMessage()}
        </ImageWrapper>
      )}
      <Content>
        <CardTitle fontSize='20px' fontWeight='400' id='reward-list-option-title'>
          {reward.name}
        </CardTitle>
        {!hasInventory && !claimedAt && <ErrorMessage color='berry'>Out of Stock</ErrorMessage>}

        {rewardClaimId ? (
          // will show 'unlocked' if reward has been claimed or sent as a gift || will show 'expires' when not been claimed || show 'expired' when gift claim is expired...PS
          <UnlockedDate>
            {claimedAt || sentBy
              ? `Unlocked ${moment(reward.createdAt).fromNow()}`
              : expiredClaim
              ? `Expired ${moment(claimExpiresAt).fromNow()}`
              : `Expires ${moment(claimExpiresAt).fromNow()}`}
          </UnlockedDate>
        ) : (
          // will show 'Available until' on RewardList...PS
          <UnlockedDate>{giftEndDate ? `Available until ${moment(giftEndDate).format('MM-DD-YYYY')}` : ''}</UnlockedDate>
        )}
        {/* Show button if:
            - You have not claimed reward
            - You have not sent gift
            - Reward is not a raffle win
            - The reward is expired OR the reward has no inventory or not active */}
        {!claimedAt && !sentByMe && rewardProgressId && !expiredClaim && (!hasInventory || expiredGift || !isActive) ? (
          <BtnWrapper>
            <PillButton full text='Choose something else' thin />
          </BtnWrapper>
        ) : (
          !claimedAt &&
          !sentByMe &&
          hasInventory &&
          !expiredClaim &&
          isActive && (
            <BtnWrapper>
              <PillButton full text={ctaText || 'Claim'} thin />
            </BtnWrapper>
          )
        )}
      </Content>
    </Wrapper>
  )
}

RewardCard.propTypes = {
  clickEvent: PropTypes.func,
  openRewardScreen: PropTypes.func,
  reward: PropTypes.object,
  rewardScreens: PropTypes.object,
}

export default RewardCard
