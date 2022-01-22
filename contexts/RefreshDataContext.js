import { createContext, useContext, useState } from 'react'
import { useRouter } from 'next/router'
import PropTypes from 'prop-types'

const RefreshDataContext = createContext({})

const DEFAULT_DELAY = 400

// Context that refreshes data state based on users page...JC
export const RefreshDataProvider = ({ children }) => {
  const { pathname } = useRouter()
  const page = pathname.replace('/', '')

  const initialState = {
    action: null,
    data: {},
  }

  const [dataUpdate, setDataUpdate] = useState(initialState)

  // Default slight delay to avoid query hits that pull data that isn't updated yet...JC
  const refreshData = ({ delay, ...updates }) => {
    setTimeout(() => setDataUpdate(updates), delay ?? DEFAULT_DELAY)
    resetData()
  }

  const resetData = () => setDataUpdate(initialState)

  // Props that watch for specific page updates...JC
  const newsfeedUpdate = page === 'newsfeed' && dataUpdate
  const profileUpdate = page === 'profile' && dataUpdate

  return (
    <RefreshDataContext.Provider value={{ dataUpdate, newsfeedUpdate, profileUpdate, refreshData }}>{children}</RefreshDataContext.Provider>
  )
}

RefreshDataProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
}

export const useRefreshDataContext = () => useContext(RefreshDataContext)
