import { useEffect, useState } from 'react'
import moment from 'moment'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices, shadows } from '@assets'
import {
  Avatar,
  Card,
  ConfirmationPopUp,
  DynamicContainer,
  Image,
  Layout,
  Modal,
  Paragraph,
  PillButton,
  Select,
  Text,
  Title,
  ZoomPinch,
} from '@components'
import { api } from '@services'
import { REWARD_GIFT_STATUS } from '@utils'

const BtnWrapper = styled.div`
  display: ${p => (p.showBtns ? 'block' : 'none')};

  @media (${devices.desktop}) {
    margin: 20px auto;
    max-width: 373px;
  }
`

const CardText = styled(Text)`
  margin-bottom: 1rem;
  text-align: center;
`

const CardTitle = styled(Title)`
  margin: 1rem 0;
  text-align: center;
`

const CardParagraph = styled(Paragraph)`
  text-align: center;
`

const ChooseOtherBtn = styled(PillButton)`
  background-color: transparent;
  box-shadow: none;
  margin-bottom: 25px;
`

const ClaimGiftBtn = styled(PillButton)`
  margin-bottom: 25px;
`

const CloseConfirmation = styled(Text)`
  cursor: pointer;
`

const ConfirmationText = styled(Text)`
  margin-bottom: 20px;
`

const ConfirmationTextWrapper = styled.div`
  /* backdrop-filter: blur(64px);
  background-color: ${colors.white}63; */
  background-color: ${colors.white};
  border-radius: 20px;
  box-shadow: ${shadows.reward};
  margin-bottom: 1rem;
  padding: 27px 40px;

  @media (${devices.desktop}) {
    backdrop-filter: none;
    box-shadow: none;
  }
`

const ConfirmationWrapper = styled.div`
  display: ${p => (p.showConfirmation ? 'block' : 'none')};
  text-align: center;
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
`

const Dropdown = styled(Select)`
  color: ${colors.gray3};
  margin: auto 0 25px;
`

const From = styled(Text)`
  margin-right: 5px;
`

const FromText = styled(Text)`
  align-items: center;
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`

const ImageWrapper = styled.div`
  max-height: 224px;
  overflow: hidden;
`

const GiveGiftBtn = styled(PillButton)`
  margin-bottom: 25px;
`

const Note = styled.div`
  /* backdrop-filter: blur(64px); */
  background-color: ${colors.white}05;
  border-radius: 30px;
  box-shadow: ${shadows.sentNote};
  flex: 1;
  padding: 20px 25px;

  @media (${devices.desktop}) {
    /* backdrop-filter: none; */
    box-shadow: ${shadows.card};
  }
`

const NoteWrapper = styled.div`
  align-items: flex-start;
  display: flex;
  margin-bottom: 25px;

  @media (${devices.desktop}) {
    margin: 20px auto;
    max-width: 373px;
  }
`

const ReceiverOtherBtn = styled(PillButton)`
  margin-bottom: 25px;
`

const RewardCard = styled(Card)`
  border: 1px solid ${colors.white};
  margin-bottom: 30px;

  @media (${devices.desktop}) {
    margin: 20px auto;
    max-width: 373px;
  }
`

const SaveForLaterBtn = styled(Text)`
  cursor: pointer;
  display: ${p => (p.disabled ? 'none' : 'block')};
  margin-bottom: 25px;
  text-align: center;
`

const SenderImage = styled(Avatar)`
  margin-right: 10px;
`

const SenderName = styled(Text)`
  margin-bottom: 14px;
`

const Wrapper = styled(DynamicContainer)`
  background-color: ${colors.gray8};
  margin-bottom: 2rem;
  padding: 20px;

  @media (${devices.desktop}) {
    background-color: ${colors.white};
  }
`

