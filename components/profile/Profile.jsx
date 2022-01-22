import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { devices, FirstWambi, multiplier } from '@assets'
import {
  ChallengesWidget,
  DynamicContainer,
  FeedItemDetail,
  GroupPeopleWidget,
  GroupInfoWidget,
  Image,
  Layout,
  Modal,
  PatientVoiceWidget,
  PersonInfoWidget,
  PopUp as PopUpBase,
  ProfileWidget,
  ReactionsPopUp,
  RewardProgressWidget,
  ViewDetailsWorkflow,
  WambiTrigger,
  WambiWidget,
} from '@components'
import { useProfileContext, useRefreshDataContext, useRewardContext, useUserContext } from '@contexts'
import { coreApi } from '@services'
import { NEWSFEED_VIEW } from '@utils'

const FirstWambiWrapper = styled.div`
  display: flex;
  justify-content: center;

  img {
    max-width: 300px;
  }

  @media (${devices.largeDesktop}) {
    margin-top: 30px;
    padding-top: ${multiplier * 16}px;
  }
`

const InfoWrapper = styled.div`
  display: block;

  @media (${devices.largeDesktop}) {
    display: ${p => p.myProfile && 'none'};
  }
`

const PopUp = styled(PopUpBase)`
  z-index: 5;
`

const ProfileWrapper = styled(DynamicContainer)`
  margin-bottom: 2rem;
  padding: 20px 20px 100px;
  position: relative;
  width: 100%;

  @media (${devices.largeDesktop}) {
    padding: 20px;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`

const PatientVoiceWrapper = styled.div`
  @media (${devices.largeDesktop}) {
    display: ${p => (p.myProfile ? 'none' : 'block')};
  }
`

const RewardProgressWrapper = styled.div`
  @media (${devices.largeDesktop}) {
    display: none;
  }
`

