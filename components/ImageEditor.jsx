import { forwardRef, useEffect, useState } from 'react'
import AvatarEditor from 'react-avatar-editor'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices, pills, RotateIcon, shadows } from '@assets'
import { CtaFooter, DynamicContainer, Image, InitialsBox, Layout, Loader, PillButton } from '@components'

const uploadStyles = {
  ...pills.primary.base,
  ...pills.primary.children,
  ...pills.small.base,
  ...pills.small.children,
  backgroundColor: colors.blurple,
  border: 'none',
  content: '',
  marginRight: '1rem',
}

const Button = styled.div`
  align-items: center;
  background-color: ${colors.white};
  box-shadow: ${shadows.button};
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  width: 56px;
`

const CanvasWrapper = styled(AvatarEditor)`
  border-radius: 20px;
`

const EditImageControls = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin: 1rem 0;
  width: 100%;
`

const EditorWrapper = styled.div`
  border-radius: 20px;
  height: auto;
  padding-top: 7rem;

  @media (${devices.mobile}) {
    padding-top: 1rem;
  }
`

const InputBtn = styled.div`
  display: flex;
  margin: 2rem 0 1rem 0;
  width: 100%;

  .image-upload::-webkit-file-upload-button {
    ${uploadStyles}
    -webkit-appearance: none; // override default IOS styles

    :focus {
      outline: none;
    }
  }

  // fyi, styles completely break if you try to combine these selectors. that's why they are separated...JK
  // only for firefox...PS
  .image-upload::file-selector-button {
    ${uploadStyles}

    &:focus {
      outline: none;
    }
  }
`

const LoaderWrapper = styled.div`
  align-items: center;
  background-color: ${colors.white};
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
`

const SliderWrapper = styled.div`
  align-items: center;
  display: flex;
  width: 100%;

  input[type='range'] {
    background: transparent;
    border-radius: 20px;
    box-shadow: ${shadows.card};
    height: 10px;
    margin-left: 20px;
    width: 100%; // Specific width is required for Firefox

    -webkit-appearance: none; // Hides the slider so that custom slider can be made
  }

  // Styling for WebKit
  input[type='range']::-webkit-slider-thumb {
    background: ${colors.blurple};
    border: none;
    border-radius: 50%;
    cursor: pointer;
    height: 26px;
    margin-top: -4px; // Specify a margin in Chrome
    width: 26px;

    -webkit-appearance: none;
  }

  // Firefox Styles
  input[type='range']::-moz-range-thumb {
    background: ${colors.blurple};
    border: none;
    border-radius: 50%;
    cursor: pointer;
    height: 26px;
    width: 26px;
  }
