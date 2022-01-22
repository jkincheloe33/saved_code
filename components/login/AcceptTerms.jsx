import { useEffect, useState } from 'react'

import { TermsModal } from '@components'
import { useAuthContext } from '@contexts'
import { coreApi } from '@services'
import { useStore } from '@utils'

const AcceptTerms = () => {
  const { clientAccount } = useAuthContext()

  const [setStore, { user }] = useStore()
  const [showTerms, setShowTerms] = useState(false)

  useEffect(() => {
    if (user && clientAccount?.settings?.disableTermsOfService !== true) {
      // Check user to make sure terms don't show up when signing out...CY
      if (!user.acceptedTermsAt && !showTerms) setShowTerms(true)

      // Check if the client has terms the user hasn't accepted yet...KA
      if (clientAccount?.clientTermsUrl && !user.clientTermsAt) setShowTerms(true)

      // Check if the client has self register terms the user hasn't accepted yet (if user is self registered)...KA
      if (user.isSelfRegistered && clientAccount?.selfRegisterTermsUrl && !user.selfRegisterTermsAcceptedAt) setShowTerms(true)
    }
  }, [clientAccount, showTerms, user])

  const acceptTerms = async () => {
    const {
      data: { clientTermsUpdated, peopleTermsUpdated, selfRegisterTermsUpdated, success },
    } = await coreApi.get('/auth/acceptTerms')

    if (success) {
      await setStore({
        user: {
          ...user,
          acceptedTermsAt: peopleTermsUpdated ? new Date() : user.acceptedTermsAt,
          clientTermsAt: clientTermsUpdated ? new Date() : user.clientTermsAt,
          selfRegisterTermsAcceptedAt: selfRegisterTermsUpdated ? new Date() : user.selfRegisterTermsAcceptedAt,
        },
      })
      setShowTerms(false)
    }
  }

  return <TermsModal acceptTerms={acceptTerms} showTerms={showTerms} />
}

export default AcceptTerms
