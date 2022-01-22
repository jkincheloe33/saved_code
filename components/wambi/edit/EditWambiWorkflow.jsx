import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { EditWambiCompose, ImageSearch, ImageTheme } from '@components'
import { useEditPostContext, usePostContext } from '@contexts'

const cpcScreens = {
  COMPOSE: 1,
  IMAGES: 2,
  THEME_DETAILS: 3,
}

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
`

const EditWambiWorkflow = () => {
  const [active, setActive] = useState(cpcScreens.COMPOSE)
  const [cpcData, setCpcData] = useState({
    content: '',
    media: null,
    type: null,
  })

  const { existingPostData, selectedCpcType, setExistingPostData, setShowEditCpcWorkflow } = useEditPostContext()
  const { selectedCpcTheme, setSelectedCpcTheme } = usePostContext()

  const handleCancelCpc = () => {
    setShowEditCpcWorkflow(false)
    setTimeout(() => {
      setExistingPostData(null)
      setCpcData({
        content: '',
        media: null,
        type: null,
      })
    }, 250)
  }

  useEffect(() => {
    // sets banner & message to cpcData once existingPostData loads...JK
    if (existingPostData) setCpcData(cd => ({ ...cd, content: existingPostData?.content, media: existingPostData?.banner }))
    // sets type to cpcData once selectedCpcType is calculated and loaded...JK
    if (selectedCpcType) setCpcData(cd => ({ ...cd, type: selectedCpcType }))
  }, [existingPostData, selectedCpcType])

  const imageCategoryData = {
    handleBack: () => {
      setActive(cpcScreens.IMAGES)
      setTimeout(() => setSelectedCpcTheme(null), 500)
    },
  }

  const imageSearchData = {
    handleBack: () => setActive(cpcScreens.COMPOSE),
  }

  const components = [
    {
      Component: cpcData?.type && existingPostData && EditWambiCompose,
      data: {
        recipients: existingPostData?.recipients,
        recipientCount: existingPostData?.recipientCount,
      },
    },
    {
      Component: ImageSearch,
      data: imageSearchData,
    },
    {
      Component: selectedCpcTheme && ImageTheme,
      data: imageCategoryData,
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
              cpcData={cpcData}
              cpcScreens={cpcScreens}
              cta={{
                onClick: handleCancelCpc,
                text: 'Cancel',
              }}
              setActive={setActive}
              setCpcData={setCpcData}
            />
          )}
        </Container>
      ))}
    </Wrapper>
  )
}

EditWambiWorkflow.propTypes = {
  handleBack: PropTypes.func,
  selectedProfile: PropTypes.object,
}

export default EditWambiWorkflow
