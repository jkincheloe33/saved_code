import { useState } from 'react'
import moment from 'moment'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices, EditIcon3 } from '@assets'
import { Avatar, Card, DynamicContainer, Image, Modal, Layout, Paragraph, PillButton, Text, TextArea, Title, ZoomPinch } from '@components'

const AddComment = styled(Card)`
  margin-bottom: 22px;
  padding: 16px 20px;
`

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
`

const CardParagraph = styled(Paragraph)`
  text-align: center;
`

const CardTitle = styled(Title)`
  margin: 1rem 0;
  text-align: center;
`

const CardText = styled(Text)`
  margin-bottom: 1rem;
  text-align: center;
`

const EditRecipientIcon = styled(Image)`
  cursor: pointer;
`

const ErrorMessage = styled(Text)`
  margin-bottom: 8px;
  text-align: center;
  text-transform: uppercase;
`

const ImageWrapper = styled.div`
  max-height: 224px;
  overflow: hidden;
`

const JobTitle = styled(Text)`
  margin-bottom: 0;
`

const Name = styled(Text)`
  margin-bottom: 0;
`

const ReceiverCard = styled(Card)`
  align-items: center;
  display: flex;
  margin-bottom: 22px;
  margin-top: 10px;
  padding: 22px 21px;
`

const ReceiverContent = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  flex: 1;
`

const RewardCard = styled(Card)`
  border: 1px solid ${colors.white};
  display: flex;
  flex-direction: column;
  margin: 0 auto 22px;

  @media (${devices.tablet}) {
    max-width: 373px;
  }
`

const ReceiverWrapper = styled.div`
  margin: auto;
  @media (${devices.tablet}) {
    max-width: 373px;
  }
`

const SendBtnWrapper = styled.div`
  display: flex;
  justify-content: center;
`

const TextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 13px;
`

const Wrapper = styled(DynamicContainer)`
  margin: 0 auto 2rem;
  padding: 20px;
`

const GiveAGift = ({ cta, error, reward, rewardScreens, selectedPerson, setActive, submitGiveGift }) => {
  const [note, setNote] = useState('')
  const [viewImage, setViewImage] = useState(false)

  const { name: giftName, description, claimExpiresAt, image } = reward
  const { name, jobTitle, thumbnailImage } = selectedPerson

  const handleSubmit = e => {
    e.preventDefault()
    submitGiveGift(note)
  }

  return (
    <Layout cta={cta} handleBack={() => setActive(rewardScreens.PEOPLE_SEARCH)} id='send-gift' inner noFooter title={`Send to ${name}`}>
      <Wrapper>
        <ReceiverWrapper>
          <ReceiverCard>
            <Avatar image={thumbnailImage} ratio='50px' />
            <ReceiverContent>
              <TextWrapper>
                <Name color='gray1' fontWeight='700'>
                  {name}
                </Name>
                <JobTitle fontSize='14px'>{jobTitle}</JobTitle>
              </TextWrapper>
              <EditRecipientIcon
                id='edit-recipients-btn'
                onClick={() => setActive(rewardScreens.PEOPLE_SEARCH)}
                src={EditIcon3}
                width='40px'
              />
            </ReceiverContent>
          </ReceiverCard>

          <form>
            <AddComment>
              <TextArea grow placeholder='Add a note...' onChange={e => setNote(e.target.value)} value={note} />
            </AddComment>
          </form>
        </ReceiverWrapper>
        <RewardCard>
          {reward.image && (
            <ImageWrapper>
              <Image alt='reward image' onClick={() => setViewImage(true)} src={reward.image} width='100%' />
            </ImageWrapper>
          )}
          <CardContent>
            <CardTitle fontColor='gray1' fontSize='24px' fontWeight='600'>
              {giftName}
            </CardTitle>
            {error && <ErrorMessage color='berry'>{error}</ErrorMessage>}

            {claimExpiresAt && !error && <CardText color='gray1'>Claim before {moment().add(14, 'day').format('MM/DD')}</CardText>}
            <CardParagraph color='gray1'>{description}</CardParagraph>
          </CardContent>
        </RewardCard>

        <SendBtnWrapper>
          <PillButton id='send-gift-btn' text='Send gift' type='submit' onClick={e => handleSubmit(e)} />
        </SendBtnWrapper>
      </Wrapper>
      <Modal handleClose={() => setViewImage(false)} open={viewImage}>
        <ZoomPinch image={{ alt: 'Reward Image', src: image }} />
      </Modal>
    </Layout>
  )
}

GiveAGift.propTypes = {
  cta: PropTypes.object,
  error: PropTypes.string,
  reward: PropTypes.object,
  rewardScreens: PropTypes.object,
  setActive: PropTypes.func,
  selectedPerson: PropTypes.object,
  submitGiveGift: PropTypes.func,
}

export default GiveAGift
