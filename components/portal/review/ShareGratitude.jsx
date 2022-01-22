import PropTypes from 'prop-types'
import styled from 'styled-components'

import { devices } from '@assets'
import { Card, Container, InitialsBox, Intro, Paragraph, PillButton, PortalLayout, SurveyHeader, TextArea, Text } from '@components'
import { useLangContext } from '@contexts'

const CommentInput = styled(TextArea)`
  border-radius: 12px;
  font-size: 16px;
  margin: 20px auto;
  padding: 1rem 0;
`

const Person = styled.div`
  align-items: center;
  display: flex;
`

const Subtitle = styled(Text)`
  font-size: 12px;
  margin: 0 0 50px;
  text-align: center;
  width: 70%;

  @media (${devices.tablet}) {
    font-size: 16px;
    width: 100%;
  }
`

const StyledCard = styled(Card)`
  margin: 20px auto 50px;
  padding: 20px;

  @media (${devices.smMobile}) {
    padding: 23px;
  }
`

const TextWrapper = styled.div`
  margin-left: 12px;
`

const Thumbnail = styled.div`
  background: url(${p => p.image}) no-repeat center;
  background-size: ${p => (p.hasImage ? 'cover' : '45%')};
  border-radius: 12px;
  height: 63px;
  min-height: 63px;
  min-width: 63px;
  width: 63px;

  @media (${devices.tablet}) {
    height: 100px;
    width: 100px;
  }
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
`

const ShareGratitudePage = ({
  commentPromptThreshold,
  portalScreens,
  reviewData,
  setActive,
  setReviewData,
  showCpcText = true,
  showDaisy,
  submitReview,
}) => {
  const { getText } = useLangContext()

  const { image, name, title } = reviewData.person

  const handleBack = () => {
    const hasLowRatings = reviewData.answers.some(a => a.rating <= commentPromptThreshold)

    if (hasLowRatings) {
      setActive(portalScreens.COMMENTS)
    } else {
      reviewData.answers.pop()
      setActive(portalScreens.SURVEY)
    }
  }

  const handleSkip = async () => {
    setReviewData(data => ({ ...data, gratitude: '' }))

    if (showDaisy) {
      setReviewData(data => ({ ...data, daisyInfo: { ...data.daisyInfo, ...data.contactInfo } }))
      setActive(portalScreens.DAISY)
    } else {
      submitReview()
    }
  }

  const handleSubmit = e => {
    e?.preventDefault()

    if (showDaisy) {
      setReviewData(data => ({ ...data, daisyInfo: { ...data.daisyInfo, ...data.contactInfo, comment: data.gratitude } }))
      setActive(portalScreens.DAISY)
    } else {
      submitReview()
    }
  }

  return (
    <PortalLayout noHeader>
      <SurveyHeader onBackPress={handleBack} onSkipPress={handleSkip} />
      <Container>
        <Intro squiggly='right' text={getText('Share your gratitude')} />
        <StyledCard>
          <Wrapper>
            <Person>
              {image?.length === 2 ? (
                <InitialsBox fontSize='20px' height='63px' initials={image} radius='12px' width='63px' />
              ) : (
                <Thumbnail hasImage={Boolean(image)} image={image} />
              )}
              <TextWrapper>
                <Paragraph fontSize={['14px', '16px']} fontWeight={700} maxLines={1}>
                  {name}
                </Paragraph>
                <Text fontSize={['14px', '16px']}>{title}</Text>
              </TextWrapper>
            </Person>
          </Wrapper>
          <form>
            <CommentInput
              id='gratitude'
              onChange={e => setReviewData(s => ({ ...s, gratitude: e.target.value }))}
              placeholder={`${getText('Tell')} ${name} ${getText('why you appreciate them (optional)…')}`}
              rows={9}
              value={reviewData.gratitude || ''}
            />
          </form>
        </StyledCard>
        {showCpcText && (
          <Subtitle color='brightPurple' fontWeight={700} noClamp>
            {getText('Your gratitude may be celebrated publicly on carepostcard.com')}
          </Subtitle>
        )}
        <PillButton
          disabled={reviewData && !reviewData.gratitude}
          id='gratitude-submit-btn'
          onClick={handleSubmit}
          text={showDaisy ? getText('NEXT') : getText('SUBMIT')}
        />
      </Container>
    </PortalLayout>
  )
}

ShareGratitudePage.propTypes = {
  commentPromptThreshold: PropTypes.number,
  portalScreens: PropTypes.object,
  reviewData: PropTypes.object,
  setActive: PropTypes.func,
  setReviewData: PropTypes.func,
  showCpcText: PropTypes.bool,
  showDaisy: PropTypes.bool,
  submitReview: PropTypes.func,
}

export default ShareGratitudePage
