import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import InfiniteScroll from 'react-infinite-scroll-component'
import { Card, ChallengeItem, DynamicContainer, Layout, Loader, TabBar, Title } from '@components'
import { api } from '@services'

const InfiniteChallengesScroll = styled(InfiniteScroll)`
  display: flex;
  flex-direction: column;
`

const ListItemWrapper = styled(Card)`
  margin: 20px auto 10px auto;
  width: 90%;
`

const NoResultsText = styled(Title)`
  margin-top: 50px;
`

const TabBarWrapper = styled.div`
  margin-top: 10px;
`

const Wrapper = styled(DynamicContainer)`
  padding-top: 10px;
`

const TABS = ['Active', 'Complete']
const ChallengeList = ({ handleBack, person, prevTab, profile, setSeeMoreChallenges, setShowSeeMoreChallenges }) => {
  const [challenges, setChallenges] = useState([])
  const [hasMore, setHasMore] = useState(true)
  const [currentTab, setCurrentTab] = useState(prevTab ? prevTab : person && person.id === profile.id ? 0 : 1)
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const selectedUser = person != null ? person : profile
  const isMe = person && person.id === profile.id

  // Call on mount/tab change...JC
  useEffect(() => {
    let request = `/challenges/list?userProgress=${currentTab}`
    if (person) request = `${request}&userId=${selectedUser.id}`
    setIsLoading(true)
    const getChallenges = async () => {
      const {
        data: { challenges, success },
      } = await api.get(request)

      if (success) {
        setChallenges(challenges)
        setPage(1)
        setHasMore(challenges.length !== 0)
      }

      setIsLoading(false)
    }
    getChallenges()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab])

  // Call when scrolling for more challenges...JC
  const getMore = async () => {
    let request = `/challenges/list?userProgress=${currentTab}&page=${page}`
    if (person) request = `${request}&userId=${selectedUser.id}`

    const {
      data: { challenges: newChallenges, success },
    } = await api.get(request)

    if (success) {
      setPage(page + 1)
      setChallenges([...challenges, ...newChallenges])
      setHasMore(newChallenges.length !== 0)
    }
  }

  return (
    <Layout
      cta={{ onClick: () => setShowSeeMoreChallenges(false), text: 'Close' }}
      handleBack={handleBack}
      id='list-challenges'
      inner
      noFooter
      title={isMe ? 'My Challenges' : 'Completed Challenges'}
    >
      <Wrapper id='scrollable-challenges-feed'>
        {isMe && (
          <TabBarWrapper>
            <TabBar options={TABS} setSelected={setCurrentTab} selected={currentTab} />
          </TabBarWrapper>
        )}

        {isLoading ? (
          <Loader />
        ) : (
          <InfiniteChallengesScroll
            dataLength={challenges.length}
            hasMore={hasMore}
            loader={<Loader />}
            next={getMore}
            scrollableTarget='scrollable-challenges-feed'
          >
            {challenges.length ? (
              challenges.map(challenge => (
                <ListItemWrapper key={challenge.challengeId}>
                  <ChallengeItem
                    challenge={challenge}
                    column
                    handleBack={() =>
                      setSeeMoreChallenges({
                        component: ChallengeList,
                        props: { handleBack, person, prevTab: currentTab, profile, setSeeMoreChallenges, setShowSeeMoreChallenges },
                      })
                    }
                    id={`challenge-item-${challenge.challengeId}`}
                    setSeeMoreChallenges={setSeeMoreChallenges}
                    setShowSeeMoreChallenges={setShowSeeMoreChallenges}
                  />
                </ListItemWrapper>
              ))
            ) : (
              <NoResultsText>{`No ${currentTab === 0 ? 'active' : 'complete'} challenges`}</NoResultsText>
            )}
          </InfiniteChallengesScroll>
        )}
      </Wrapper>
    </Layout>
  )
}

ChallengeList.propTypes = {
  handleBack: PropTypes.func,
  person: PropTypes.object,
  prevTab: PropTypes.number,
  profile: PropTypes.object,
  setSeeMoreChallenges: PropTypes.func.isRequired,
  setShowSeeMoreChallenges: PropTypes.func.isRequired,
}

export default ChallengeList
