import styled from 'styled-components'
import PropTypes from 'prop-types'

import { FinishedUpload, ProcessingUpload } from '@assets'
import { CtaFooter, DynamicContainer, Image, Layout, Loader, PillButton, Text, Title } from '@components'

const StyledImage = styled(Image)`
  border-radius: 15px;
  max-width: 375px;
  width: 100%;
`

const UploadWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  margin: 30px auto;
  padding-bottom: 180px;
  width: 90%;
`

const UploadText = styled(Text)`
  text-align: center;
`

const UploadingTitle = styled(Title)`
  font-size: 30px;
  font-weight: 600;
  margin-bottom: 20px;
`

const UploadedTitle = styled(UploadingTitle)`
  margin-top: 30px;
`

const UploadVideo = ({ clearFile, cta, editPost = false, errorMessage, handleBack, videoUploaded }) => {
  const handleError = () => {
    clearFile()
    handleBack()
  }

  return (
    <Layout
      cta={cta}
      handleBack={handleBack}
      id='posting-announcement-page'
      inner
      noFooter
      title={videoUploaded && editPost ? 'Updating Post' : videoUploaded ? 'Create a Post' : 'Uploading Video'}
    >
      <DynamicContainer>
        {videoUploaded ? (
          <UploadWrapper>
            <StyledImage alt='Finished uploading announcement video' src={FinishedUpload} />
            <UploadedTitle>We&apos;ve got it from here!</UploadedTitle>
            <UploadText color='gray1' noClamp>
              After we put some finishing touches on your post, it will appear on the newsfeed.
            </UploadText>
            <CtaFooter>
              <PillButton full id='upload-announcement-video-go-back' onClick={handleBack} text='Back to home' />
            </CtaFooter>
          </UploadWrapper>
        ) : (
          <UploadWrapper>
            <StyledImage alt='Uploading post video' src={ProcessingUpload} />
            {errorMessage ? (
              handleError()
            ) : (
              <>
                <Loader />
                <UploadingTitle>Hold Still!</UploadingTitle>
                <UploadText color='gray1' noClamp>
                  We&apos;re getting ready for your post&apos;s debut!
                </UploadText>
              </>
            )}
          </UploadWrapper>
        )}
      </DynamicContainer>
    </Layout>
  )
}

UploadVideo.propTypes = {
  clearFile: PropTypes.func,
  cta: PropTypes.object.isRequired,
  editPost: PropTypes.bool,
  errorMessage: PropTypes.string,
  handleBack: PropTypes.func.isRequired,
  videoUploaded: PropTypes.bool.isRequired,
}

export default UploadVideo
