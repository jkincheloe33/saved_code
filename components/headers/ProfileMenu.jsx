import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices, EditIcon, GradCapIcon, LockIcon, MessageIcon2, SignOutIcon, SmileIcon, WarningIcon } from '@assets'
import { Anchor, Text } from '@components'
import { useAuthContext, useLessonsContext, useProfileContext, useUserContext } from '@contexts'
import { coreApi } from '@services'

const Link = styled(Anchor)`
  align-items: center;
  border-top: 1px solid ${colors.gray3}20; // hex with alpha...JK
  display: ${p => (p.desktopOnly ? 'none' : 'flex')};
  padding: 23px 50px;
  transition: background-color 250ms ease;

  &:last-of-type {
    border-bottom: 1px solid ${colors.gray3}20; // hex with alpha...JK
  }

  ${Text} {
    margin-left: 20px;
  }

  @media (${devices.largeDesktop}) {
    display: flex;

    &:hover {
      background-color: ${colors.gray8}99;
    }
  }
`

const ProfileMenu = ({ setLockSideBar, setShowCollectReviews, setShowFeedbackWorkflow, setShowVerifyPassword }) => {
  const { clientAccount, review_tkn } = useAuthContext()
  const { setShowLessons } = useLessonsContext()
  const { setShowEditProfile } = useProfileContext()
  const { logout, user } = useUserContext()

  const helpUrl = clientAccount?.settings?.helpSupportUrl

  const menuItems = [
    {
      icon: EditIcon,
      id: 'edit-my-profile',
      onClick: setShowEditProfile,
      text: 'Edit my profile',
    },

    {
      icon: WarningIcon,
      id: 'ask-for-support',
      link: helpUrl,
      target: '_blank',
      text: 'Ask for support',
    },
    {
      icon: GradCapIcon,
      id: 'show-lessons',
      onClick: () => setShowLessons(true),
      text: 'Lessons',
    },
    {
      icon: SignOutIcon,
      id: 'sign-out',
      onClick: async () => {
        const tokenId = review_tkn?.split('.')[2]

        await logout()
        if (tokenId) coreApi.post('/portal/signOut')
      },
      text: 'Sign out',
    },
  ]

  if (user?.isLeader) {
    menuItems.splice(
      1,
      0,
      {
        icon: SmileIcon,
        id: 'collect-patient-wambis',
        onClick: setShowCollectReviews,
        text: 'Collect Wambis',
      },
      {
        icon: MessageIcon2,
        id: 'view-patient-feedback',
        onClick: setShowFeedbackWorkflow,
        text: 'View feedback',
      }
    )
  }

  if (user && !user.isSSO && !user.isSelfRegistered) {
    menuItems.splice(1, 0, {
      icon: LockIcon,
      id: 'change-my-password',
      onClick: setShowVerifyPassword,
      text: user?.hasPassword === false ? 'Set password' : 'Change my password',
    })
  }

  return (
    <>
      {menuItems.map((item, i) => (
        <Link
          alt={item.id}
          color='gray1'
          desktopOnly={item.desktopOnly}
          id={item.id}
          image={item.icon}
          flip
          key={i}
          link={item.link}
          onClick={() => {
            if (item.onClick) {
              if (setLockSideBar) setLockSideBar(true)
              item.onClick(true)
            }
          }}
          target={item.target}
          text={item.text}
        />
      ))}
    </>
  )
}

ProfileMenu.propTypes = {
  setLockSideBar: PropTypes.func,
  setShowCollectReviews: PropTypes.func,
  setShowFeedbackWorkflow: PropTypes.func,
  setShowProfileApproval: PropTypes.func,
  setShowVerifyPassword: PropTypes.func,
}

export default ProfileMenu
