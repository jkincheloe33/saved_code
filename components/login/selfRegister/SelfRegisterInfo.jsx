import { useRef } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { CameraCheckIcon, multiplier } from '@assets'
import {
  Avatar as AvatarBase,
  Banner,
  CtaFooter,
  DynamicContainer,
  FileUpload,
  Image,
  Input,
  Layout,
  Paragraph,
  PillButton,
  Text,
} from '@components'

const Avatar = styled(AvatarBase)`
  background-size: cover;
  border-radius: 20px;
`

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
  margin: ${multiplier * 4}px 0 0;
`

const EditMediaWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-left: ${multiplier * 2}px;
`

const EmailInput = styled(Input)`
  pointer-events: none;
`

const FileName = styled(Text)`
  margin-bottom: ${multiplier}px;
`

const MediaFileUpload = styled(FileUpload)`
  justify-content: flex-start;
  padding: 0;
`

const MediaPillButton = styled(PillButton)`
  pointer-events: none;
`

const MediaWrapper = styled.div`
  align-items: flex-end;
  display: flex;
`

const Wrapper = styled(DynamicContainer)`
  padding: ${multiplier * 3}px ${multiplier * 3}px 150px;
`

const SelfRegisterInfo = ({
  email,
  firstName,
  imageURL,
  jobTitle,
  lastName,
  newImage,
  registerUser,
  selfRegisterScreens,
  setActive,
  setNewImage,
  setPerson,
}) => {
  const uploadRef = useRef(null)

  const inputProps = { border: true, showLabel: true, spacing: '10px 0 0' }

  const onFileChange = e => {
    setNewImage(e.target.files[0])
    setActive(selfRegisterScreens.IMAGE_EDITOR)
  }

  // switches between Text or PillButton component depending on if they have an image...JK
  const renderFileUpload = () => (
    <MediaFileUpload fileType='.jpg,.jpeg,.png' id='self-register-upload' onFileChange={onFileChange} ref={uploadRef}>
      {imageURL ? <Text color='blurple'>Choose file</Text> : <MediaPillButton buttonType='secondary' small text='Upload photo' />}
    </MediaFileUpload>
  )

  return (
    <Layout id='add-contractor-info' inner noFooter title='Sign Up'>
      <Wrapper>
        {imageURL ? (
          <>
            <MediaWrapper>
              <Avatar image={imageURL} ratio='112px' />
              <EditMediaWrapper>
                <FileName color='gray1'>{newImage.name}</FileName>
                {renderFileUpload()}
              </EditMediaWrapper>
            </MediaWrapper>
            <BannerWrapper>
              <BannerRow>
                <BannerImageWrapper>
                  <Image alt='Camera and check icon' src={CameraCheckIcon} width='3rem' />
                </BannerImageWrapper>
                <Paragraph fontSize='14px'>Your profile picture will need to be approved by a manager.</Paragraph>
              </BannerRow>
            </BannerWrapper>
          </>
        ) : (
          renderFileUpload()
        )}
        <Input
          {...inputProps}
          label='First name*'
          onChange={e => setPerson(c => ({ ...c, firstName: e.target.value }))}
          value={firstName}
        />
        <Input {...inputProps} label='Last name*' onChange={e => setPerson(c => ({ ...c, lastName: e.target.value }))} value={lastName} />
        <Input {...inputProps} label='Job title*' onChange={e => setPerson(c => ({ ...c, jobTitle: e.target.value }))} value={jobTitle} />
        <EmailInput {...inputProps} color='gray3' disabled label='Email' value={email} />
        <CtaFooter>
          <PillButton
            // checks to make sure all fields have content...JK
            disabled={!firstName || !lastName || !jobTitle}
            onClick={registerUser}
            text='Sign up'
            thin
          />
        </CtaFooter>
      </Wrapper>
    </Layout>
  )
}

SelfRegisterInfo.propTypes = {
  email: PropTypes.string,
  firstName: PropTypes.string,
  imageURL: PropTypes.string,
  jobTitle: PropTypes.string,
  lastName: PropTypes.string,
  newImage: PropTypes.object,
  registerUser: PropTypes.func,
  selfRegisterScreens: PropTypes.object,
  setActive: PropTypes.func,
  setNewImage: PropTypes.func,
  setPerson: PropTypes.func,
}

export default SelfRegisterInfo
