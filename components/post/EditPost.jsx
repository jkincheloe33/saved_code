/* eslint-disable no-unused-vars */
import { useEffect, useRef, useState } from 'react'
import PropType from 'prop-types'
import styled from 'styled-components'
import GroupSelector from './GroupSelector'
import TraitFilterInfo from './TraitFilterInfo'

import {
  CancelBlackIcon,
  colors,
  devices,
  EditIcon3,
  FileUploadIcon,
  gradients,
  MegaphoneIcon,
  shadows,
  StarIcon,
  VideoIcon,
} from '@assets'
import {
  Checkbox,
  ConfirmationPopUp,
  CtaFooter,
  DynamicContainer,
  FileUpload,
  FilterPost,
  Image,
  Input,
  Loader,
  Layout,
  Modal,
  PillButton,
  RealmFilter,
  RoundButton,
  Text,
  TextArea,
} from '@components'
import { useAuthContext, useRefreshDataContext, useToastContext, useUserContext } from '@contexts'
import { api } from '@services'
import { dataURItoBlob, PIN_POST_DAYS } from '@utils'
import MultiGroupSelection from './MultiGroupSelection'

const ClearFileButton = styled(RoundButton)`
  /* backdrop-filter: blur(100px);
  background: rgba(255, 255, 255, 0.6); */
  background-color: ${colors.white};
  border-radius: 50px;
  box-shadow: ${shadows.card};
  margin: 10px;
  position: absolute;
  right: 0%;
  top: 0%;
  z-index: 2;
`

const DaysInput = styled(Input)`
  margin-left: 10px;
  width: 25px;

  input {
    // Hide arrows for number input...CY
    -moz-appearance: textfield;

    ::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    ::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
`
const DaysInputIcon = styled(Image)`
  margin-left: auto;
`

const DaysInputWrapper = styled.div`
  align-items: center;
  background-color: ${colors.gray8};
  border-radius: 10px;
  display: flex;
  max-width: 350px;
  padding: 5px;
  width: 100%;
`

const ErrorMessage = styled.p`
  background-color: ${colors.berry}26;
  border-radius: 10px;
  color: ${colors.berry};
  font-weight: 500;
  margin-top: 0;
  padding: 20px;
  text-align: center;
`

const FileInput = styled.input`
  display: none;
`

const FileWrapper = styled.div`
  display: ${p => (p.visible ? 'inline-block' : 'none')};

  padding-bottom: 23px;
  position: relative;
  width: 100%;
`

const FileTypeWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 34px 0 20px 0;

  img {
    cursor: pointer;
  }
`

const LoaderWrapper = styled.div`
  align-items: center;
  background-color: ${colors.white}E6;
  display: flex;
  height: 100%;
  justify-content: center;
  left: 0;
  opacity: ${p => (p.submitting ? 1 : 0)};
  pointer-events: ${p => (p.submitting ? 'auto' : 'none')};
  position: fixed;
  top: 0;
  transition: opacity 250ms ease;
  width: 100%;
  z-index: 5;
`

const Note = styled(Text)`
  background-color: ${colors.white}99;
  border-radius: 10px;
  padding: 6px 20px;
  text-align: center;
  width: 100%;
`
const OptionItem = styled.div`
  display: flex;
`

const OptionText = styled(Text)`
  cursor: pointer;
  flex-grow: 1;
  margin-left: 12px;
`

const OptionsWrapper = styled.div`
  border-radius: 20px;
  box-shadow: ${shadows.card};
  margin-top: 20px;
  padding: 22px 20px 20px 18px;
`

const PinWrapper = styled.div`
  display: flex;
  margin-top: 20px;
`

const StyledImage = styled(Image)`
  border-radius: 15px;

  ${p => !p.visible && 'display: none;'}
`

const StyledTextArea = styled(TextArea)`
  flex: 1;
  min-height: 190px;
`

const TextAreaWrapper = styled.div`
  border-radius: 20px;
  box-shadow: ${shadows.card};
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
  overflow: auto;
  padding: 22px 20px 0px;
`

const VideoContent = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
  margin-top: 16px;
`

const VideoImage = styled(Image)`
  border-radius: 15px;
  height: 40px;
`

const VideoImageWrapper = styled.div`
  align-items: center;
  background-image: ${gradients.grayBlue};
  border-radius: 15px;
  display: ${p => (p.visible ? 'flex' : 'none')};
  flex-direction: column;
  padding: 10px;
  width: 100%;

  @media (${devices.Desktop}) {
    height: 400px;
  }
`

const VideoName = styled(Text)`
  margin: 10px 0;
  text-align: center;
`

const Wrapper = styled(DynamicContainer)`
  overflow-x: hidden;
  padding: 30px 20px 150px;
`

