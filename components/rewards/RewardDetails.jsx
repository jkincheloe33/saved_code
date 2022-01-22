import { useState } from 'react'
import moment from 'moment-shortformat'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices, shadows } from '@assets'
import { Avatar, Card, DynamicContainer, Image, Layout, Modal, Paragraph, PeopleTile, Text, Title, ZoomPinch } from '@components'
import { useUserContext } from '@contexts'

const CardTitle = styled(Title)`
  margin: 1rem 0;
  text-align: center;
`

const CardText = styled(Text)`
  margin-bottom: 1rem;
  text-align: center;
`

const CardParagraph = styled(Paragraph)`
  text-align: center;
`

const ConfirmationText = styled(Text)`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
`

const ConfirmationTextWrapper = styled.div`
  /* backdrop-filter: blur(64px); */
  background-color: ${colors.white}12;
  border-radius: 20px;
  box-shadow: ${shadows.reward};
  margin-bottom: 1rem;
  padding: 27px 40px;

  @media (${devices.desktop}) {
    /* backdrop-filter: none; */
    box-shadow: none;
  }
`

const ConfirmationWrapper = styled.div`
  display: block;
  text-align: center;
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
`

const ImageWrapper = styled.div`
  max-height: 224px;
  overflow: hidden;
`

const Note = styled.div`
  /* backdrop-filter: blur(64px); */
  background-color: ${colors.white}05;
  border-radius: 20px;
  box-shadow: ${shadows.sentNote};
  flex: 1;
  padding: 16px 25px;

  @media (${devices.desktop}) {
    /* backdrop-filter: none; */
    box-shadow: ${shadows.card};
  }
`

const NoteWrapper = styled.div`
  align-items: flex-start;
  display: flex;
  margin-bottom: 25px;
`

const ReceiverContent = styled.div`
  border-top: 1px solid ${colors.gray3}38;
  padding: 16px 25px;
`

const RewardCard = styled(Card)`
  border: 1px solid ${colors.white};
  margin-bottom: 30px;
`

const SenderImage = styled(Avatar)`
  margin-right: 10px;
`

const SenderName = styled(Text)`
  margin-bottom: 14px;
`

const Wrapper = styled(DynamicContainer)`
  margin-bottom: 2rem;
  padding: 20px;

  @media (${devices.desktop}) {
    margin: 20px auto 20px auto;
    max-width: 373px;
  }
`

const RewardDetails = ({ cta, reward, rewardScreens, setActive }) => {
  const [viewImage, setViewImage] = useState(false)

  const { user } = useUserContext()

  const {
    claimedAt,
    claimedBy,
    claimExpiresAt,
    description,
    giftEndDate,
    hasInventory,
    image,
    isRaffle,
    name,
    receiverThumbnailImage,
    recipient,
    senderName,
    senderTitle,
    sendNote,
    sentAt,
    thumbnailImage,
  } = reward

  const expiredClaim = new Date() > new Date(claimExpiresAt)
  const expiredGift = giftEndDate && new Date() > new Date(giftEndDate)
  const isMe = user.id === claimedBy

  const cardText = () => {
    // if user has not claimed reward but has no inventory...PS
    if (!claimedAt && !hasInventory) return <CardText color='berry'>OUT OF STOCK</CardText>
    // if its the user and the claim has expired...PS
    if (isMe && expiredClaim) return <CardText color='berry'>EXPIRED</CardText>
    // if reward is not claimed and the gift end date has not passed and its not current user...PS
    if (!claimedAt && !expiredGift && isMe) return <CardText color='gray1'>Claim before {moment(claimExpiresAt).format('MM/DD')}</CardText>
  }

  return (
    <Layout cta={cta} handleBack={() => setActive(rewardScreens.PROGRESS_REWARD_LIST)} id='gift-detail' inner noFooter title='Details'>
      <Wrapper>
        <RewardCard>
          {reward.image && (
            <ImageWrapper>
              <Image alt='reward image' onClick={() => setViewImage(true)} src={image} width='100%' />
            </ImageWrapper>
          )}
          <Content>
            <CardTitle fontColor='gray1' fontSize='24px' fontWeight='600'>
              {name}
            </CardTitle>
            {cardText()}
            <CardParagraph>{description}</CardParagraph>
          </Content>
          {sentAt && claimedBy !== user.id && (
            <ReceiverContent>
              <Text fontSize='14px'>Sent {moment(sentAt).fromNow()} to:</Text>
              <PeopleTile images={[receiverThumbnailImage]} ratio='50px' subtitle={senderTitle} title={recipient} />
            </ReceiverContent>
          )}
        </RewardCard>

        {thumbnailImage && sendNote && (
          <NoteWrapper>
            <SenderImage alt='sender image' image={thumbnailImage} ratio='50px' />
            <Note>
              <SenderName color='gray1' fontWeight='700'>
                {senderName}
              </SenderName>
              <Paragraph>{sendNote}</Paragraph>
            </Note>
          </NoteWrapper>
        )}

        {claimedAt && claimedBy === user.id && (
          <ConfirmationWrapper>
            <ConfirmationTextWrapper>
              {claimedAt && (
                <ConfirmationText color='gray1' fontWeight='600'>
                  {isRaffle ? 'Raffle Entered' : 'Gift Claimed'}
                  <Text>&nbsp;{moment(claimedAt).fromNow()}</Text>
                </ConfirmationText>
              )}
              <Paragraph>
                {isRaffle
                  ? 'You will receive an email with additional details.'
                  : 'You will receive an email with instructions to redeem your gift.'}
              </Paragraph>
            </ConfirmationTextWrapper>
          </ConfirmationWrapper>
        )}
      </Wrapper>
      <Modal handleClose={() => setViewImage(false)} open={viewImage}>
        <ZoomPinch image={{ alt: 'Reward Image', src: image }} />
      </Modal>
    </Layout>
  )
}

RewardDetails.propTypes = {
  cta: PropTypes.object,
  reward: PropTypes.object,
  rewardScreens: PropTypes.object,
  setActive: PropTypes.func,
}

export default RewardDetails
