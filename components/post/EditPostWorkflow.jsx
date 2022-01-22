import { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices } from '@assets'
import { EditPost, UploadVideo } from '@components'
import { useEditPostContext } from '@contexts'

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
`

const editPostScreens = {
  EDIT_POST: 1,
  UPLOAD_VIDEO: 2,
}

const EditPostWorkFlow = ({ handleBack, ...props }) => {
  const { existingPostData } = useEditPostContext()
  const [active, setActive] = useState(editPostScreens.EDIT_POST)
  const [errorMessage, setErrorMessage] = useState(null)
  const [videoUploaded, setVideoUploaded] = useState(false)

  const editPost = true

  const editPostData = {
    ...props,
    editPostScreens,
    errorMessage,
    existingPostData,
    handleBack,
    setErrorMessage,
    setVideoUploaded,
  }

  const uploadVideoData = {
    ...props,
    editPost,
    errorMessage,
    handleBack,
    videoUploaded,
  }

  const components = [
    {
      Component: editPostData && EditPost,
      data: editPostData,
    },
    {
      Component: videoUploaded && UploadVideo,
      data: uploadVideoData,
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
              cta={{ onClick: handleBack, text: 'close' }}
              editPostScreens={editPostScreens}
              setActive={setActive}
            />
          )}
        </Container>
      ))}
    </Wrapper>
  )
}

EditPostWorkFlow.propTypes = {
  handleBack: PropTypes.func,
  handleClose: PropTypes.func,
  rewardClaimId: PropTypes.number,
}

export default EditPostWorkFlow