`

const Wrapper = styled(DynamicContainer)`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 50px 38px 150px;
`

const ImageEditor = forwardRef(
  (
    {
      cta,
      editImageScreens,
      editor,
      handleBack,
      handleNext,
      height,
      hideUpload = false,
      initialsBox,
      isAdmin,
      newImage,
      onSave,
      postScreens,
      profileToEdit,
      rotateValue,
      setActive,
      setEditor,
      setImageURL,
      setInitialsBox,
      setNewImage,
      setOriginalImg,
      setRotateValue,
      setZoomValue,
      submitting,
      width,
      zoomValue,
    },
    ref
  ) => {
    const [currentImage, setImage] = useState(null)

    // Converts cropped image into a usable URL...PS
    const croppedImageUrl = async url => {
      const canvas = url
      const res = await fetch(canvas)
      const blob = await res.blob()

      return setImageURL(URL.createObjectURL(blob))
    }

    const handleClose = () => {
      postScreens ? setActive(postScreens.DRAFT_POST) : handleBack()
      setRotateValue(0)
      setZoomValue(1.2)
    }

    // Sets cropped image to state to be previewed...PS
    const handleCroppedUrl = () => {
      if (editor) {
        if (!newImage) {
          const thumbNailBlob = editor.getImageScaledToCanvas().toDataURL(profileToEdit.mimeType)
          croppedImageUrl(thumbNailBlob)
        } else {
          const thumbNailBlob = editor.getImageScaledToCanvas().toDataURL(newImage.type)
          croppedImageUrl(thumbNailBlob)
        }
      }
    }

    const onFileChange = e => {
      setInitialsBox && setInitialsBox(false)
      setNewImage(e.target.files[0])
      setOriginalImg(e.target.files[0])
    }

    const setEditorRef = editor => setEditor(editor)

    useEffect(() => {
      if (profileToEdit && (profileToEdit.image || profileToEdit.originalImage.length > 2)) {
        setImage(`/api/site/utils/proxyMedia?url=${profileToEdit.image || profileToEdit.originalImage}`)
      } else {
        setInitialsBox && setInitialsBox(true)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileToEdit])

    useEffect(() => {
      setNewImage(newImage)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentImage])

    return (
      <Layout cta={cta} handleBack={handleClose} id='image-editor' inner noFooter title='Edit Photo'>
        <Wrapper outer>
          {initialsBox && profileToEdit.originalImage.length < 3 ? (
            <InitialsBox fontSize='10rem' height='300px' initials={profileToEdit.originalImage} radius='20px' width='300px' />
          ) : (
            <EditorWrapper>
              <CanvasWrapper
                borderRadius={20}
                className='editor'
                color={[255, 255, 255, 0.6]} // color of frame
                height={height}
                id='editor'
                image={newImage ? newImage : currentImage}
                ref={setEditorRef}
                rotate={rotateValue}
                scale={Number(zoomValue)}
                width={width}
              />
            </EditorWrapper>
          )}
          {!hideUpload && (
            <InputBtn>
              <input accept='.jpg,.jpeg,.png' className='image-upload' id='files' onChange={onFileChange} ref={ref} type='file' />
            </InputBtn>
          )}
          {profileToEdit?.originalImage || newImage ? (
            <EditImageControls>
              <Button id='rotate-btn' onClick={() => setRotateValue(rotateValue + 90)}>
                <Image src={RotateIcon} />
              </Button>
              <SliderWrapper>
                <input
                  className='slider'
                  id='zoomRange'
                  min='0.1'
                  max='10'
                  onChange={e => setZoomValue(Number(e.target.value))}
                  type='range'
                  step={0.1}
                  value={zoomValue}
                />
              </SliderWrapper>
            </EditImageControls>
          ) : (
            ''
          )}

          <CtaFooter>
            {isAdmin ? (
              <PillButton full id='save-profile-img-btn' onClick={onSave} text='Submit Photo' />
            ) : (
              <PillButton
                full
                id='save-profile-img-btn'
                onClick={() => {
                  handleCroppedUrl()
                  handleNext ? handleNext() : setActive(editImageScreens.SUBMIT_PROFILE_IMAGE)
                }}
                text={postScreens ? 'Save Image' : 'Next'}
              />
            )}
          </CtaFooter>

          <LoaderWrapper submitting={submitting}>
            <Loader />
          </LoaderWrapper>
        </Wrapper>
      </Layout>
    )
  }
)

ImageEditor.displayName = 'ImageEditor'

ImageEditor.propTypes = {
  cta: PropTypes.object,
  editImageScreens: PropTypes.object,
  editor: PropTypes.object,
  handleBack: PropTypes.func,
  handleNext: PropTypes.func,
  height: PropTypes.number,
  hideUpload: PropTypes.bool,
  initialsBox: PropTypes.bool,
  isAdmin: PropTypes.bool,
  newImage: PropTypes.object,
  onSave: PropTypes.func,
  postScreens: PropTypes.object,
  profileToEdit: PropTypes.object,
  rotateValue: PropTypes.number,
  setEditor: PropTypes.func,
  setActive: PropTypes.func,
  setImageURL: PropTypes.func,
  setInitialsBox: PropTypes.func,
  setNewImage: PropTypes.func,
  setOriginalImg: PropTypes.func,
  setRotateValue: PropTypes.func,
  setZoomValue: PropTypes.func,
  submitting: PropTypes.bool,
  width: PropTypes.number,
  zoomValue: PropTypes.number,
}

export default ImageEditor
