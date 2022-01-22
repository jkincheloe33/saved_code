import { useRouter } from 'next/router'

import { WambiThanks } from '@assets'
import { ErrorPageLayout } from '@components'

export default function Thanks() {
  const router = useRouter()

  return (
    <ErrorPageLayout
      cta={{ onClick: () => router.push('/'), text: 'Sign in again' }}
      image={WambiThanks}
      text='You have signed out. Click below to sign back in.'
      title='Thanks for using Wambi!'
    />
  )
}
