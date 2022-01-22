import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { devices, multiplier } from '@assets'
import { ChallengeItem, ChallengeList, FeatureWidget, Loader, Timeframe, Title } from '@components'
import { api } from '@services'

const ChallengesCard = styled.div`
  display: flex;
  flex-direction: column;
  height: ${p => (p.myProfile ? '380px' : '335px')};
  margin-left: -${multiplier * 2}px;
  width: calc(100% + ${multiplier * 4}px);

  @media (${devices.largeDesktop}) {
    height: ${p => (p.myProfile ? '265px' : '224px')};
  }
`

const ChallengesHeader = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 20px 20px;
`

const ChallengesWrapper = styled.div`
  display: flex;
  flex-direction: column;

  ${Title} {
    margin: 10px auto;
  }

  @media (${devices.largeDesktop}) {
    flex-direction: row;
    flex-wrap: wrap;
  }
`

const TimeWrapper = styled.div`
  align-self: center;
  width: 225px;
`

const challengeTabs = ['Active', 'Complete']

const ChallengesWidget = ({ challenges, myProfile, setSeeMoreChallenges, setShowSeeMoreChallenges, ...props }) => {
  const [activeTab, setActiveTab] = useState(0)
  const [challengesToShow, setChallengesToShow] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [myChallenges, setMyChallenges] = useState([])

  useEffect(() => {
    setChallengesToShow(challenges?.length ? challenges : myChallenges)
  }, [challenges, myChallenges])

  useEffect(() => {
    const getMyChallenges = async () => {
      setIsLoading(true)
      const {
        data: { challengeList, success },
      } = await api.get(`/profile/getMyChallenges?userProgress=${activeTab}`)

      if (success) setMyChallenges(challengeList)
      setIsLoading(false)
    }

    if (!challenges?.length && myProfile) getMyChallenges()

    return () => setMyChallenges([])
  }, [activeTab, challenges, myProfile])

  if (!myProfile && !challenges?.length && !myChallenges?.length) return null
  return (
    <FeatureWidget
      title={`${myProfile ? 'My ' : ''} Challenges`}
      viewAll={{
        id: 'view-all-challenges-btn',
        onClick: () => {
          setSeeMoreChallenges({
            component: ChallengeList,
            props: {
              handleBack: () => setShowSeeMoreChallenges(false),
              setSeeMoreChallenges,
              setShowSeeMoreChallenges,
              ...props,
            },
          })
          setShowSeeMoreChallenges(true)
        },
      }}
    >
      <ChallengesCard myProfile={myProfile}>
        {myProfile && (
          <ChallengesHeader>
            <TimeWrapper>
              <Timeframe active={activeTab} bgColor='gray8' ranges={challengeTabs} setActive={setActiveTab} shadow={false} />
            </TimeWrapper>
          </ChallengesHeader>
        )}
        {isLoading ? (
          <Loader />
        ) : (
          <ChallengesWrapper>
            {challengesToShow?.length ? (
              challengesToShow.map(challenge => (
                <ChallengeItem
                  challenge={challenge}
                  key={challenge.challengeId}
                  handleBack={() => {
                    setSeeMoreChallenges()
                    setShowSeeMoreChallenges(false)
                  }}
                  setSeeMoreChallenges={setSeeMoreChallenges}
                  setShowSeeMoreChallenges={setShowSeeMoreChallenges}
                />
              ))
            ) : (
              <Title>No {activeTab === 0 ? 'active' : 'complete'} challenges</Title>
            )}
          </ChallengesWrapper>
        )}
      </ChallengesCard>
    </FeatureWidget>
  )
}

ChallengesWidget.propTypes = {
  challenges: PropTypes.array,
  myProfile: PropTypes.bool,
  setSeeMoreChallenges: PropTypes.func.isRequired,
  setShowSeeMoreChallenges: PropTypes.func.isRequired,
}

export default ChallengesWidget
