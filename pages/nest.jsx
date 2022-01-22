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

export default function Nest() {
  const { isAuthenticated } = useAuthContext()
  const router = useRouter()

  if (global.window != null) {
    // Nest overrides any SSO default settings, so if they are not authenticated, go strait to wambi login...EK
    if (isAuthenticated === false) {
      router.push('/auth/login')
    } else {
      router.push('/auth/complete')
    }
  }

  return (
    <LoaderWrapper>
      <Loader />
    </LoaderWrapper>
  )
}
