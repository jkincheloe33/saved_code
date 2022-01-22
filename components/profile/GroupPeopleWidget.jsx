import InfiniteScroll from 'react-infinite-scroll-component'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices, shadows } from '@assets'
import { Card, Loader, PeopleTile, Title } from '@components'
import { useLangContext, useProfileContext } from '@contexts'
import { coreApi } from '@services'
import { LANGUAGE_TYPE } from '@utils'

const Header = styled.div`
  align-items: center;
  background-color: ${colors.white};
  border-bottom: 1px solid ${colors.gray7}B3;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  box-shadow: ${shadows.card};
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding: 1rem;

  @media (${devices.largeDesktop}) {
    background-color: transparent;
    border-bottom: 0;
    box-shadow: none;
    margin-top: 30px;
    margin-bottom: 20px;
    padding: 0 1rem;
  }
`

const HeaderTitle = styled(Title)`
  @media (${devices.largeDesktop}) {
    font-size: 24px;
  }
`

const InfinitePeopleScroll = styled(InfiniteScroll)`
  display: flex;
  flex-direction: column;
`

const Wrapper = styled(Card)`
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  box-shadow: ${shadows.desktopCard};
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  height: auto;
  margin: 0 0 40px;
  max-height: 400px;
  overflow: auto;
  padding: 20px;

  @media (${devices.largeDesktop}) {
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    box-shadow: ${shadows.card};
    margin-bottom: 45px;
    padding: 20px;
  }
`

const GroupPeopleWidget = ({ groupPeople, hasMore, page, profile, setGroupPeople, setHasMore, setPage, setPerson }) => {
  const { getAccountLanguage } = useLangContext()
  const { setProfileType, setSelectedProfileId } = useProfileContext()

  const getMore = async () => {
    const {
      data: { success, personList: latestPeople },
    } = await coreApi.post('/profile/getGroupPeopleList', { groupId: profile.id, page })

    if (success) {
      if (latestPeople.length > 0) {
        setPage(page + 1)
        return setGroupPeople([...groupPeople, ...latestPeople])
      }
      setHasMore(false)
    }
  }

  return (
    <>
      <Header>
        <HeaderTitle color='gray1' fontSize={'18px'} fontWeight={600}>
          Group Members
        </HeaderTitle>
      </Header>
      <Wrapper id={'scrollable-div'}>
        {groupPeople?.length > 0 && (
          <InfinitePeopleScroll
            dataLength={groupPeople.length}
            hasMore={hasMore}
            loader={<Loader />}
            next={getMore}
            scrollableTarget='scrollable-div'
          >
            {groupPeople.map((person, i) => (
              <PeopleTile
                key={i}
                images={[person.thumbnailImage]}
                onClick={() => {
                  setPerson(person)
                  setProfileType(null)
                  setSelectedProfileId(person.id)
                }}
                ratio='50px'
                subtitle={`${person.isSelfRegistered ? `(${getAccountLanguage(LANGUAGE_TYPE.SELF_REGISTERED_USER)}) ` : ''}${
                  person.jobTitle ?? ''
                }`}
                title={person.name}
              />
            ))}
          </InfinitePeopleScroll>
        )}
      </Wrapper>
    </>
  )
}

GroupPeopleWidget.propTypes = {
  groupPeople: PropTypes.array,
  hasMore: PropTypes.bool,
  page: PropTypes.number,
  profile: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  setHasMore: PropTypes.func,
  setGroupPeople: PropTypes.func,
  setPage: PropTypes.func,
  setPerson: PropTypes.func,
}

export default GroupPeopleWidget
