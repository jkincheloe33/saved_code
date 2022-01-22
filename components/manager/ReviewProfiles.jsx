import { useEffect, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { AllClearImage, colors, devices, multiplier, shadows } from '@assets'
import { AlertBanner, Checkbox, Image, Loader, ReviewProfileCard, SearchBar, Text, Title } from '@components'
import { useUserContext } from '@contexts'
import { api } from '@services'
import { GROUP_ACCESS_LEVELS, useCallbackDelay } from '@utils'

const AllClear = styled.div`
  align-items: flex-start;
  display: flex;
  justify-content: center;
  padding: ${multiplier * 2}px;
  width: 100%;
`

const CheckboxText = styled(Text)`
  padding-left: ${multiplier * 2}px;
`

const FlexContainer = styled.div`
  align-items: center;
  display: flex;
  padding: 0 ${multiplier * 2}px 0;

  @media (${devices.largeDesktop}) {
    justify-content: space-between;
    padding: 0;
  }
`

const Header = styled(Title)`
  display: none;

  @media (${devices.largeDesktop}) {
    display: block;
  }
`

const InfiniteProfileScroll = styled(InfiniteScroll)`
  align-items: stretch;
  display: flex;
  flex-wrap: wrap;

  @media (${devices.largeDesktop}) {
    margin-left: -${multiplier * 2}px;
    width: calc(100% + ${multiplier * 4}px);
  }
`

const NoResults = styled.div`
  padding: 0 ${multiplier * 2}px;

  @media (${devices.largeDesktop}) {
    padding: 0;
  }
`

const Row = styled(FlexContainer)`
  justify-content: flex-start;
  margin: ${multiplier * 3}px 0 ${multiplier}px;

  @media (${devices.largeDesktop}) {
    margin: ${multiplier}px 0 ${multiplier * 2}px;
  }
`

const Search = styled.div`
  width: 100%;

  @media (${devices.largeDesktop}) {
    width: 275px;
  }
`

const Wrapper = styled.div`
  @media (${devices.largeDesktop}) {
    background-color: ${colors.white};
    border-radius: 20px;
    box-shadow: ${shadows.card};
    padding: ${multiplier * 3}px;
  }
`

const ReviewProfiles = ({ mobile = false }) => {
  const [directReportsOnly, setDirectReportsOnly] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [list, setList] = useState(null)
  const [listPage, setListPage] = useState(0)
  const [loadMoreProfiles, setLoadMoreProfiles] = useState(true)
  const [loadMoreSearch, setLoadMoreSearch] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [searchList, setSearchList] = useState(null)
  const [searchPage, setSearchPage] = useState(0)

  const { user } = useUserContext()

  // removes profile from ${list} and ${searchList} if applicable...JK
  const filterOutProfile = profile => {
    // filter out profile that was just approved and setTimeout for animation...JK
    setTimeout(() => setList(list => list.filter(l => l.id !== profile.id)), 250)

    // if the list is empty, set load more to false...JK
    if (!list?.filter(l => l.id !== profile.id).length) setLoadMoreProfiles(false)

    // if there's still length after filtering out the approved profile, setSearchList to the filtered array and setTimeout for animation...JK
    if (searchList?.filter(sl => sl.id !== profile.id).length) {
      setTimeout(() => setSearchList(search => search.filter(sl => sl.id !== profile.id)), 250)
    } else {
      setSearchInput('')
      setSearchList(null)
      setLoadMoreSearch(false)
    }
  }

  const getMoreProfiles = async () => {
    const {
      data: { profiles, success },
    } = await api.post('manager/getPendingProfiles', { directReportsOnly, page: listPage })

    if (success) {
      if (profiles.length === 0) return setLoadMoreProfiles(false)
      setList([...list, ...profiles])
      setListPage(listPage + 1)
    } else {
      setLoadMoreProfiles(false)
    }
  }

  const getMoreSearch = async () => {
    const {
      data: { profiles, success },
    } = await api.post('manager/getPendingProfiles', { directReportsOnly, page: searchPage, search: searchInput })
    if (success) {
      if (profiles.length === 0) return setLoadMoreSearch(false)
      setSearchList([...searchList, ...profiles])
      setSearchPage(searchPage + 1)
    } else setLoadMoreSearch(false)
  }

  // reset pages and load more states when user clicks checkbox...JK
  const handleCheckbox = () => {
    setDirectReportsOnly(dr => !dr)
    setListPage(0)
    setLoadMoreProfiles(true)
    setLoadMoreSearch(true)
    setSearchPage(0)
  }

  const handleApprove = async profile => {
    // profile is wrapped in brackets because we are still allowing approve or deny all on the endpoint, so the backend expects an array...JK
    const { data } = await api.post('manager/approveProfiles', { profiles: [profile] })

    if (data.success) filterOutProfile(profile)
  }

  // clear search bar...JK
  const handleClear = () => {
    setSearchInput('')
    setSearchList(null)
    // reset paging and loading to default states if search is cleared...JK
    setSearchPage(0)
    setLoadMoreSearch(true)
    if (list?.length === 0) {
      setLoadMoreProfiles(true)
      getMoreProfiles()
    }
  }

  const handleDeny = async (changesRequested, profile) => {
    // profile is wrapped in brackets because we are still allowing approve or deny all on the endpoint, so the backend expects an array...JK
    const { data } = await api.post('manager/denyProfiles', { changesRequested, profiles: [profile] })

    if (data.success) filterOutProfile(profile)
  }

  const handleSearch = async () => {
    if (searchInput.length > 2) {
      const {
        data: { profiles, success },
      } = await api.post('manager/getPendingProfiles', { directReportsOnly, page: 0, search: searchInput })

      if (success) {
        setSearchList(profiles)
        // restart paging and load more each time input changes...JK
        setSearchPage(1)
        setLoadMoreSearch(true)
      }
    } else {
      setSearchList(null)
      // reset paging and loading to default states if search is unsuccessful...JK
      setSearchPage(0)
      setLoadMoreSearch(true)
    }
  }

  // delay search results till user finishes typing or default/specified delay has passed...JK
  useCallbackDelay(() => {
    handleSearch()
  }, [searchInput])

  // a manager isn't tied to any groups, so we should only be showing their direct reports...JK
  useEffect(() => {
    if (user?.groupAccessLevel < GROUP_ACCESS_LEVELS.GROUP_OWNER_DELEGATE) setDirectReportsOnly(true)
  }, [user])

  useEffect(() => {
    // gets initial list of profiles...JK
    const getProfiles = async () => {
      const {
        data: { profiles, success },
      } = await api.post('manager/getPendingProfiles', { directReportsOnly, page: listPage })

      if (success) {
        if (profiles.length === 0) {
          if (directReportsOnly) setList([])
          setFetching(false)
          return setLoadMoreProfiles(false)
        }
        setList(profiles)
        setListPage(1)
      } else setLoadMoreProfiles(false)

      setFetching(false)
    }

    // gets initial searchList when a user searches and then clicks the directReports checkbox...JK
    const getSearch = async () => {
      const {
        data: { profiles, success },
      } = await api.post('manager/getPendingProfiles', { directReportsOnly, page: searchPage, search: searchInput })
      if (success) {
        if (profiles.length === 0) {
          if (directReportsOnly) setSearchList([])
          return setLoadMoreSearch(false)
        }
        setSearchList(profiles)
        setSearchPage(1)
      } else setLoadMoreSearch(false)
    }

    getProfiles()
    if (searchInput.length > 2) getSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directReportsOnly])

  return (
    <Wrapper>
      <FlexContainer>
        <Header>Profile Change Requests</Header>
        <Search>
          <SearchBar
            full
            handleClear={handleClear}
            onChange={e => setSearchInput(e.target.value)}
            placeholder='Search...'
            value={searchInput}
            width='100%'
          />
        </Search>
      </FlexContainer>
      {user?.groupAccessLevel > GROUP_ACCESS_LEVELS.TEAM_MEMBER && (
        <Row>
          <Checkbox checked={directReportsOnly} id='review-profiles-direct-reports' onChange={handleCheckbox} />
          <CheckboxText noClamp>Show requests from direct reports only</CheckboxText>
        </Row>
      )}
      {fetching && <Loader />}
      {searchList?.length > 0 && searchInput.length > 2 && (
        <InfiniteProfileScroll
          dataLength={searchList.length}
          hasMore={loadMoreSearch}
          loader={<Loader />}
          next={getMoreSearch}
          scrollableTarget={mobile ? 'hub-content-container-mobile' : 'hub-content-container'}
        >
          {searchList.map(sl => (
            <ReviewProfileCard {...sl} handleApprove={() => handleApprove(sl)} handleDeny={handleDeny} key={sl.id} />
          ))}
        </InfiniteProfileScroll>
      )}
      {searchList && !searchList.length && (
        <NoResults>
          <AlertBanner errors={['Your search returned no results.']} />
        </NoResults>
      )}
      {list && searchInput.length < 3 && (
        <InfiniteProfileScroll
          dataLength={list.length}
          hasMore={loadMoreProfiles}
          loader={<Loader />}
          next={getMoreProfiles}
          scrollableTarget={mobile ? 'hub-content-container-mobile' : 'hub-content-container'}
        >
          {list.map(l => (
            <ReviewProfileCard {...l} handleApprove={() => handleApprove(l)} handleDeny={handleDeny} key={l.id} />
          ))}
        </InfiniteProfileScroll>
      )}
      {(!list || list?.length === 0) && !searchList?.length && searchInput.length < 3 && !fetching && (
        <AllClear>
          <Image alt='Person jumping in the air with no profiles to review' src={AllClearImage} />
        </AllClear>
      )}
    </Wrapper>
  )
}

ReviewProfiles.propTypes = {
  mobile: PropTypes.bool,
}

export default ReviewProfiles
