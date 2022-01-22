import { createContext, useContext, useState } from 'react'
import PropTypes from 'prop-types'
const ProfileContext = createContext({})

export const ProfileProvider = ({ children }) => {
  const [profileType, setProfileType] = useState(null)
  const [selectedProfileId, setSelectedProfileId] = useState(null)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  return (
    <ProfileContext.Provider
      value={{
        profileType,
        selectedProfileId,
        showEditProfile,
        showProfile,
        setProfileType,
        setSelectedProfileId,
        setShowEditProfile,
        setShowProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

ProfileProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
}

export const useProfileContext = () => useContext(ProfileContext)