const DraftPost = ({ editPostScreens, errorMessage, existingPostData, handleBack, setActive, setErrorMessage, setVideoUploaded }) => {
  const [editedContent, setEditedContent] = useState('')
  const [fileSource, setFileSource] = useState(null)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fileInputRef = useRef(null)
  const { refreshData } = useRefreshDataContext()
  const { setToastData } = useToastContext()

  const reader = new FileReader()

  const { banner, content, id } = existingPostData

  // disables update button if none of the content has changed...PS
  const disabled = (content === editedContent && banner === fileSource) || (!editedContent && !fileSource)

  const clearFile = () => {
    setFileSource(null)
    fileInputRef.current.value = null
  }

  const fileRender = () => {
    return (
      <FileWrapper visible={!!fileSource}>
        <ClearFileButton onClick={clearFile} ratio='29px' image={{ alt: 'cancel file', src: CancelBlackIcon }} />
        <VideoImageWrapper visible={fileSource?.type ? fileSource?.type.includes('video') : undefined}>
          <VideoContent>
            <VideoImage alt='video icon' src={VideoIcon} width='59px' />
            <VideoName color='blue' fontSize='14px' fontWeight='600' noClamp>
              {fileSource?.name} selected
            </VideoName>
          </VideoContent>
          <Note color='blue' fontSize='14px' fontWeight='700' noClamp>
            Video must be 2 minutes or less
          </Note>
        </VideoImageWrapper>
        <StyledImage
          visible={fileSource?.type ? fileSource?.type.includes('image') : banner}
          src={fileSource?.src ? fileSource?.src : fileSource}
        />
      </FileWrapper>
    )
  }

  const handleCancel = () => (disabled ? handleBack() : setIsConfirmationOpen(true))

  const onFileChange = e => {
    setErrorMessage(null)
    reader.readAsDataURL(e.target.files[0])
    reader.onload = () => {
      setFileSource({
        name: e.target.files[0].name,
        src: reader.result,
        type: e.target.files[0].type,
      })
    }
  }

  const submitPost = async () => {
    setSubmitting(true)
    const formData = new FormData()

    formData.append('feedId', id)
    formData.append('content', editedContent)

    if (fileSource) {
      if (fileSource.src)
        formData.append(fileSource?.type?.includes('video') ? 'file' : 'image', dataURItoBlob(fileSource.src), fileSource.name)
      if (fileSource?.type?.includes('video')) return await submitVideoPost(formData)
    } else {
      formData.append('fileRemoved', true)
    }

    const {
      data: { success, msg },
    } = await api.post('newsfeed/announcements/editPost', formData)

    if (success) {
      refreshData({ action: 'updateFeedItem', data: { feedId: id }, delay: 1000 })

      handleBack()

      setToastData({
        callout: 'Post Updated!',
        icon: MegaphoneIcon,
        id: 'edit-post-toast',
        spin: true,
      })
    } else {
      setErrorMessage(msg)
    }
    setSubmitting(false)
  }

  const submitVideoPost = async formData => {
    const {
      data: { success, msg },
    } = await api.post('newsfeed/announcements/editVideo', formData)

    if (success) {
      refreshData({ action: 'removeFeedItem', data: { feedId: id } })
      setVideoUploaded(true)
      setActive(editPostScreens.UPLOAD_VIDEO)
    } else setErrorMessage(msg)

    setSubmitting(false)
  }

  useEffect(() => {
    setEditedContent(content)
    setFileSource(banner)
  }, [banner, content])

  return (
    <>
      <Layout cta={{ onClick: handleCancel, text: 'Cancel' }} handleBack={handleCancel} id='edit-post' inner noFooter title='Edit Post'>
        <Wrapper>
          <TextAreaWrapper>
            {fileRender()}
            {errorMessage && <ErrorMessage color='berry'>{errorMessage}</ErrorMessage>}
            <StyledTextArea
              autoFocus
              id='edit-message-input'
              onChange={e => setEditedContent(e.target.value)}
              placeholder='Write your post...'
              value={editedContent}
            />
            <FileTypeWrapper>
              <FileUpload id={'edit-file-input'} onFileChange={onFileChange} ref={fileInputRef} />
            </FileTypeWrapper>
          </TextAreaWrapper>
        </Wrapper>
        <CtaFooter>
          <PillButton disabled={disabled} full id='edit-post-btn' onClick={submitPost} text='Update' />
        </CtaFooter>
      </Layout>

      <LoaderWrapper submitting={submitting}>
        <Loader />
      </LoaderWrapper>

      <ConfirmationPopUp
        handleNo={() => setIsConfirmationOpen(false)}
        handleYes={() => {
          setIsConfirmationOpen(false)
          handleBack()
        }}
        open={isConfirmationOpen}
      />
    </>
  )
}

DraftPost.propTypes = {
  editPostScreens: PropType.object,
  errorMessage: PropType.string,
  existingPostData: PropType.object,
  handleBack: PropType.func.isRequired,
  setActive: PropType.func,
  setErrorMessage: PropType.func,
  setVideoUploaded: PropType.func,
}

export default DraftPost
