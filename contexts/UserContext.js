import { createContext, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useRouter } from 'next/router'

import { useAuthContext, useCelebrationContext } from '@contexts'
import { coreApi } from '@services'
import { useStore } from '@utils'

const UserContext = createContext({})

// these rules are used to handle rerouting a user based on tokens and pathname...JK and CY
const platformRules = {
  portal: {
    nonAuthPaths: ['/portal'],
    authCheck: ({ review_tkn }) => !review_tkn,
    redirectUrl: () => '/portal',
  },
  wambiApp: {
    // admin and assist only purpose is to redirect users to the login screen...JK
    nonAuthPaths: [
      '/accountissue',
      '/nest',
      '/thanks',
      '/auth/login',
      '/auth/complete',
      '/error',
      '/404',
      '/admin',
      '/assist',
      '/admin/my-page',
    ],
    authCheck: ({ authTkn, user }) => !authTkn || !user,
    redirectUrl: () => '/auth/login',
  },
}

export const UserProvider = ({ children }) => {
  const [hasNewNotifications, setHasNewNotifications] = useState(false)
  const [insightList, setInsightList] = useState([])
  const [loginDataBundle, setLoginDataBundle] = useState(null)
  const [passwordModalDismiss, setPasswordModalDismiss] = useState(false)

  const { clientAccount, review_tkn, setClientAccount, setIsAuthenticated, tkn } = useAuthContext()
  const { setCelebration } = useCelebrationContext()

  const { pathname, push } = useRouter()
  const [setStore, { reset, user }] = useStore(
    state => {
      if (clientAccount == null) return

      // if a user doesn't have a valid session, reroute them to the login page...JK
      const data = { authTkn: tkn, review_tkn, user: state.user }
      validAuthSession(pathname, data)
    },
    [clientAccount]
  )

  const getUser = async () => {
    const { data: wambiUser } = await coreApi.get('/users/me')
    setStore({ user: wambiUser })
    return wambiUser
  }

  useEffect(() => {
    if (tkn && user) setIsAuthenticated(true)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tkn, user])

  //Make sure new notification is only called once on login and only on auth paths...CY
  useEffect(() => {
    const nonNotificationPath = ['/notifications', '/auth/complete', '/404', '/errors']

    if (tkn) {
      const checkForUnreadNotifications = async () => {
        if (nonNotificationPath.some(path => pathname.startsWith(path))) return
        const {
          data: { newNotification, success },
        } = await coreApi.get('/notifications/new')

        if (success) setHasNewNotifications(newNotification)
      }
      checkForUnreadNotifications()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Only set bundle if on the newsfeed, login data is set, and terms and services was accepted...CY
  useEffect(() => {
    const clientTermsExist = clientAccount?.clientTermsUrl
    const clientTermsExistAndAccepted = clientTermsExist && user?.clientTermsAt
    const passesClientTerms = !clientTermsExist || clientTermsExistAndAccepted

    const selfRegisterTermsExist = clientAccount?.selfRegisterTermsUrl
    const selfRegisterTermsExistAndAccepted = selfRegisterTermsExist && user?.selfRegisterAcceptedTermsAt
    const passesSelfRegisterTerms =
      user && (!user.isSelfRegistered || (user.isSelfRegistered && (!selfRegisterTermsExist || selfRegisterTermsExistAndAccepted)))

    // Check if terms are disabled for the client account...KA
    const accountTermsDisabled = clientAccount?.settings?.disableTermsOfService === true

    // Check if it passes all terms checks...KA
    const passesAllTerms = accountTermsDisabled || (user?.acceptedTermsAt && passesClientTerms && passesSelfRegisterTerms)

    // Check if the user has a password set or dismiss the set password modal...CY
    const passwordCheck = user?.hasPassword || passwordModalDismiss

    if (pathname === '/newsfeed' && loginDataBundle && passesAllTerms && passwordCheck) {
      const { completedChallenges, hasNewLessons, rewardProgress } = loginDataBundle
      setLoginDataBundle(null)

      setTimeout(
        () => {
          setCelebration({ completeChallenges: completedChallenges, rewardProgress })
        },
        // Set timeout based on if perks are converting...CY
        rewardProgress?.convertedPecks ? 3000 : 2000
      )
      setStore({ hasNewLessons })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loginDataBundle,
    pathname,
    passwordModalDismiss,
    user?.acceptedTermsAt,
    user?.clientTermsAt,
    user?.selfRegisterAcceptedTermsAt,
    user?.hasPassword,
  ])

  // If tkn becomes null through deletion and user presses back button, this catches it...JC
  useEffect(() => {
    if (clientAccount == null) return

    if (!tkn) {
      validAuthSession(pathname, { authTkn: tkn, review_tkn })
    }

    const validateUser = async () => {
      await getUser()
      validAuthSession(pathname, { authTkn: tkn, review_tkn })
    }

    // Refetches user when switching between client accounts...KA
    if (tkn && !user) validateUser()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientAccount, pathname, review_tkn, tkn])

  const login = async (loginId, password) => {
    const {
      data: { completedChallenges, hasNewLessons, rewardProgress, success, msg },
    } = await coreApi.post('/auth/authWithCreds', { loginId, password })

    if (success) {
      setIsAuthenticated(true)
      setLoginDataBundle({ completedChallenges, hasNewLessons, rewardProgress })
      await getUser()
      return { success: true }
    } else {
      return { success: false, msg }
    }
  }

  const logout = async path => {
    // get token Signature...PS
    const tokenId = tkn.split('.')[2]

    if (tokenId) {
      await coreApi.post('/auth/signOut', {})
      if (path) return push(path)
      reset()
      setClientAccount(null)
    }

    if (path) return push(path)
    window.location.pathname = '/thanks'
  }

  // checks a user's url and reroutes them if they are trying to access unathorized pages when not logged in...JK and CY
  const validAuthSession = (pathname, data) => {
    const platform = pathname.includes('portal') ? 'portal' : 'wambiApp'
    const { nonAuthPaths, authCheck, redirectUrl } = platformRules[platform]
    const invalidEntry = nonAuthPaths.every(p => p !== pathname) && authCheck({ ...data })

    if (invalidEntry) {
      // If we have the root or nest, we don't want to track these as previous URLs...EK
      if (pathname !== '/' && pathname !== '/nest') window.location.href = `${redirectUrl()}?prevUrl=${pathname}`
      else window.location.href = redirectUrl()
    }
  }

  const readNotification = () => setHasNewNotifications(false)

  return (
    <UserContext.Provider
      value={{
        getUser,
        hasNewNotifications,
        insightList,
        login,
        logout,
        passwordModalDismiss,
        readNotification,
        setInsightList,
        setLoginDataBundle,
        setPasswordModalDismiss,
        user,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

UserProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
}

export const useUserContext = () => useContext(UserContext)
