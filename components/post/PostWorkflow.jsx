import { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices } from '@assets'
import { DraftPost, DraftsList, ImageEditor, SubmitProfileImage, UploadVideo } from '@components'
import { useDraftContext, usePostContext } from '@contexts'
import { FEED_ITEM_TYPES } from '@utils'

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
  background-color: ${colors.gray8};
  display: flex;
  flex-wrap: nowrap;
  height: 100%;
  width: 100%;

  @media (${devices.desktop}) {
    background-color: ${colors.white};
  }

  canvas {
    height: 100% !important;
    width: 100% !important;
  }
`

const PostWorkflow = ({ handleBack, ...props }) => {
  const { postScreens } = usePostContext()
  const { showDraftsList } = useDraftContext()
  const [active, setActive] = useState(showDraftsList ? postScreens.DRAFTS_LIST : postScreens.DRAFT_POST)
  const [editor, setEditor] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [imageURL, setImageURL] = useState(null)
  const [newImage, setNewImage] = useState(null)
  const [rotateValue, setRotateValue] = useState(0)
  const [selectedDraft, setSelectedDraft] = useState(null)
  const [videoUploaded, setVideoUploaded] = useState(false)
  const [zoomValue, setZoomValue] = useState(1.2)

  const height = 350
  const width = 680

  const handleSelectedDraft = ({ draftData, failedDraft, id }) => {
    const { groups } = draftData
    setSelectedDraft({ failedDraft, groups, id })
    setActive(postScreens.DRAFT_POST)
  }

  const draftsListData = {
    ...props,
    handleSelectedDraft,
    itemType: FEED_ITEM_TYPES.ANNOUNCEMENT,
  }

  const draftData = {
    ...props,
    editor,
    handleBack,
    height,
    imageURL,
    itemType: FEED_ITEM_TYPES.ANNOUNCEMENT,
    newImage,
    selectedDraft,
    setErrorMessage,
    setImageURL,
    setNewImage,
    setSelectedDraft,
    setVideoUploaded,
    setZoomValue,
    width,
  }

  const uploadVideoData = {
    ...props,
    errorMessage,
    handleBack,
    videoUploaded,
  }

  const imageData = {
    ...props,
    editor,
    handleBack,
    handleNext: () => setActive(postScreens.DRAFT_POST),
    height,
    hideUpload: true,
    newImage,
    rotateValue,
    setEditor,
    setImageURL,
    setNewImage,
    setRotateValue,
    setZoomValue,
    width,
    zoomValue,
  }

  const submitProfileImageData = {
    ...props,
  }

  const components = [
    {
      Component: DraftsList,
      data: draftsListData,
    },
    {
      Component: DraftPost,
      data: draftData,
    },
    {
      Component: videoUploaded && UploadVideo,
      data: uploadVideoData,
    },
    { Component: newImage && ImageEditor, data: imageData },
    { Component: SubmitProfileImage, data: submitProfileImageData },
  ]

  return (
    <Wrapper>
      {components.map(({ Component, data }, i) => (
        <Container active={active} index={i + 1} key={i}>
          {Component && (
            <Component
              {...data}
              active={active}
              cta={{ onClick: handleBack, text: 'Close' }}
              postScreens={postScreens}
              setActive={setActive}
            />
          )}
        </Container>
      ))}
    </Wrapper>
  )
}

PostWorkflow.propTypes = {
  handleBack: PropTypes.func,
}

export default PostWorkflow
