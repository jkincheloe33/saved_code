import { useEffect, useState } from 'react'
import moment from 'moment-shortformat'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices } from '@assets'
import { ChallengeDetails, Image, ProgressCircle, Text } from '@components'
import { uId } from '@utils'

const ChallengeContent = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
`

const ChallengeImage = styled(Image)`
  left: calc(50% + 0.5px);
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
`

const ChallengeWrapper = styled.div`
  background-color: ${colors.white}99;
  border-top: 1px solid ${colors.gray8};
  cursor: pointer;
  display: flex;
  padding: 20px;

  &:last-of-type {
    border-bottom: 1px solid ${colors.gray8};
  }

  @media (${devices.largeDesktop}) {
    /* backdrop-filter: blur(100px); */
    border-top: none;
    padding: 1rem;
    width: ${p => (p.column ? '100%' : '50%')};

    &:last-of-type {
      border-bottom: none;
    }
  }
`

const ProgressWrapper = styled.div`
  border-radius: 50%;
  height: 70px;
  margin-right: 20px;
  position: relative;
  width: 70px;
`

const ChallengeItem = ({ challenge, column = false, handleBack, id, setSeeMoreChallenges, setShowSeeMoreChallenges }) => {
  const [animateProgress, setAnimateProgress] = useState(false)

  const { completedAt, description, endDate, goals, goalsNeeded, image, title } = challenge
  const progress = goals.filter(g => g.completedAt != null).length
  const totalProgress = goalsNeeded ?? goals.length

  useEffect(() => {
    if (challenge) setAnimateProgress(true)
    else setAnimateProgress(false)
  }, [challenge])

  return (
    <ChallengeWrapper
      column={column}
      id={uId('challenge-item')}
      onClick={() => {
        setSeeMoreChallenges({
          component: ChallengeDetails,
          props: { challenge, cta: { onClick: () => setShowSeeMoreChallenges(false), text: 'Close' }, handleBack },
        })
        setShowSeeMoreChallenges(true)
      }}
    >
      <ProgressWrapper>
        <ProgressCircle
          animate={animateProgress}
          colorOptions={progress / totalProgress < 1 ? { end: 'blue', start: 'digitalBlue' } : { end: 'skyBlue', start: 'mint' }}
          currentProgress={progress}
          id={`progress-challenge-list-${id}`}
          ratio={70}
          strokeWidth={6}
          totalProgress={totalProgress}
        />
        <ChallengeImage alt={uId('challenge-item-image')} src={image} width='18px' />
      </ProgressWrapper>
      <ChallengeContent>
        <Text color='gray1' fontWeight='500'>
          {title}
        </Text>
        <Text fontSize='14px'>{description}</Text>
        <Text fontSize='14px' fontWeight={600} id='view-all-challenges-text'>
          {completedAt
            ? `${moment(challenge.completedAt).fromNow(true)} ago`
            : !completedAt && endDate
            ? `${moment(challenge.endDate).fromNow(true)} left`
            : ''}
        </Text>
      </ChallengeContent>
    </ChallengeWrapper>
  )
}

ChallengeItem.propTypes = {
  challenge: PropTypes.object.isRequired,
  column: PropTypes.bool,
  handleBack: PropTypes.func,
  id: PropTypes.string,
  setSeeMoreChallenges: PropTypes.func,
  setShowSeeMoreChallenges: PropTypes.func,
}

export default ChallengeItem
