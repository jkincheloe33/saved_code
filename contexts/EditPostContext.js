import { createContext, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { coreApi } from '@services'

const EditPostContext = createContext({})

export const EditPostProvider = ({ children }) => {
  const [cpcTypeId, setCpcTypeId] = useState(null)
  const [existingPostData, setExistingPostData] = useState(null)
  const [selectedCpcType, setSelectedCpcType] = useState(null)
  const [showEditCpcWorkflow, setShowEditCpcWorkflow] = useState(false)
  const [showEditPostWorkflow, setShowEditPostWorkflow] = useState(false)

  // gets the cpcTypeId using the current feedItem being edited...JK
  useEffect(() => {
    const getCpcTypeId = async () => {
      const {
        data: { success, cpcTypeId },
      } = await coreApi.post('/wambi/types/getWambiTypeId', { cpcId: existingPostData.cpcId })

      if (success) setCpcTypeId(cpcTypeId)
    }

    if (existingPostData?.cpcId) getCpcTypeId()
    else {
      setCpcTypeId(null)
      setSelectedCpcType(null)
    }
  }, [existingPostData])

  // gets the cpcType for the current feedItem based on the cpcTypeId. this runs after the above useEffect...JK
  useEffect(() => {
    const getCpcType = async () => {
      const {
        data: { success, type },
      } = await coreApi.post('/wambi/types/getWambiTypeById', { cpcTypeId })

      if (success) setSelectedCpcType(type)
    }

    if (cpcTypeId) getCpcType()
  }, [cpcTypeId])

  return (
    <EditPostContext.Provider
      value={{
        existingPostData,
        showEditPostWorkflow,
        selectedCpcType,
        setExistingPostData,
        setShowEditCpcWorkflow,
        setShowEditPostWorkflow,
        showEditCpcWorkflow,
      }}
    >
      {children}
    </EditPostContext.Provider>
  )
}

EditPostProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
}

export const useEditPostContext = () => useContext(EditPostContext)
