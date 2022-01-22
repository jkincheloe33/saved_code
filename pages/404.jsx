import { useRouter } from 'next/router'

import { FourOhFourImage } from '@assets'
import { ErrorPageLayout } from '@components'

const FourOhFourPage = () => {
  const router = useRouter()

  return (
    <ErrorPageLayout
      cta={{ onClick: () => router.push('/'), text: 'Return home' }}
      image={FourOhFourImage}
      support
      text="Whoops, this is embarassing. Looks like the page you were looking for wasn't found."
      title='Page Not Found'
    />
  )
}

export default FourOhFourPage
