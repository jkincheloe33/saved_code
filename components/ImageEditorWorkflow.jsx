import { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { ImageEditor, SubmitProfileImage } from '@components'
import { useCelebrationContext, useUserContext } from '@contexts'
import { coreApi } from '@services'
import { dataURItoBlob, useStore } from '@utils'
import { GROUP_ACCESS_LEVELS as levels } from '@utils/types'

const Container = styled.div`
  flex: 0 0 100%;
  height: 100%;
  opacity: ${p => (p.active === p.index ? 1 : 0)};
  transform: translateX(${p => (p.active - 1) * -100}%);
  transition: all 500ms cubic-bezier(0.88, 0.03, 0.09, 0.98);
  width: 100%;
`

const Wrapper = styled.div`
  align-items: flex-start;
  display: flex;
  flex-wrap: nowrap;
  height: 100%;
  width: 100%;
`

const editImageScreens = {
  IMAGE_EDITOR: 1,
  SUBMIT_PROFILE_IMAGE: 2,
}

const ImageEditorWorkflow = ({ cta, handleBack, isAdmin, isGroup, onProfileUpdated = () => {}, profileToEdit, ...props }) => {
  const [active, setActive] = useState(editImageScreens.IMAGE_EDITOR)
  const [editor, setEditor] = useState(null)
  const [imageURL, setImageURL] = useState(null)
  const [initialsBox, setInitialsBox] = useState(false)
  const [newImage, setNewImage] = useState(null)
  const [originalImg, setOriginalImg] = useState(null)
  const [rotateValue, setRotateValue] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [zoomValue, setZoomValue] = useState(1.2)

  const clearFile = useRef()
  const [setStore, { user }] = useStore()

  const { setCelebration } = useCelebrationContext()
  const { user: contextUser } = useUserContext()

  const isOwner = contextUser?.groupAccessLevel > levels.TEAM_MEMBER

  const uploadImage = async (name, original = null, thumbnail = null) => {
    setSubmitting(true)

    let formData = new FormData()
    let request = '/users/saveMedia'

    formData.append('thumbnail', thumbnail, name)

    if (original) {
      formData.append('original', original, name)
    }

    if (isGroup) {
      formData.append('groupId', profileToEdit.id)
      request = '/config/groups/saveMedia'
    } else if (isAdmin) {
      formData.append('peopleId', profileToEdit.id)
      request = '/config/people/saveMedia'
    }

    const options = {
      onUploadProgress: progressEvent => {
        const { loaded, total } = progressEvent
        const percent = Math.floor((loaded * 100) / total)
        setUploadProgress(percent)
      },
    }

    const { data } = await coreApi.post(request, formData, options)

    if (data.success) {
      const { completedChallenges, croppedImage, originalImage, rewardProgress } = data
      let image = originalImage ? originalImage.image : profileToEdit.originalImage

      // If saved from admin, update user in grid editor...JC
      onProfileUpdated({ originalImage: image, thumbnailImage: croppedImage.image })

      // Else update image here...JC
      if (!isAdmin) {
        // update global store with new image...PS
        if (isOwner) {
          setStore({
            user: { ...user, thumbnailImage: croppedImage.image, originalImage: image },
          })
        } else {
          setStore({ user: { ...user, pendingThumbnail: croppedImage.image } })
        }
      }
      setCelebration({ completeChallenges: completedChallenges, rewardProgress })
    }

    handleBack()
    setActive(editImageScreens.IMAGE_EDITOR)
    setInitialsBox(false)
    setSubmitting(false)
    setZoomValue(1.2)
    setRotateValue(0)

    if (clearFile.current) clearFile.current.value = null
  }

  const onSave = () => {
    if (editor) {
      // if no image is uploaded only update the thumbnail...PS
      if (!newImage) {
        const original = null
        const thumbNailBlob = dataURItoBlob(editor.getImageScaledToCanvas().toDataURL(profileToEdit.mimeType))

        uploadImage(profileToEdit.uploadName, original, thumbNailBlob)
      } else {
        const originalImgBlob = new Blob([originalImg], { type: originalImg.type })
        const thumbNailBlob = dataURItoBlob(editor.getImageScaledToCanvas().toDataURL(newImage.type))

        uploadImage(newImage.name, originalImgBlob, thumbNailBlob)
      }
    }
  }

  const imageEditorData = {
    ...props,
    editor,
    handleBack,
    initialsBox,
    isAdmin,
    isGroup,
    newImage,
    onSave,
    profileToEdit,
    rotateValue,
    setEditor,
    setImageURL,
    setInitialsBox,
    setNewImage,
    setOriginalImg,
    setRotateValue,
    setZoomValue,
    submitting,
    zoomValue,
  }

  const submitProfileImageData = {
    handleBack: () => setActive(editImageScreens.IMAGE_EDITOR),
    imageURL,
    isOwner,
    onSave,
    submitting,
    uploadProgress,
    user,
  }

  const components = [
    {
      Component: ImageEditor,
      data: imageEditorData,
    },
    {
      Component: imageURL && SubmitProfileImage,
      data: submitProfileImageData,
    },
  ]

  return (
    <Wrapper>
      {components.map(({ Component, data }, i) => (
        <Container active={active} index={i + 1} key={i}>
          {Component && (
            <Component
              {...data}
              active={active}
              cta={cta}
              editImageScreens={editImageScreens}
              ref={i === 0 ? clearFile : null}
              setActive={setActive}
            />
          )}
        </Container>
      ))}
    </Wrapper>
  )
}

ImageEditorWorkflow.propTypes = {
  cta: PropTypes.object,
  handleBack: PropTypes.func,
  height: PropTypes.number,
  isAdmin: PropTypes.bool,
  isGroup: PropTypes.bool,
  onProfileUpdated: PropTypes.func,
  profileToEdit: PropTypes.object,
  setShowEditProfileImage: PropTypes.func,
  width: PropTypes.number,
}

export default ImageEditorWorkflow
