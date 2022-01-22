import { useEffect } from 'react'
import PropTypes from 'prop-types'
import { useRouter } from 'next/router'

import { ChangePasswordWorkflow, CollectReviews, EditProfileWorkflow, FeedbackWorkflow, Modal } from '@components'
import { useAuthContext, useProfileContext, useUserContext } from '@contexts'
import { GROUP_ACCESS_LEVELS as levels } from '@utils'

const SideBarModals = ({
  setShowCollectReviews,
  setShowFeedbackWorkflow,
  setShowVerifyPassword,
  showCollectReviews,
  showFeedbackWorkflow,
  showVerifyPassword,
}) => {
  const { isAuthenticated } = useAuthContext()
  const { setShowEditProfile, showEditProfile } = useProfileContext()
  const { passwordModalDismiss, setPasswordModalDismiss, user } = useUserContext()

  const { pathname, push, query, replace } = useRouter()

  useEffect(() => {
    if (isAuthenticated && (query?.surveyId || query?.showEditProfile || query?.showChangePassword || query?.showReviewProfiles)) {
      if (query.showEditProfile) setShowEditProfile(true)
      if (query.showChangePassword) setShowVerifyPassword(true)
      if (query.surveyId && user?.groupAccessLevel > levels.TEAM_MEMBER) setShowFeedbackWorkflow(true)
      if (query.showReviewProfiles && user?.isLeader) push('/hub')

      replace(pathname)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, query, user])

  // Prompt user to set password if user has no password and is not self registered...CY & KA
  useEffect(() => {
    if (user && user.hasPassword === false && !passwordModalDismiss && !user.isSelfRegistered) setShowVerifyPassword(true)
  }, [passwordModalDismiss, setShowVerifyPassword, user])

  return (
    <>
      <Modal isNested open={showVerifyPassword} shrink>
        <ChangePasswordWorkflow
          handleBack={() => {
            setPasswordModalDismiss(true)
            setShowVerifyPassword(false)
          }}
        />
      </Modal>
      <Modal isNested open={showEditProfile} shrink>
        <EditProfileWorkflow handleBack={() => setShowEditProfile(false)} />
      </Modal>
      <Modal isNested open={showCollectReviews} shrink>
        <CollectReviews handleBack={() => setShowCollectReviews(false)} />
      </Modal>
      <Modal isNested open={showFeedbackWorkflow} shrink>
        <FeedbackWorkflow feedbackId={Number(query?.surveyId)} handleBack={() => setShowFeedbackWorkflow(false)} />
      </Modal>
    </>
  )
}

SideBarModals.propTypes = {
  setShowCollectReviews: PropTypes.func,
  setShowFeedbackWorkflow: PropTypes.func,
  setShowVerifyPassword: PropTypes.func,
  showCollectReviews: PropTypes.bool,
  showFeedbackWorkflow: PropTypes.bool,
  showVerifyPassword: PropTypes.bool,
}

export default SideBarModals