const ClaimReward = ({
  cta,
  error,
  handleClose,
  gameComplete,
  giftClaimed,
  reward,
  rewardClaimId,
  rewardScreens,
  setActive,
  setReward,
  setRewardList,
  submitClaim,
}) => {
  const [attribute, setAttribute] = useState('')
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [selectedReward, setSelectedReward] = useState(null)
  const [showBtns, setShowBtns] = useState(true)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [viewImage, setViewImage] = useState(false)

  const {
    attributes,
    claimedAt,
    ctaText,
    description,
    claimExpiresAt,
    hasInventory,
    image,
    isRaffle,
    itemNumber,
    name,
    requiredPhone,
    requiredShipping,
    rewardProgressId,
    senderName,
    sendNote,
    sentAt,
    status,
    thumbnailImage,
  } = reward

  const buttonText = ctaText || 'Claim'

  const claimExpired = new Date() > new Date(claimExpiresAt)

  const cardText = () => {
    if (error) return <CardText color='berry'>{error}</CardText>
    if (!claimedAt && !hasInventory) return <CardText color='berry'>OUT OF STOCK</CardText>
    if (claimExpired) return <CardText color='berry'>EXPIRED</CardText>
    if (claimedAt) return <CardText color='berry'>CLAIMED</CardText>
    if (!claimedAt && !isRaffle) return <CardText color='gray1'>Claim before {moment(claimExpiresAt).format('MM/DD')}</CardText>
    else return <CardText color='gray1'>Enter before {moment(claimExpiresAt).format('MM/DD')}</CardText>
  }

  useEffect(() => {
    const getNewReward = async () => {
      const newGift = attributes.find(e => e.attributeValue === attribute)

      const {
        data: { success, reward: newReward },
      } = await api.post('/reward/chooseNewReward', { newGiftId: newGift.id, rewardClaimId: reward.rewardClaimId })
      if (success) {
        setSelectedReward(newReward)
        setReward(newReward)
        // update progressRewardList with new chosen reward...PS
        setRewardList(list => list.map(reward => (reward.rewardClaimId === newReward?.rewardClaimId ? newReward : reward)))
      }
    }
    if (attributes?.length && attribute) getNewReward()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attribute, reward.rewardClaimId, setReward])

  useEffect(() => {
    setShowConfirmation(giftClaimed)
    setShowBtns(!giftClaimed && !claimExpired && (status === REWARD_GIFT_STATUS.ACTIVE || status === REWARD_GIFT_STATUS.MANUAL))
  }, [claimExpired, giftClaimed, status])

  return (
    <Layout
      cta={cta}
      handleBack={
        gameComplete
          ? false
          : () => {
              rewardClaimId ? handleClose() : setActive(rewardScreens.PROGRESS_REWARD_LIST)
              setAttribute('')
            }
      }
      id='claim-gift'
      inner
      noFooter
      title={buttonText}
    >
      <Wrapper>
        <RewardCard>
          {image && (
            <ImageWrapper>
              <Image alt='reward image' onClick={() => setViewImage(true)} src={image} width='100%' />
            </ImageWrapper>
          )}
          <Content>
            <CardTitle fontColor='gray1' fontSize='24px' fontWeight='600'>
              {name}
            </CardTitle>
            {cardText()}
            {rewardClaimId && senderName && (
              <FromText>
                <From color='gray1'>From</From>
                <Text color='gray1' fontWeight='600'>
                  {senderName}
                </Text>
              </FromText>
            )}
            <CardParagraph color='gray1'>{description}</CardParagraph>
          </Content>
        </RewardCard>
        {sendNote?.length > 0 && (
          <NoteWrapper>
            <SenderImage image={thumbnailImage} ratio='50px' />
            <Note>
              <SenderName color='gray1' fontWeight='700'>
                {senderName}
              </SenderName>
              <Paragraph>{sendNote}</Paragraph>
            </Note>
          </NoteWrapper>
        )}

        <BtnWrapper showBtns={showBtns}>
          {itemNumber && attributes.length > 0 && !claimedAt && hasInventory && (
            <Dropdown
              id='gift-attibute-values'
              onChange={e => setAttribute(e.target.value)}
              options={attributes.map(a => ({ name: a.attributeValue, value: a.attributeValue }))}
              title={`Select a ${attributes[0]?.attributeName?.toLowerCase()}`}
              value={attribute}
            />
          )}
          {!claimedAt && hasInventory && (
            <ClaimGiftBtn
              disabled={itemNumber && attributes.length > 0 && !attribute}
              full
              id='claim-gift-btn'
              onClick={() => setIsConfirmationOpen(true)}
              text={buttonText}
            />
          )}
          {!rewardClaimId && hasInventory && !sentAt && rewardProgressId && (
            <GiveGiftBtn
              full
              id='give-gift-btn'
              inverted
              onClick={() => setActive(rewardScreens.PEOPLE_SEARCH)}
              text='Gift to someone else'
            />
          )}
          {/*
           * Hide "Choose something else" button if:
           * - The reward is claimed
           * - The reward is a raffle prize (Don't have a rewardProgressId)
           * ...CY
           */}

          {!reward.claimedAt && rewardClaimId && rewardProgressId && (
            <ReceiverOtherBtn
              fontWeight='600'
              full
              id='receiver-choose-other-btn'
              inverted
              onClick={() => setActive(rewardScreens.REWARD_LIST)}
              text='Choose something else'
            />
          )}
          {!reward.claimedAt && !rewardClaimId && rewardProgressId && (
            <ChooseOtherBtn
              fontWeight='600'
              full
              id='receiver-choose-other-btn'
              inverted
              onClick={() => {
                setActive(rewardScreens.REWARD_LIST)
                setAttribute('')
                setSelectedReward(null)
              }}
              text='Choose something else'
            />
          )}
          {!claimedAt && hasInventory && (
            <SaveForLaterBtn color='blurple' fontWeight='600' id='save-for-later-btn' onClick={handleClose}>
              Save for later
            </SaveForLaterBtn>
          )}
        </BtnWrapper>
        <ConfirmationWrapper showConfirmation={showConfirmation || claimedAt}>
          <ConfirmationTextWrapper>
            <ConfirmationText color='gray1' fontWeight='600'>
              {isRaffle ? 'Raffle Entered' : 'Gift Claimed'}
            </ConfirmationText>
            <Paragraph>
              {isRaffle
                ? 'You will receive an email with additional details.'
                : 'You will receive an email with instructions to redeem your gift.'}
            </Paragraph>
          </ConfirmationTextWrapper>
          <CloseConfirmation color='blurple' fontWeight='600' onClick={handleClose}>
            Close
          </CloseConfirmation>
        </ConfirmationWrapper>
      </Wrapper>
      <Modal handleClose={() => setViewImage(false)} open={viewImage}>
        <ZoomPinch image={{ alt: 'Reward Image', src: selectedReward?.image ?? image }} />
      </Modal>
      <ConfirmationPopUp
        handleNo={() => setIsConfirmationOpen(false)}
        handleYes={() => {
          setIsConfirmationOpen(false)
          setTimeout(() => {
            if (requiredShipping || requiredPhone) setActive(rewardScreens.CLAIM_DETAILS)
            else submitClaim()
          }, 500)
        }}
        open={isConfirmationOpen}
      />
    </Layout>
  )
}

ClaimReward.propTypes = {
  cta: PropTypes.object,
  error: PropTypes.string,
  gameComplete: PropTypes.bool,
  giftClaimed: PropTypes.bool,
  handleBack: PropTypes.func,
  handleClose: PropTypes.func,
  reward: PropTypes.object,
  rewardClaimId: PropTypes.number,
  rewardScreens: PropTypes.object,
  setActive: PropTypes.func,
  setReward: PropTypes.func,
  setRewardList: PropTypes.func,
  submitClaim: PropTypes.func,
}

export default ClaimReward
