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

// MyPage now forward users from HMH to newsfeed because they might have /admin/my-page bookmarked on their computers from W3...JK
const MyPage = () => {
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

export default MyPage
