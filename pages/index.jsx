import styled from 'styled-components'
import { useRouter } from 'next/router'
import { useAuthContext } from '@contexts'

import { Loader } from '@components'

const LoaderWrapper = styled.div`
  align-items: center;
  bottom: 0;
  display: flex;
  justify-content: center;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`

export default function Index() {
  const { isAuthenticated } = useAuthContext()
  const router = useRouter()

  if (global.window != null) {
    // If they are authenticated go to complete, otherwise the auth context will send to the correct login screen...EK
    if (isAuthenticated) {
      router.push('/auth/complete')
    }
  }

  return (
    <LoaderWrapper>
      <Loader />
    </LoaderWrapper>
  )
}
