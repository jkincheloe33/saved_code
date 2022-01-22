import { useEffect, useState } from 'react'
import moment from 'moment'
import { useRouter } from 'next/router'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, FollowUpIcon, HotStreakIcon, PatientHeartIcon, PerfectScoreIcon, PersonCircleIcon } from '@assets'
import { Avatar, ChallengeDetails, FeedbackWorkflow, Paragraph, RewardWorkflow, Text } from '@components'
import { useCelebrationContext, usePostContext, useProfileContext } from '@contexts'

import { api, coreApi } from '@services'
import { domRender } from '@utils'
// not sure why, but NOTIFICATION_TYPE is undefined whenever importing without /types unless you put the consts on lines 15 and 27 inside the component...JK
import { CELEBRATION_TYPES, NOTIFICATION_STATUS, NOTIFICATION_TYPE, PRIORITY_NOTIFICATIONS } from '@utils/types'

const newsfeedNotificationTypes = [
  NOTIFICATION_TYPE.ANNOUNCEMENT_COMMENTED,
  NOTIFICATION_TYPE.ANNOUNCEMENT_REACTION,
  NOTIFICATION_TYPE.CPC_COMMENTED,
  NOTIFICATION_TYPE.CPC_REACTION,
  NOTIFICATION_TYPE.CPC_SHARED,
  NOTIFICATION_TYPE.PATIENT_CPC_SENT,
  NOTIFICATION_TYPE.PEER_CPC_SENT,
  NOTIFICATION_TYPE.POST_ANNOUNCEMENT,
  NOTIFICATION_TYPE.POST_PRIVATE_CPC,
]

const profileImages = [NOTIFICATION_TYPE.PROFILE_APPROVAL_NEEDED, NOTIFICATION_TYPE.PROFILE_APPROVED, NOTIFICATION_TYPE.PROFILE_DENIED]

const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 0 15px;
`

const DateText = styled(Text)`
  padding: 3px 0;
`

const Wrapper = styled.div`
  align-items: flex-start;
  background-color: ${p => p.status === NOTIFICATION_STATUS.UNREAD && colors.gray8};
  border-bottom: 0.25px solid ${colors.gray7};
  cursor: pointer;
  display: flex;
  min-height: 100px;
  padding: 20px;
  transition: background-color 500ms ease;

  :first-of-type {
    border-radius: 20px 20px 0px 0px;
  }

  :last-of-type {
    border: none;
  }
`

const NotificationItem = ({ notification, setNotificationDetail, wasViewed }) => {
  const { content, createdAt, id, image, status, type, notificationLinks } = notification

  const router = useRouter()
  const [readState, setReadState] = useState(status)

  const { setCelebration } = useCelebrationContext()
  const { setSelectedRecipient, setSelectedCpcType, setShowSendCpc, setSkipCpcSearch } = usePostContext()
  const { setShowEditProfile } = useProfileContext()

  useEffect(() => {
    if (wasViewed) setReadState(NOTIFICATION_STATUS.READ)
  }, [wasViewed])

  const checkConfettiNotifs = () => {
    if (type === NOTIFICATION_TYPE.SURVEY_PERFECT_SCORE) setCelebration({ type: CELEBRATION_TYPES.PERFECT_SCORE })
    if (type === NOTIFICATION_TYPE.SURVEY_HOT_STREAK) setCelebration({ type: CELEBRATION_TYPES.HOT_STREAK })
  }

  const clickNotification = async () => {
    setReadState(NOTIFICATION_STATUS.READ)

    // Only read actionable notifications...CY
    if (PRIORITY_NOTIFICATIONS.some(t => t === type)) await coreApi.post('/notifications/read', { id })

    checkConfettiNotifs()

    if (type === NOTIFICATION_TYPE.MANAGER_HOT_STREAK) {
      const { tableKey: personId } = notificationLinks.find(({ tableName }) => tableName === 'people')
      const {
        data: { cpcType, person, success },
      } = await api.post('/wambi/types/getHotStreakWambiType', { personId })

      if (success) {
        setSelectedRecipient(person)
        // If there is no cpcTypes, set the screen to cpc types...CY
        setSelectedCpcType(cpcType)
        setShowSendCpc(true)
        setSkipCpcSearch(true)
      }
    }

    if (type === NOTIFICATION_TYPE.CHALLENGE_ISSUED) {
      const { tableKey: challengeId } = notificationLinks.find(({ tableName }) => tableName === 'challenges')
      const {
        data: { challenge },
      } = await api.post('/challenges/getById', { challengeId })

      setNotificationDetail({
        component: ChallengeDetails,
        props: { challenge: challenge, cta: { onClick: () => setNotificationDetail(null), text: 'Close' } },
      })
    }

    if (type === NOTIFICATION_TYPE.PROFILE_APPROVAL_NEEDED) router.push('/hub')

    if (type === NOTIFICATION_TYPE.PROFILE_DENIED) setShowEditProfile(true)

    if (type === NOTIFICATION_TYPE.SURVEY_FOLLOW_UP) setNotificationDetail({ component: FeedbackWorkflow, props: { shrink: true } })

    if (type === NOTIFICATION_TYPE.RECEIVE_GIFT || type === NOTIFICATION_TYPE.RAFFLE_WINNER || type === NOTIFICATION_TYPE.REWARD_REMINDER) {
      const { tableKey: rewardClaimId } = notificationLinks.find(({ tableName }) => tableName === 'rewardClaims')
      const {
        data: { reward, success },
      } = await api.post('/reward/getRewardDetails', { rewardClaimId })

      if (success) {
        setNotificationDetail({
          component: RewardWorkflow,
          props: {
            handleBack: () => setNotificationDetail(null),
            rewardClaimId,
            sentReward: reward,
          },
        })
      }
    }

    if (newsfeedNotificationTypes.some(t => t === type)) {
      const query = {}
      const feed = notificationLinks.find(({ tableName }) => tableName === 'feedItems')
      if (feed) query.feedId = feed.tableKey
      router.push({ pathname: '/newsfeed', query })
    }
  }

  const getImage = () => {
    if (image) return image
    else if (profileImages.some(t => t === type)) return PersonCircleIcon
    else if (type === NOTIFICATION_TYPE.SURVEY_FOLLOW_UP) return FollowUpIcon
    else if (type === NOTIFICATION_TYPE.SURVEY_PERFECT_SCORE) return PerfectScoreIcon
    else if (type === NOTIFICATION_TYPE.SURVEY_HOT_STREAK) return HotStreakIcon
    return PatientHeartIcon
  }

  return (
    <Wrapper onClick={clickNotification} status={readState}>
      <Avatar cover={image != null} image={getImage()} ratio='50px' shadow={!image} />
      <ContentWrapper>
        <Paragraph color='gray1'>{domRender(content)}</Paragraph>
        <DateText fontSize='15px'>{moment(createdAt).short(true)}</DateText>
      </ContentWrapper>
    </Wrapper>
  )
}

NotificationItem.propTypes = {
  notification: PropTypes.object.isRequired,
  setNotificationDetail: PropTypes.func.isRequired,
  wasViewed: PropTypes.bool.isRequired,
}

export default NotificationItem
