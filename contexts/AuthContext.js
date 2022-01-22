import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { parseCookies } from 'nookies'
import PropTypes from 'prop-types'

import { coreApi } from '@services'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [clientAccount, setClientAccount] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const { isReady, pathname, query } = useRouter()
  const { review_tkn, tkn } = parseCookies()

  const getClientAccount = useCallback(async () => {
    const { data: clientAccount } = await coreApi.get('/clientAccounts/current')
    setClientAccount(clientAccount)
  }, [])

  useEffect(() => {
    // NOTE: The client account is public and should be pulled before they log in...EK
    // Wait for query params to load before getting accountId...CY
    const hasToken = tkn || review_tkn
    const noCurrentQueries = Object.keys(query).length === 0
    const injectedPrevUrl = Boolean(query.prevUrl)
    if (isReady && (noCurrentQueries || injectedPrevUrl || hasToken)) getClientAccount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getClientAccount, isReady, pathname])

  return (
    <AuthContext.Provider
      value={{
        clientAccount,
        isAuthenticated,
        review_tkn,
        setClientAccount,
        setIsAuthenticated,
        tkn,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
}

export const useAuthContext = () => useContext(AuthContext)