const Profile = ({ myProfile = false }) => {
  const [active, setActive] = useState(NEWSFEED_VIEW.VIEW_ALL)
  const [challenges, setChallenges] = useState(null)
  const [cpc, setCpc] = useState([])
  const [currentFeedItem, setFeedItem] = useState(null)
  const [group, setGroup] = useState(null)
  const [groupPeople, setGroupPeople] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [person, setPerson] = useState(null)
  const [reactionsData, setReactionsData] = useState(null)
  const [recipientsData, setRecipientsData] = useState(null)
  const [seeMoreComments, setSeeMoreComments] = useState(false)
  const [seeMoreChallenges, setSeeMoreChallenges] = useState(null)
  const [seeMoreCPCs, setSeeMoreCPCs] = useState(null)
  const [showReactions, setShowReactions] = useState(false)
  const [showSeeMoreChallenges, setShowSeeMoreChallenges] = useState(false)
  const [viewDetails, setViewDetails] = useState(false)
  const [viewDetailsData, setViewDetailsData] = useState(null)

  const { profileType, selectedProfileId, setShowProfile, showProfile } = useProfileContext()
  const { dataUpdate, profileUpdate } = useRefreshDataContext()
  const { rewardProgress } = useRewardContext()
  const { user } = useUserContext()

  const detailsProps = {
    mergeUpdatedFeedItem: feedItem => setFeedItem({ ...feedItem }),
    person,
    setReactionsData,
    setRecipientsData,
    setShowReactions,
    setSeeMoreComments,
    setViewDetails,
    profile: user,
  }

  const getMyProfile = async isRefresh => {
    // Only set loading on page load so it doesnt refresh the whole page on updates...JC
    if (!isRefresh) setIsLoading(true)

    const {
      data: { cpc, success, user },
    } = await coreApi.get('/profile/getMyProfile')

    if (success) {
      if (user) setPerson(user)
      if (cpc) setCpc(cpc)
    }

    setIsLoading(false)
  }

  const getProfile = async id => {
    setIsLoading(true)

    const endpoint = profileType === 'group' ? '/profile/getGroupProfile' : '/profile/getPersonProfile'

    const {
      data: { challenges, cpc, groupInfo, personList, person, success },
    } = await coreApi.post(endpoint, { groupId: id, page, personId: id })

    if (success) {
      if (groupInfo) setGroup(groupInfo)
      if (person) setPerson(person)
      if (personList) {
        setPage(page + 1)
        setGroupPeople(personList)
        setHasMore(true)
      }
      if (challenges) setChallenges(challenges)
      if (cpc) setCpc(cpc)
    }

    setIsLoading(false)
  }

  const getSingle = async ({ feedId }) => {
    const {
      data: { success, feedItem },
    } = await coreApi.post('/newsfeed/getFeedItem', { feedId })

    if (success) {
      setViewDetailsData(viewDetailsData => ({
        component: FeedItemDetail,
        props: {
          ...detailsProps,
          cta: viewDetailsData?.props.cta,
          feedItem,
        },
      }))
    }
  }

  const renderComponent = ({ component, props }) => {
    const Component = component
    return <Component {...props} />
  }

  useEffect(() => {
    if (!showProfile && myProfile) getMyProfile()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myProfile, showProfile])

  useEffect(() => {
    // Prevent query from running if user clicks on their profile Page...PS
    if (!myProfile && selectedProfileId) getProfile(selectedProfileId)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myProfile, selectedProfileId])

  useEffect(() => {
    if (currentFeedItem && person) getSingle(currentFeedItem.cpcId)

    // disabled to prevent from re-running until a cpc is selected...PS
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person])

  useEffect(() => {
    const {
      action,
      data: { feedId },
    } = dataUpdate
    const isMyProfile = person?.id === user?.id

    if (action === 'updateWambis' && isMyProfile) getMyProfile({ isRefresh: true })
    // Tracks everywhere outside newsfeed, since the only other ways to update a feed item are in Profile page & other profile modals...JC
    else if (action === 'updateFeedItem') {
      getSingle({ feedId })
      // Refresh My Wambis if an edited CPC matches those in the widget and on profile page...JC
      if (cpc.some(c => c.feedId === feedId) && profileUpdate && isMyProfile) getMyProfile({ isRefresh: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUpdate])

  return (
    <>
      <Layout
        cta={{ onClick: () => setShowProfile(false), text: 'Close' }}
        handleBack={() => setShowProfile(false)}
        head={myProfile && 'My Profile'}
        id='profile'
        inner={!myProfile}
        loading={isLoading}
        leftColumn={
          <>
            <ProfileWidget />
            {rewardProgress && user && !user.isSelfRegistered && <RewardProgressWidget />}
          </>
        }
        noFooter={!myProfile}
        rightColumn={
          <>
            <WambiTrigger />
            {user && !user.isSelfRegistered && <PatientVoiceWidget />}
          </>
        }
        title={group ? 'Group Profile' : person?.name || ''}
      >
        <ProfileWrapper>
          {group && profileType === 'group' ? (
            <InfoWrapper myProfile={myProfile}>
              <GroupInfoWidget groupPeople={groupPeople} profile={group} />
            </InfoWrapper>
          ) : (
            person && (
              <InfoWrapper myProfile={myProfile}>
                <PersonInfoWidget myProfile={person.id === user?.id} profile={person} />
              </InfoWrapper>
            )
          )}

          {rewardProgress && myProfile && user && !user.isSelfRegistered && (
            <RewardProgressWrapper>
              <RewardProgressWidget />
            </RewardProgressWrapper>
          )}

          {cpc.length > 0 && (
            <WambiWidget
              cpc={cpc}
              getSingle={getSingle}
              myProfile={myProfile}
              person={person ?? group}
              profile={user}
              setActive={setActive}
              setSeeMoreCPCs={setSeeMoreCPCs}
              setViewDetailsData={setViewDetailsData}
              setViewDetails={setViewDetails}
            />
          )}

          {!cpc.length && user?.isSelfRegistered && myProfile ? (
            <FirstWambiWrapper>
              <Image alt='Envelope with card prompting you to send your first Wambi' src={FirstWambi} />
            </FirstWambiWrapper>
          ) : null}

          {groupPeople?.length > 0 && profileType === 'group' && (
            <GroupPeopleWidget
              groupPeople={groupPeople}
              hasMore={hasMore}
              page={page}
              profile={group}
              setGroupPeople={setGroupPeople}
              setHasMore={setHasMore}
              setPage={setPage}
              setPerson={setPerson}
            />
          )}
          {user && !user.isSelfRegistered && (
            <>
              <ChallengesWidget
                challenges={challenges}
                myProfile={myProfile}
                person={person}
                profile={user}
                setSeeMoreChallenges={setSeeMoreChallenges}
                setShowSeeMoreChallenges={setShowSeeMoreChallenges}
              />
              <PatientVoiceWrapper myProfile={myProfile}>
                <PatientVoiceWidget peopleId={selectedProfileId} />
              </PatientVoiceWrapper>
            </>
          )}
        </ProfileWrapper>
      </Layout>
      <Modal open={showSeeMoreChallenges}>{showSeeMoreChallenges && seeMoreChallenges && renderComponent(seeMoreChallenges)}</Modal>
      <Modal open={viewDetails}>
        <ViewDetailsWorkflow
          active={active}
          handleBack={seeMoreCPCs ? () => setActive(NEWSFEED_VIEW.VIEW_ALL) : () => setViewDetails(false)}
          profile
          recipientsData={recipientsData}
          seeMoreComments={seeMoreComments}
          seeMoreCPCs={seeMoreCPCs}
          setActive={setActive}
          setViewDetailsData={setViewDetailsData}
          viewDetails={viewDetails}
          viewDetailsData={viewDetailsData}
        />
      </Modal>
      <PopUp handleClose={() => setShowReactions(false)} open={showReactions} isNested>
        {reactionsData && <ReactionsPopUp {...reactionsData} />}
      </PopUp>
    </>
  )
}

Profile.propTypes = {
  myProfile: PropTypes.bool,
}

export default Profile
