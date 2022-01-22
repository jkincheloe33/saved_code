import { useState } from 'react'
import { useRouter } from 'next/router'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices } from '@assets'
import { EmailSignUp, ImageEditor, Loader, SelfRegisterInfo, VerifyCode } from '@components'
import { coreApi } from '@services'
import { dataURItoBlob } from '@utils'

const selfRegisterScreens = {
  EMAIL_SIGN_UP: 1,
  VERIFY_CODE: 2,
  PERSON_INFO: 3,
  IMAGE_EDITOR: 4,
}

const Container = styled.div`
  flex: 0 0 100%;
  height: 100%;
  opacity: ${p => (p.active === p.index ? 1 : 0)};
  transform: translateX(${p => (p.active - 1) * -100}%);
  transition: all 500ms cubic-bezier(0.88, 0.03, 0.09, 0.98);
  width: 100%;
`

const LoaderWrapper = styled.div`
  align-items: center;
  background-color: ${colors.white}D9;
  display: flex;
  height: 100%;
  justify-content: center;
  left: 0;
  opacity: ${p => (p.loading ? 1 : 0)};
  pointer-events: ${p => (p.loading ? 'auto' : 'none')};
  position: fixed;
  top: 0;
  transition: opacity 250ms ease;
  width: 100%;
  z-index: 5;
`

const Wrapper = styled.div`
  align-items: flex-start;
  display: flex;
  flex-wrap: nowrap;
  height: 100%;

  @media (${devices.largeDesktop}) {
    width: 414px;
  }
`

const SelfRegisterWorkflow = ({ handleBack, ...props }) => {
  const [active, setActive] = useState(selfRegisterScreens.EMAIL_SIGN_UP)
  const [editor, setEditor] = useState(null)
  const [imageURL, setImageURL] = useState(null)
  const [loading, setLoading] = useState(false)
  const [newImage, setNewImage] = useState(null)
  const [person, setPerson] = useState({
    email: '',
    firstName: '',
    jobTitle: '',
    lastName: '',
  })
  const [rotateValue, setRotateValue] = useState(0)
  const [uid, setUid] = useState(null)
  const [zoomValue, setZoomValue] = useState(1.2)

  const { push } = useRouter()

  const createFormData = ({ original, thumbnail }) => {
    const formData = new FormData()

    formData.append('selfRegisterInfo', JSON.stringify({ ...person, uid }))
    if (thumbnail) formData.append('thumbnail', thumbnail)
    if (original) formData.append('original', original)

    return formData
  }

  const handleSendCode = async emailInput => {
    const {
      data: { msg, success, uuid },
    } = await coreApi.post('/auth/selfRegister/requestCode', { email: emailInput || person.email, uid })

    if (success && uuid) setUid(uuid)

    return { msg, success }
  }

  const handleVerifyCode = async code => {
    const {
      data: { msg, success },
    } = await coreApi.post('/auth/selfRegister/verifyCode', { code, email: person.email, uid })

    if (success) {
      setActive(selfRegisterScreens.PERSON_INFO)
      setLoading(false)
    }
    return { msg, success }
  }

  const registerUser = async () => {
    setLoading(true)

    const original = newImage ? new Blob([newImage], { type: newImage.type }) : null
    const thumbnail = newImage ? dataURItoBlob(editor.getImageScaledToCanvas().toDataURL(newImage.type)) : null
    const formData = createFormData({ original, thumbnail })

    const {
      data: { success },
    } = await coreApi.post('/auth/selfRegister/signUp', formData)

    if (success) push('/auth/complete')
    else setLoading(false)
  }

  const emailSignUpData = {
    ...props,
    handleBack,
    handleSendCode,
    setEmail: email => setPerson(p => ({ ...p, email })),
    setLoading,
  }

  const selfRegisterInfoData = {
    ...person,
    handleBack,
    imageURL,
    newImage,
    registerUser,
    setNewImage,
  }

  const ImageEditorData = {
    editor,
    handleBack: () => setActive(selfRegisterScreens.PERSON_INFO),
    handleNext: () => setActive(selfRegisterScreens.PERSON_INFO),
    height: 325,
    hideUpload: true,
    newImage,
    rotateValue,
    setEditor,
    setImageURL,
    setNewImage,
    setRotateValue,
    setZoomValue,
    width: 325,
    zoomValue,
  }

  const verifyCodeData = {
    email: person.email,
    handleBack: () => setActive(selfRegisterScreens.EMAIL_SIGN_UP),
    handleSendCode,
    handleVerifyCode,
    setSubmitting: setLoading,
  }

  const components = [
    {
      Component: EmailSignUp,
      data: emailSignUpData,
    },
    {
      Component: person.email && VerifyCode,
      data: verifyCodeData,
    },
    {
      Component: person.email && SelfRegisterInfo,
      data: selfRegisterInfoData,
    },
    {
      Component: ImageEditor,
      data: ImageEditorData,
    },
  ]

  return (
    <Wrapper>
      {components.map(({ Component, data }, i) => (
        <Container active={active} index={i + 1} key={i}>
          {Component && (
            <Component {...data} active={active} selfRegisterScreens={selfRegisterScreens} setActive={setActive} setPerson={setPerson} />
          )}
        </Container>
      ))}
      <LoaderWrapper loading={loading ? 1 : 0}>
        <Loader />
      </LoaderWrapper>
    </Wrapper>
  )
}

SelfRegisterWorkflow.propTypes = {
  handleBack: PropTypes.func,
}

export default SelfRegisterWorkflow
