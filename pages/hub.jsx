import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import styled from 'styled-components'

import { breakpoints, colors, devices, multiplier, PeopleCheckIcon, shadows, WambiLogo } from '@assets'
import { Card, DynamicContainer, HubContent, Image, Layout, ReviewProfiles, Title } from '@components'
import { useAuthContext, useResizeContext, useUserContext } from '@contexts'
import { GROUP_ACCESS_LEVELS } from '@utils'

const ColumnTitle = styled(Title)`
  border-bottom: 0.5px solid ${colors.gray7}B3;
  display: none;
  padding: ${multiplier * 4}px;

  @media (${devices.largeDesktop}) {
    display: block;
  }
`

const HubLayout = styled.div`
  align-items: flex-start;
  display: flex;
  justify-content: center;

  @media (${devices.largeDesktop}) {
    height: 100%;
  }
`

const Icon = styled(Image)`
  height: 24px;
  margin-right: ${multiplier * 2}px;
  width: auto;
`

const List = styled.div`
  flex: 1 1 auto;
  position: relative;

  &::before {
    background-color: ${colors.gray8}B3;
    // TODO: fetch height dynamically through refs...JK
    height: 89px;
    left: 0;
    overflow: auto;
    position: absolute;
    top: 0;
    transform: translateY(${p => p.active * 100}%);
    transition: transform 500ms cubic-bezier(0.52, 0.01, 0.35, 1);
    width: 100%;
    z-index: 0;
  }

  @media (${devices.largeDesktop}) {
    &::before {
      content: '';
    }
  }
`

const Menu = styled.div`
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  width: 100%;

  @media (${devices.largeDesktop}) {
    background-color: ${colors.white};
    box-shadow: ${shadows.card};
    height: 100%;
    width: 320px;
  }
`

const MenuItem = styled(Card)`
  align-items: center;
  cursor: pointer;
  display: flex;
  margin-bottom: ${multiplier * 2}px;
  padding: ${multiplier * 3}px;

  @media (${devices.largeDesktop}) {
    background-color: transparent;
    border-bottom: 0.5px solid ${colors.gray7}B3;
    border-radius: 0;
    box-shadow: none;
    margin: 0;
    padding: ${multiplier * 4}px;
    position: relative;
    z-index: 1;
  }
`

const MenuItemTitle = styled(Title)`
  @media (${devices.largeDesktop}) {
    color: ${p => (p.active ? colors.gray1 : colors.gray4)};
    transition: color 500ms cubic-bezier(0.52, 0.01, 0.35, 1);
  }
`

const NotAuthorized = styled(Title)`
  text-align: center;
`

const Wrapper = styled(DynamicContainer)`
  overflow: hidden;
  padding: ${multiplier * 2}px;
  position: relative;

  @media (${devices.largeDesktop}) {
    padding: 0;
  }
`

const Hub = () => {
  const [active, setActive] = useState(0)
  const [data, setData] = useState(null)
  const [open, setOpen] = useState(false)

  const { push } = useRouter()
  const { clientAccount } = useAuthContext()
  const { windowWidth } = useResizeContext()
  const { user } = useUserContext()

  const menuItems = []

  const navigation = {
    cta: { onClick: () => setOpen(false), text: 'Close' },
    handleBack: () => setOpen(false),
  }

  const handleDataSet = ({ details, index }) => {
    setActive(index)
    setOpen(true)
    setData(details)
  }

  // if user is a manager, they will see profile requests...JK
  if (user?.isLeader) {
    menuItems.splice(0, 0, {
      icon: { alt: 'People Check Logo', src: PeopleCheckIcon },
      onClick: index => handleDataSet({ details: { component: ReviewProfiles, props: {}, title: 'Profile Changes' }, index }),
      text: 'Profile Change Requests',
    })
  }

  // if a user is a leader and view wambis is enabled, they will see Recent Wambis...JK
  if (user?.groupAccessLevel > GROUP_ACCESS_LEVELS.TEAM_MEMBER && clientAccount?.settings?.featureToggles?.disableViewWambis !== true) {
    menuItems.splice(1, 0, {
      icon: { alt: 'Wambi Logo', src: WambiLogo },
      onClick: () => push('/wambis'),
      text: 'Recent Wambis',
    })
  }

  // when on desktop, select first item in menu array to display...JK
  useEffect(() => {
    if (!data && windowWidth > breakpoints.largeDesktop) menuItems[0]?.onClick(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowWidth])

  // allow time for animation to run when changing/closing hub content...JK
  useEffect(() => {
    if (data && !open) setTimeout(() => setData(null), 500)
  }, [data, open])

  return (
    <>
      <Layout stretch full head='Management Hub' id='management-hub'>
        <Wrapper outer>
          {user?.isLeader ? (
            <HubLayout>
              <Menu>
                <ColumnTitle fontSize='25px'>Management Hub</ColumnTitle>
                <List active={active}>
                  {menuItems.map(({ icon, onClick, text }, i) => (
                    <MenuItem key={i} onClick={() => onClick(i)}>
                      <Icon {...icon} />
                      <MenuItemTitle active={active === i} fontSize='16px'>
                        {text}
                      </MenuItemTitle>
                    </MenuItem>
                  ))}
                </List>
              </Menu>
              <HubContent data={data} open={open} />
            </HubLayout>
          ) : (
            <NotAuthorized>You are not authorized to view this page.</NotAuthorized>
          )}
        </Wrapper>
      </Layout>
      <HubContent data={data} mobile navigation={navigation} open={open} />
    </>
  )
}

export default Hub
