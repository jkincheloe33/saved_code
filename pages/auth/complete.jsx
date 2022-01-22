import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useRouter } from 'next/router'

import { colors } from '@assets'
import { Loader } from '@components'
import { useAuthContext, useUserContext } from '@contexts'
import { coreApi } from '@services'
import { getExtraQueryParams, useStore } from '@utils'

const LoaderWrapper = styled.div`
  align-items: center;
  background-color: ${colors.white};
  display: flex;
  height: 100%;
  justify-content: center;
  left: 0;
  position: fixed;
  top: 0;
  transition: opacity 250ms ease;
  width: 100%;
`

/**
 * This page return empty for reasons:
 * - Check cookie token and user data in local storage. If user data doesn't exist then add user data to local storage
 * - Redirect SSO and manual login based on role
 * - Declined access to nonvalid users
 *   - User doesn't have a Wambi account
 *   - Account has been locked
 */

const AuthComplete = () => {
  const { clientAccount, isAuthenticated, tkn } = useAuthContext()
  const [, { reset }] = useStore()
  const { getUser, setLoginDataBundle, logout, user } = useUserContext()

  const [authChecked, setAuthChecked] = useState(false)
  const [loadedLoginData, setLoadedSsoData] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const authCheck = async () => {
      if (tkn && !user) {
        await getUser()
      }
      setAuthChecked(true)
    }
    authCheck()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const loadLoginDataBundle = async () => {
      const {
        data: { loginData, success },
      } = await coreApi.get('/auth/completeUserLogin')
      if (success) setLoginDataBundle(loginData)
    }

    if (authChecked) {
      let { prevUrl } = router.query
      const extraQuery = getExtraQueryParams(router.query)

      // if a user is not tied to any groups, log them out and send them to the accountissue page...JK
      if (user?.groups.length === 0) {
        if (prevUrl !== '/config') {
          setAuthChecked(false)
          return logout('/accountissue')
        }
      }

      if (isAuthenticated) {
        if (!loadedLoginData) {
          setLoadedSsoData(true)
          loadLoginDataBundle()
        }

        const redirectUrl = prevUrl ? prevUrl + extraQuery : '/newsfeed'
        return router.push(redirectUrl)
      }

      //Reset store if user session expires...CY
      if (user) reset()

      const query = prevUrl ? `?prevUrl=/${prevUrl + extraQuery}` : ''
      router.push(`/auth/login${query}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, clientAccount, isAuthenticated, logout, router, user])

  return (
    <LoaderWrapper>
      <Loader />
    </LoaderWrapper>
  )
}

export default AuthComplete
