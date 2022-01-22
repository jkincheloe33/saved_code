import PropTypes from 'prop-types'
import styled from 'styled-components'

import { CameraIcon, CameraCheckIcon, colors, multiplier, shadows } from '@assets'
import { Banner, CtaFooter, DynamicContainer, Image, ImageCanvas, Layout, Paragraph, PillButton, ProgressBar } from '@components'

const BannerImageWrapper = styled.div`
  align-items: center;
  display: flex;
  justify-content: center;
  padding-right: ${multiplier * 2}px;
`

const BannerRow = styled.div`
  display: flex;
  padding: ${multiplier * 2}px ${multiplier * 3}px;

  ${Paragraph} {
    margin: auto 0;
  }
`

const BannerWrapper = styled(Banner)`
  margin: 0;
`

const EditImageIcon = styled.div`
  background-color: ${colors.white};
  border-radius: 50%;
  box-shadow: ${shadows.card};
  display: flex;
  max-height: 56px;
  padding: ${multiplier}px;
  position: relative;
  transform: translate(122px, -26px);
  max-height: 56px;
`

const Submitting = styled.div`
  align-items: center;
  background-color: ${colors.white}D9;
  display: flex;
  height: 100%;
  justify-content: center;
  left: 0;
  opacity: ${p => (p.submitting ? 1 : 0)};
  padding: 0 ${multiplier * 2}px;
  pointer-events: ${p => (p.submitting ? 'auto' : 'none')};
  position: fixed;
  top: 0;
  transition: opacity 250ms ease;
  width: 100%;
  z-index: 5;
`

const Wrapper = styled(DynamicContainer)`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: ${multiplier * 4}px ${multiplier * 5}px ${multiplier * 15}px;
  position: relative;
`

const SubmitProfileImage = ({ cta, editImageScreens, handleBack, imageURL, submitting, isOwner, onSave, setActive, uploadProgress }) => {
  return (
    <>
      <Layout cta={cta} handleBack={handleBack} id='submit-image' inner noFooter title='Preview Photo'>
        <Wrapper outer scroll>
          <ImageCanvas border={0} height={300} imageURL={imageURL} width={300} />
          <EditImageIcon>
            <Image alt='camera icon' onClick={() => setActive(editImageScreens.IMAGE_EDITOR)} src={CameraIcon} />
          </EditImageIcon>
          {!isOwner && (
            <BannerWrapper title='Notes about photo approval'>
              <BannerRow>
                <BannerImageWrapper>
                  <Image alt='Camera and check icon' src={CameraCheckIcon} width={`${multiplier * 6}px`} />
                </BannerImageWrapper>
                <Paragraph fontSize='14px'>Your profile picture will need to be approved by a manager.</Paragraph>
              </BannerRow>
            </BannerWrapper>
          )}
        </Wrapper>
      </Layout>
      <CtaFooter>
        <PillButton full id='save-profile-img-btn' onClick={onSave} text='Submit Photo' />
      </CtaFooter>
      {submitting && (
        <Submitting submitting={submitting}>
          <ProgressBar max={100} progress={uploadProgress} />
        </Submitting>
      )}
    </>
  )
}

SubmitProfileImage.propTypes = {
  cta: PropTypes.object,
  editImageScreens: PropTypes.object,
  handleBack: PropTypes.func,
  imageURL: PropTypes.string,
  isOwner: PropTypes.bool,
  onSave: PropTypes.func,
  setActive: PropTypes.func,
  submitting: PropTypes.bool,
  uploadProgress: PropTypes.number,
}

export default SubmitProfileImage
