import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import InfiniteScroll from 'react-infinite-scroll-component'

import { colors, devices, shadows } from '@assets'
import { Anchor, Container, EmployeeModal, EmployeeTile, Intro, Loader, PortalLayout, SearchBar, Select, Text } from '@components'
import { useLangContext, useReviewerContext } from '@contexts'
import { api } from '@services'

const Filter = styled(Select)`
  flex: 1;
  margin-bottom: 15px;
  max-width: 100%;
  min-width: 120px;
  padding-right: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (${devices.mobile}) {
    margin: 0 15px 15px 0;
    max-width: 50%;
    min-width: 148px;
  }
`

const FilterWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  margin-top: 15px;
  width: 100%;

  @media (${devices.mobile}) {
    flex-direction: row;
    margin: 15px 0 0 15px;
    width: calc(100% + 15px);
  }
`

const InfinitePeopleScrollWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  width: 100%;

  @media (${devices.tablet}) {
    justify-content: center;
  }

  .infinite-scroll-component__outerdiv {
    width: 100%;

    @media (${devices.tablet}) {
      width: 750px;
    }
  }
`

const InfinitePeopleScroll = styled(InfiniteScroll)`
  display: flex;
  flex-wrap: wrap;
  -webkit-overflow-scrolling: auto !important;

  @media (${devices.tablet}) {
    width: 750px;
  }
`

const NoResults = styled(Text)`
  margin: 1rem auto 0;
  text-align: center;
`

const Search = styled(SearchBar)`
  border-radius: 12px;
  box-shadow: ${shadows.input};
  margin-top: 1rem;
  padding: 1rem;
`

const StyledBadge = styled.button`
  align-items: center;
  background-color: ${p => colors[p.backgroundColor]}99;
  border: 1px solid ${p => colors[p.color]};
  border-radius: 11.5px;
  box-sizing: border-box;
  color: ${p => colors[p.color]};
  cursor: auto;
  display: flex;
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
  margin: 0 15px 15px 0;
  padding: 15px 1rem;
`

const StyledIcon = styled.div`
  cursor: pointer;
  height: 11px;
  margin-right: 8px;
  position: relative;
  width: 13px;

  &::after,
  &::before {
    background-color: ${p => colors[p.backgroundColor]};
    border-radius: 12px;
    content: '';
    height: 2px;
    left: 0;
    position: absolute;
    top: 0;
    transform: rotate(45deg);
    transform-origin: top left;
    width: 100%;
  }

  &::after {
    bottom: 0;
    top: auto;
    transform: rotate(-45deg);
    transform-origin: bottom left;
  }
`

