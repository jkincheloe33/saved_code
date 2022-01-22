import { useRouter } from 'next/router'

import { OopsImage } from '@assets'
import { ErrorPageLayout } from '@components'

const ErrorPage = () => {
  const router = useRouter()

  return (
    <ErrorPageLayout
      alt='Oops, I did it again'
      cta={{ onClick: () => router.push('/'), text: 'Return home' }}
      image={OopsImage}
      support
      text='You’re so engaged with Wambi, you found our error page. Want to help us fix it?'
      title='Oops!'
    />
  )
}

export default ErrorPage
