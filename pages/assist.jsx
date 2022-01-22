import { useEffect } from 'react'
import { useRouter } from 'next/router'
import styled from 'styled-components'

import { colors } from '@assets'
import { Loader } from '@components'

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

// Page created to forward users from HMH to newsfeed who have /assist bookmarked on their computers...JK
const Assist = () => {
  const { push } = useRouter()

  useEffect(() => {
    push('/newsfeed')
  }, [push])

  return (
    <LoaderWrapper>
      <Loader />
    </LoaderWrapper>
  )
}

export default Assist