const EmployeeSearch = ({ cpcLinkEnabled, portalScreens, query, reviewData, setActive, setReviewData }) => {
  const { getText } = useLangContext()
  const { isReturningVolunteer, setIsReturningVolunteer, setOpenVolunteerModal } = useReviewerContext()
  const router = useRouter()

  const [groupFilter, setGroupFilter] = useState(null)
  const [groups, setGroups] = useState([])
  const [hasMore, setHasMore] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [people, setPeople] = useState(null)
  const [searchTerm, setSearchTerm] = useState((query && query.name) || '')
  const [traitFilter, setTraitFilter] = useState(null)
  const [traits, setTraits] = useState([])

  const { location } = reviewData

  // Show returning volunteer modal for chatbot & sign-in users on same page here
  // Set to false so we only show the first time they hit this page per session...JC
  useEffect(() => {
    if (isReturningVolunteer) {
      setTimeout(() => {
        setOpenVolunteerModal(true)
        setIsReturningVolunteer(false)
      }, 1000)
    }
    //eslint-disable-next-line
  }, [isReturningVolunteer])

  // Remove query name after it loads in search bar...JC
  useEffect(() => {
    if (query?.name) {
      delete query.name
      router.replace({ query })
    }
    //eslint-disable-next-line
  }, [query])

  useEffect(() => {
    const getPeople = async () => {
      setLoading(true)
      setPage(0)
      setHasMore(true)

      const {
        data: { results, success },
      } = await api.post('/portal/employee/list', {
        groupId: groupFilter ? groupFilter.value : location.id,
        searchTerm,
        traitId: traitFilter ? traitFilter.value : null,
      })

      if (success) {
        if (results.length === 0) setHasMore(false)
        setPeople(results)
        setPage(p => p + 1)
      }
      setLoading(false)
    }

    if (location) {
      getPeople()
    }
  }, [groupFilter, location, searchTerm, traitFilter])

  const getMore = async () => {
    const {
      data: { results, success },
    } = await api.post('/portal/employee/list', {
      groupId: groupFilter?.value || location.id,
      page,
      searchTerm,
      traitId: traitFilter?.value,
    })

    if (success) {
      if (results.length === 0) return setHasMore(false)

      setPeople(people => [...people, ...results])
      setPage(p => p + 1)
    }
  }

  useEffect(() => {
    const getGroups = async () => {
      const {
        data: { groups, success },
      } = await api.get(`/portal/employee/getGroupsFilter?groupId=${location.id}`)

      if (success) setGroups(groups)
    }

    if (location) getGroups()
  }, [location])

  useEffect(() => {
    // Gets all traits for either the location or the group filter...KA
    const getTraits = async () => {
      const {
        data: { success, traits },
      } = await api.get(`/portal/employee/getTraitsFilter?groupId=${groupFilter?.value || location.id}`)

      if (success) {
        setTraits(traits)

        // If a trait was selected but doesn't exist in selected group's traits, unselect it...KA
        if (traitFilter && !traits.some(t => t.id === traitFilter.value)) setTraitFilter(null)
      }
    }

    if (location) getTraits()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupFilter, location])

  const handleBeginReview = async groupFilterId => {
    await setReviewData(data => ({ ...data, groupId: groupFilterId }))
  }

  const handleEmployeeSelect = async person => {
    setReviewData(data => ({ ...data, person }))
    setIsModalOpen(true)
  }

  return (
    <PortalLayout handleStartOver={() => setActive(portalScreens.LOCATION)}>
      <Container>
        <Intro squiggly='right' text={getText('Who would you')} text2={getText('like to recognize?')} />
        <Search
          bgColor='white'
          full
          id='portal-employee-searchbar'
          label={getText('Search for a team member')}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder={getText('Search by name')}
          value={searchTerm}
        />
        <FilterWrapper>
          {location.groupFilterName && groups?.length > 0 && (
            <Filter
              id='employee-group-filter'
              onChange={e => setGroupFilter({ name: e.target.selectedOptions[0].text, value: e.target.value })}
              options={groups.map(type => ({ name: type.name, value: type.id }))}
              title={location.groupFilterName}
              value={groupFilter ? groupFilter.value : ''}
            />
          )}
          {location.traitFilterName && traits?.length > 0 && (
            <Filter
              id='employee-trait-filter'
              onChange={e => setTraitFilter({ name: e.target.selectedOptions[0].text, value: e.target.value })}
              options={traits.map(type => ({ name: type.name, value: type.id }))}
              title={location.traitFilterName}
              value={traitFilter ? traitFilter.value : ''}
            />
          )}
          {groupFilter && (
            <StyledBadge backgroundColor='lightBlue' color='digitalBlue'>
              <StyledIcon backgroundColor='digitalBlue' onClick={() => setGroupFilter(null)} />
              {groupFilter.name}
            </StyledBadge>
          )}
          {traitFilter && (
            <StyledBadge backgroundColor='transparentPurple' color='brightPurple'>
              <StyledIcon backgroundColor='brightPurple' onClick={() => setTraitFilter(null)} />
              {traitFilter.name}
            </StyledBadge>
          )}
        </FilterWrapper>
        {isLoading ? (
          <Loader />
        ) : (
          <InfinitePeopleScrollWrapper>
            {people?.length ? (
              <InfinitePeopleScroll
                dataLength={people?.length || 0}
                hasMore={hasMore}
                loader={<Loader />}
                next={getMore}
                scrollableTarget='main-content-scroll'
              >
                {people.map((person, i) => (
                  <EmployeeTile {...person} handleClick={() => handleEmployeeSelect(person)} index={i} key={i} />
                ))}
              </InfinitePeopleScroll>
            ) : (
              <NoResults color='darkBlue' fontSize='18px' noClamp>
                {/* eslint-disable-next-line quotes */}
                {cpcLinkEnabled ? getText("Can't find who cared for you?") : getText('No results!')}
                <br />
                {cpcLinkEnabled ? getText('Send them a Wambi') : getText('Please try another search')}
                {cpcLinkEnabled && (
                  <Anchor color='brightPurple' link={`${process.env.NEXT_PUBLIC_CAREPOSTCARD_ENV_URL}/create/`} text={getText('here!')} />
                )}
              </NoResults>
            )}
          </InfinitePeopleScrollWrapper>
        )}
      </Container>
      <EmployeeModal
        {...reviewData.person}
        groupFilter={groupFilter && groupFilter.value}
        onClick={handleBeginReview}
        onClose={() => setIsModalOpen(false)}
        reviewData={reviewData}
        setReviewData={setReviewData}
        toggle={isModalOpen}
      />
    </PortalLayout>
  )
}

EmployeeSearch.propTypes = {
  cpcLinkEnabled: PropTypes.bool,
  person: PropTypes.object,
  portalScreens: PropTypes.object,
  query: PropTypes.object,
  reviewData: PropTypes.object,
  setActive: PropTypes.func,
  setReviewData: PropTypes.func,
}

export default EmployeeSearch
