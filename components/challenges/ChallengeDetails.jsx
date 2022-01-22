import PropTypes from 'prop-types'
import moment from 'moment-shortformat'
import styled from 'styled-components'
import { useRouter } from 'next/router'

import { ArrowIcon, CheckmarkIcon3, colors } from '@assets'
import { DynamicContainer, Image, Layout, ProgressCircle, Text, Title } from '@components'
import { gradientGenerator, TRIGGERS } from '@utils'

const ChallengeLink = styled(Text)`
  cursor: pointer;
`

const ChallengeTitle = styled(Title)`
  margin: 25px 25px 0;
`

const Checkmark = styled(CheckmarkIcon3)`
  left: calc(50% + 0.5px);
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
`

const Description = styled(Text)`
  margin: 15px 40px 25px;
  text-align: center;
`

const GoalText = styled(Text)`
  flex: 1;
  margin-left: 15px;
`

const GoalWrapper = styled.div`
  align-items: center;
  border-top: 1px solid ${colors.gray8};
  display: flex;
  padding: 25px;
  width: 100%;
`

const IconWrapper = styled.div`
  border-radius: 50%;
  height: 30px;
  margin: auto;
  position: relative;
  width: 30px;

  ${p => (p.gradient ? `${gradientGenerator(p.gradient)}` : `border: 1px solid ${colors.gray3};`)}
`

const ProgressInner = styled.div`
  left: calc(50% + 0.5px);
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);

  ${Text} {
    margin-top: 5px;
    text-align: center;
  }
`

const ProgressWrapper = styled.div`
  border-radius: 50%;
  height: 185px;
  margin-right: 20px;
  position: relative;
  width: 185px;
`

const TimeText = styled(Text)`
  margin: 10px 0;
`

const Wrapper = styled(DynamicContainer)`
  align-items: center;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 40px 0;
`

const ChallengeDetails = ({ challenge, cta, handleBack }) => {
  const router = useRouter()

  const { challengeId, completedAt, description, endDate, goals, goalsNeeded, image, title } = challenge
  const progress = goals.filter(g => g.completedAt != null).length
  const totalProgress = goalsNeeded ?? goals.length

  // TODO: Right now, triggers will only work for challenges with single goal records
  // Multi-goal challenge trigger buttons will be setup in future version...JC
  const trigger = challenge?.goals.length && challenge.goals[0].trigger

  const goToNewsfeed = () => {
    if (router.pathname.includes('newsfeed')) router.reload()
    else router.push('/newsfeed')
  }

  const openEditProfile = () => {
    cta?.onClick()
    router.push('/newsfeed?showEditProfile=true')
  }

  const openSendWambi = () => {
    // Find goals with send CPC...CY
    const cpcSendGoal = goals.find(g => g.trigger === TRIGGERS.CPC_SEND)
    const { triggerCondition } = cpcSendGoal

    // Check if type or theme id exist and open cpc workflow with/without cpc type or theme...CY
    let url = '/newsfeed?sendCpc=true'
    if (triggerCondition?.cpcTypeId) url += `&cpcTypeId=${triggerCondition.cpcTypeId}`
    else if (triggerCondition?.cpcThemeId) url += `&cpcThemeId=${triggerCondition.cpcThemeId}`

    // Close the challenge details modal...JC
    cta?.onClick()
    router.push(url)
  }

  const btnLink = {
    [TRIGGERS.CPC_SEND]: {
      onClick: openSendWambi,
      text: 'Send one now',
    },
    [TRIGGERS.CPC_COMMENT]: {
      onClick: goToNewsfeed,
      text: 'Go to newsfeed',
    },
    [TRIGGERS.CPC_REACT]: {
      onClick: goToNewsfeed,
      text: 'Go to newsfeed',
    },
    [TRIGGERS.CPC_SHARE]: {
      onClick: goToNewsfeed,
      text: 'Go to newsfeed',
    },
    [TRIGGERS.PROFILE_ADD_IMAGE]: {
      onClick: openEditProfile,
      text: 'Go to edit profile',
    },
    [TRIGGERS.PROFILE_ADD_MOBILE]: {
      onClick: openEditProfile,
      text: 'Go to edit profile',
    },
    [TRIGGERS.PROFILE_ADD_BIRTHDAY]: {
      onClick: openEditProfile,
      text: 'Go to edit profile',
    },
    [TRIGGERS.PROFILE_ADD_DISPLAY_NAME]: {
      onClick: openEditProfile,
      text: 'Go to edit profile',
    },
  }

  return (
    <Layout cta={cta} handleBack={handleBack} id='challenge-details-screen' inner noFooter title='My Challenges'>
      <Wrapper>
        <ProgressWrapper>
          <ProgressCircle
            animate={true}
            colorOptions={progress / totalProgress < 1 ? { end: 'blue', start: 'digitalBlue' } : { end: 'skyBlue', start: 'mint' }}
            currentProgress={progress}
            id={`progress-details-${challengeId}`}
            ratio={185}
            strokeWidth={8}
            totalProgress={totalProgress}
          />
          <ProgressInner>
            <Image alt='challenge-item-image' src={image} width='50px' />
            <Text>
              {progress} / {totalProgress}
            </Text>
          </ProgressInner>
        </ProgressWrapper>
        <ChallengeTitle fontSize='20px' fontWeight={600}>
          {title}
        </ChallengeTitle>
        <TimeText id='challenge-details-time-text'>
          {completedAt
            ? `${moment(completedAt).fromNow(true)} ago`
            : !completedAt && endDate
            ? `${moment(endDate).fromNow(true)} left`
            : ''}
        </TimeText>
        <Description color='gray1' noClamp>
          {description}
        </Description>
        {goals.length > 0 &&
          goals.map((g, i) => (
            <GoalWrapper key={i}>
              <IconWrapper
                gradient={
                  g.completedAt
                    ? {
                        colors: [
                          {
                            color: 'mint',
                            location: '30%',
                          },
                          {
                            color: 'skyBlue',
                            location: '100%',
                          },
                        ],
                        position: 'to bottom',
                      }
                    : null
                }
              >
                <Checkmark color='white' width={16} />
              </IconWrapper>
              <GoalText color='gray1' fontSize='14px' noClamp>
                {g.required === 1 && (
                  <Text color='berry' fontSize='14px' noClamp>
                    *Required{' '}
                  </Text>
                )}
                {g.title}
                {g.goal > 1 && (
                  <Text fontSize='14px' noClamp>
                    {' '}
                    ({g.progress}/{g.goal})
                  </Text>
                )}
                {!completedAt && btnLink[trigger] && (
                  <ChallengeLink color='blurple' fontSize='14px' fontWeight={600} onClick={btnLink[trigger].onClick}>
                    {' '}
                    {btnLink[trigger].text} <ArrowIcon color='blurple' flip viewBox='-2 -4 13 16' />
                  </ChallengeLink>
                )}
              </GoalText>
            </GoalWrapper>
          ))}
      </Wrapper>
    </Layout>
  )
}

ChallengeDetails.propTypes = {
  challenge: PropTypes.object.isRequired,
  cta: PropTypes.object,
  handleBack: PropTypes.func.isRequired,
}

export default ChallengeDetails
