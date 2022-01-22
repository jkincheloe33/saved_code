import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import styled from 'styled-components'

import { AnalyticsIcon, BellIcon, colors, ConfigIcon, devices, HomeIcon, HubIcon, PersonIcon, WambiLogo, WambiTagline } from '@assets'
import { Image, Modal, NavDropdown, NotificationList, NumberIndicator, SearchBar as SearchBarBase, SearchList } from '@components'
import { useProfileContext, useUserContext } from '@contexts'
import { coreApi } from '@services'
import { ACCOUNT_ACCESS_LEVELS, GROUP_ACCESS_LEVELS as levels, useCallbackDelay } from '@utils'

import Header from './Header'
import SideBar from './SideBar'
import SideBarModals from './SideBarModals'

const DROPDOWN = {
  CLOSE: 0,
  MENU: 1,
  NOTIFICATIONS: 2,
  SEARCH: 3,
  CONFIG: 4,
}

// prettier-ignore
const Bar = styled.div`
  background-color: ${colors.gray1};
  border-radius: 12px;
  height: 2px;
  left: 0;
  position: absolute;
  top: 0;
  transform-origin: top left;
  transition: transform 250ms ease;
  width: 100%;

  &:nth-of-type(2) {
    top: 50%;
    transform: scale(1) translateY(-50%);
  }

  &:last-of-type {
    bottom: 0;
    top: auto;
  }

  ${p => p.expanded && `
    transform: rotate(45deg);

    &:nth-of-type(2) {
      transform: scaleX(0) translateY(-50%);
      transform-origin: center left;
    }

    &:last-of-type {
      transform: rotate(-45deg) translateY(-1px);
      transform-origin: bottom left;
    }
  `}
`

const BellWrapper = styled.div`
  display: none;
  height: 25px;
  position: relative;

  @media (${devices.largeDesktop}) {
    display: block;
  }
`

const Bird = styled(Image)`
  width: 32px;
`

// needed to increase clickable area for mobile...JK
const Close = styled.div`
  cursor: pointer;
  margin-left: 15px;
  padding: 8px;

  @media (${devices.largeDesktop}) {
    display: none;
  }
`

const DesktopClose = styled(Close)`
  display: none;

  @media (${devices.largeDesktop}) {
    display: block;
  }
`

const Hamburger = styled.div`
  height: 19px;
  position: relative;
  width: 24px;
  z-index: 6;
`

const HamburgerDropdown = styled(NavDropdown)`
  display: none;

  @media (${devices.largeDesktop}) {
    display: flex;
  }
`

const Icon = styled.div`
  path {
    transition: fill 250ms ease;
  }

  @media (${devices.largeDesktop}) {
    &:hover {
      svg path {
        fill: ${colors.blurple};

        ${p => p.stroke && `stroke: ${colors.blurple};`}
      }
    }
  }
`

const Item = styled.div`
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  justify-content: ${p => (p.center ? 'center' : 'flex-start')};

  @media (${devices.largeDesktop}) {
    flex: 0 0 33.3%;
  }
`

const Logo = styled.a`
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  width: 120px;
`

// needed to override other icons styles...JK
const ManagementBellIcon = styled(BellIcon)``

const ManagementBell = styled(BellWrapper)`
  align-items: center;
  display: flex;

  ${ManagementBellIcon} {
    display: block;
    margin: 0;
  }
`

const ManagementItem = styled(Item)`
  @media (${devices.largeDesktop}) {
    display: none;
  }
`

const Menu = styled(Item)`
  justify-content: flex-end;

  svg {
    cursor: pointer;
    display: none;
    height: 21px;
    margin: 0 15px;
    position: relative;
    width: 21px;

    @media (${devices.largeDesktop}) {
      display: block;
    }
  }
`

const MobileModal = styled(Modal)`
  display: flex;

  @media (${devices.largeDesktop}) {
    display: none;
  }
`

const SearchBar = styled(SearchBarBase)`
  display: none;

  @media (${devices.largeDesktop}) {
    display: flex;
  }
`

const Tagline = styled(Image)`
  width: 88px;
`

