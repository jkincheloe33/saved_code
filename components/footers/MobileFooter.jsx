import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { BellIcon, colors, devices, HomeIcon, HubIcon, MobileFooterImage, PersonIcon, SearchIcon, shadows, WambiWhiteBird } from '@assets'
import { Image, NumberIndicator, RoundButton } from '@components'
import { usePostContext, useSpacingContext, useUserContext } from '@contexts'

const { blurple, white } = colors

const Background = styled(Image)`
  bottom: 0;
  left: 50%;
  position: absolute;
  max-width: none;
  transform: translateX(-50%);

  @media (min-width: 414px) {
    display: none;
  }
`

const BellWrapper = styled.div`
  height: 25px;
  position: relative;
`

const Container = styled.div`
  background-size: cover;
  border-top-left-radius: 25px;
  border-top-right-radius: 25px;
  display: flex;
  height: 81.54px;
  justify-content: space-between;
  position: relative;
  width: 100%;
  /* z-index: 5 will keep it above the PeopleTile that is z-index: 1->3 max...JC */
  z-index: 5;

  @media (min-width: 414px) {
    background-color: ${white};
    box-shadow: ${shadows.mobileFooter};
  }
`

const SendOptionBtn = styled(RoundButton)`
  left: 50%;
  position: absolute;
  text-align: center;
  top: -28px;
  transform: translateX(calc(-50% + 1px));
  transition: background-color 250ms ease-out;
`

const SideWrapper = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-evenly;
  width: 40%;

  svg {
    cursor: pointer;
    height: 27px;
    position: relative;
    width: 27px;
  }
`

const Wrapper = styled.div`
  bottom: 0;
  position: fixed;
  width: 100%;

  @media (${devices.largeDesktop}) {
    display: none;
  }
`

const MobileFooter = ({ count }) => {
  const { hasNewNotifications, user } = useUserContext()
  const { setShowSendCpc } = usePostContext()
  const { setFooterHeight } = useSpacingContext()
  const ref = useRef(null)
  const router = useRouter()
  const { asPath } = router
  const page = asPath.replace('/', '')

  useEffect(() => {
    if (ref.current) setFooterHeight(ref.current.clientHeight)
  }, [setFooterHeight])

  return (
    <Wrapper ref={ref}>
      <Container>
        <Background alt='mobile-footer-image' src={MobileFooterImage} />
        <SendOptionBtn
          iconWidth='32px'
          id='send-mail-icon'
          image={{ alt: 'send option icon', src: WambiWhiteBird }}
          onClick={() => setShowSendCpc(true)}
          shadow
        />
        <SideWrapper>
          <HomeIcon color={page === 'newsfeed' && blurple} id={'footer-newsfeed-icon'} onClick={() => router.push('/newsfeed')} />
          <SearchIcon color={page === 'search' && blurple} id={'footer-search-icon'} onClick={() => router.push('/search')} />
        </SideWrapper>
        <SideWrapper>
          {user?.isLeader ? (
            <HubIcon color={page === 'hub' && blurple} id={'footer-hub-icon'} onClick={() => router.push('/hub')} />
          ) : (
            <BellWrapper id={'footer-notifications-icon'} onClick={() => router.push('/notifications')}>
              <BellIcon color={page === 'notifications' && blurple} />
              {hasNewNotifications && <NumberIndicator count={count} ratio='16px' right={'-4px'} small top={'-3px'} />}
            </BellWrapper>
          )}
          <PersonIcon color={page === 'profile' && blurple} id={'footer-profile-icon'} onClick={() => router.push('/profile')} />
        </SideWrapper>
      </Container>
    </Wrapper>
  )
}

MobileFooter.propTypes = {
  count: PropTypes.number,
}

export default MobileFooter