const MainNav = () => {
  const [dropdown, setDropdown] = useState(DROPDOWN.CLOSE)
  const [expanded, setExpanded] = useState(false)
  const [modalComponent, setModalComponent] = useState(null)
  const [profileImage, setProfileImage] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchList, setSearchList] = useState(null)
  const [showCollectReviews, setShowCollectReviews] = useState(false)
  const [showFeedbackWorkflow, setShowFeedbackWorkflow] = useState(false)
  const [showVerifyPassword, setShowVerifyPassword] = useState(false)

  const { hasNewNotifications, readNotification } = useUserContext()
  const { setShowEditProfile } = useProfileContext()
  const { user } = useUserContext()
  const { pathname, push } = useRouter()
  const page = pathname.replace('/', '')
  const notificationRef = useRef(null)
  const searchRef = useRef(null)
  const menuRef = useRef(null)
  const mobileMenuRef = useRef(null)

  // Get a collection of nav element not trigger on dropdown handleClickOut event...CY
  const navRefs = [menuRef, mobileMenuRef, notificationRef, searchRef]

  const groupAccessLevelCheck = user?.groupAccessLevel > levels.TEAM_MEMBER
  const clientAccessLevelCheck = user?.clientAccessLevel >= ACCOUNT_ACCESS_LEVELS.SYSTEM_ADMIN

  const sideBarProps = {
    setShowCollectReviews,
    setShowFeedbackWorkflow,
    setShowVerifyPassword,
    showCollectReviews,
    showFeedbackWorkflow,
    showVerifyPassword,
  }

  // delay search results till user finishes typing or default/specified delay has passed...JK
  useCallbackDelay(() => {
    if (searchInput.length > 2) handleSearch()
    else setSearchList(null)
  }, [searchInput])

  useEffect(() => {
    const loadProfileImage = async () => {
      if (user) {
        const thumbnail = user.thumbnailImage

        if (thumbnail !== null) setProfileImage(thumbnail)
      }
    }
    loadProfileImage()
  }, [user])

  const handleSearch = async () => {
    const {
      data: { searchList, success },
    } = await coreApi.post('/search', { search: searchInput })

    if (success) setSearchList(searchList)
  }

  const handleClose = type => {
    dropdown === type && setDropdown(DROPDOWN.CLOSE)
  }

  const renderComponent = ({ component, props }) => {
    const Component = component
    return <Component {...props} />
  }

  const triggerDropdown = type => (dropdown === type ? setDropdown(DROPDOWN.CLOSE) : setDropdown(type))

  return (
    <>
      <Header>
        <Item>
          <Logo id='wambi-bird-home-logo' onClick={() => push('/newsfeed')}>
            <Bird alt='Wambi Logo' src={WambiLogo} />
            <Tagline alt='Wambi' src={WambiTagline} />
          </Logo>
        </Item>
        <Item center ref={searchRef}>
          <SearchBar
            full
            handleClear={() => {
              handleClose(DROPDOWN.SEARCH)
              setSearchInput('')
            }}
            id='main-nav-searchbar'
            onChange={e => setSearchInput(e.target.value)}
            onFocus={() => setDropdown(DROPDOWN.SEARCH)}
            placeholder='Search people or groups'
            value={searchInput}
          />
          <NavDropdown
            className='search'
            handleClose={() => handleClose(DROPDOWN.SEARCH)}
            navRefs={navRefs}
            open={dropdown === DROPDOWN.SEARCH}
            positionX='50%'
            transform='translateX(50%)'
          >
            <SearchList
              handleClear={() => {
                handleClose(DROPDOWN.SEARCH)
                setSearchInput('')
              }}
              searchFocused={dropdown === DROPDOWN.SEARCH}
              searchInput={searchInput}
              searchList={searchList}
            />
          </NavDropdown>
        </Item>
        <NavDropdown
          handleClose={() => handleClose(DROPDOWN.NOTIFICATIONS)}
          navRefs={navRefs}
          noScroll
          open={dropdown === DROPDOWN.NOTIFICATIONS}
          positionX='90px'
          title='Notifications'
        >
          <NotificationList active={dropdown === DROPDOWN.NOTIFICATIONS} setNotificationDetail={setModalComponent} withTitle />
        </NavDropdown>

        <Menu>
          <Icon addStroke>
            <HomeIcon
              color={page === 'newsfeed' && dropdown !== DROPDOWN.NOTIFICATIONS && colors.blurple}
              id='newsfeed-icon'
              onClick={() => push('/newsfeed')}
            />
          </Icon>
          <Icon>
            <PersonIcon
              color={page === 'profile' && dropdown !== DROPDOWN.NOTIFICATIONS && colors.blurple}
              id='profile-icon'
              onClick={() => push('/profile')}
            />
          </Icon>
          {user?.isLeader && (
            <Icon>
              <HubIcon
                color={page.includes('hub') && dropdown !== DROPDOWN.NOTIFICATIONS && colors.blurple}
                id='hub-icon'
                onClick={() => push('/hub')}
              />
            </Icon>
          )}
          {groupAccessLevelCheck && (
            <Icon>
              <AnalyticsIcon
                color={page.includes('analytics') && dropdown !== DROPDOWN.NOTIFICATIONS && colors.blurple}
                id='analytics-icon'
                onClick={() => push('/analytics')}
              />
            </Icon>
          )}
          {clientAccessLevelCheck && (
            <Icon>
              <ConfigIcon
                color={page.includes('config') && dropdown !== DROPDOWN.CONFIG && colors.blurple}
                id='config-icon'
                onClick={() => push('/config')}
              />
            </Icon>
          )}
          <Icon addStroke>
            <BellWrapper
              id='notifications-icon'
              onClick={() => {
                triggerDropdown(DROPDOWN.NOTIFICATIONS)
                readNotification()
              }}
              ref={notificationRef}
            >
              <BellIcon color={dropdown === DROPDOWN.NOTIFICATIONS && colors.blurple} />
              {hasNewNotifications && <NumberIndicator ratio='12px' right='13px' small top='-2px' />}
            </BellWrapper>
          </Icon>
          <DesktopClose
            expanded={dropdown === DROPDOWN.MENU}
            id='profile-icon'
            onClick={() => triggerDropdown(DROPDOWN.MENU)}
            ref={menuRef}
          >
            <Hamburger>
              <Bar expanded={dropdown === DROPDOWN.MENU} />
              <Bar expanded={dropdown === DROPDOWN.MENU} />
              <Bar expanded={dropdown === DROPDOWN.MENU} />
            </Hamburger>
          </DesktopClose>
          {user?.isLeader && (
            <ManagementItem>
              <ManagementBell id={'management-notifications-icon'} onClick={() => push('/notifications')}>
                <ManagementBellIcon color={page === 'notifications' ? colors.blurple : colors.gray1} />
                {hasNewNotifications && <NumberIndicator ratio='8px' right='0' small top='3px' />}
              </ManagementBell>
            </ManagementItem>
          )}
          <Close expanded={expanded} id='profile-icon' onClick={() => setExpanded(expanded => !expanded)} ref={mobileMenuRef}>
            <Hamburger>
              <Bar expanded={expanded} />
              <Bar expanded={expanded} />
              <Bar expanded={expanded} />
            </Hamburger>
          </Close>
        </Menu>
      </Header>
      <HamburgerDropdown handleClose={() => handleClose(DROPDOWN.MENU)} navRefs={navRefs} open={dropdown === DROPDOWN.MENU}>
        {user && <SideBar {...sideBarProps} image={{ src: profileImage }} name={user.name} />}
      </HamburgerDropdown>
      <MobileModal
        handleClose={() => setExpanded(false)}
        onClickOut={() => {
          if (!setShowCollectReviews && !setShowEditProfile && !setShowFeedbackWorkflow && !setShowVerifyPassword) setExpanded(false)
        }}
        open={expanded}
      >
        {user && <SideBar {...sideBarProps} image={{ src: profileImage }} name={user.name} />}
      </MobileModal>
      <SideBarModals {...sideBarProps} />
      <Modal open={modalComponent !== null} shrink={modalComponent?.props?.shrink}>
        {modalComponent &&
          renderComponent({
            component: modalComponent.component,
            props: { handleBack: () => setModalComponent(null), ...modalComponent.props },
          })}
      </Modal>
    </>
  )
}

export default MainNav
