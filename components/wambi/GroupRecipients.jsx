import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import styled from 'styled-components'

import { colors } from '@assets'
import { Checkbox, CtaFooter, DynamicContainer, Layout, PeopleTile, PillButton, SearchBar as SearchBarBase, Text, Title } from '@components'
import { useLangContext } from '@contexts'
import { coreApi } from '@services'
import { CpcWorkflowType, LANGUAGE_TYPE, numberFormatter, uId } from '@utils'

const GroupInfo = styled.div`
  align-items: center;
  border-bottom: 1px solid ${colors.gray7}B3;
  display: flex;
  justify-content: space-between;
  padding: 20px 20px 8px;
`

const GroupTile = styled(PeopleTile)`
  flex: 1;
  padding-right: 5px;
`

const NoResults = styled(Title)`
  padding-top: 20px;
`

const PersonTile = styled(PeopleTile)`
  cursor: pointer;
`

const Row = styled.div`
  align-items: center;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
`

const SearchBar = styled(SearchBarBase)`
  margin: 25px auto;
`

const Totals = styled.div`
  display: flex;
  padding: 0 20px 12px;

  ${Text} {
    padding-right: 5px;
  }
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-bottom: 125px;
`

const GroupRecipients = ({
  cpcData,
  cpcScreens,
  cta,
  deleteGroup,
  groupSelected,
  setActive,
  setGroupSelected,
  toggleFromExclusionList,
}) => {
  const { getAccountLanguage } = useLangContext()

  const [initialList, setInitialList] = useState([])
  const [loadMore, setLoadMore] = useState(true)
  const [page, setPage] = useState(0)
  const [recipients, setRecipients] = useState([])
  const [searchInput, setSearchInput] = useState('')

  const listRef = useRef(null)
  const { groupName: subtitle, id: groupId, isLocation, isRealm, name: title, peopleCount, thumbnailImage: groupImage } = groupSelected
  const getContent = index => {
    const { groupName, id, isSelfRegistered, jobTitle, name, thumbnailImage } = recipients[index]

    return (
      <Row onClick={() => toggleFromExclusionList(id)}>
        <PersonTile
          extraInfo={groupName}
          images={[thumbnailImage]}
          personId={id}
          subtitle={`${isSelfRegistered ? `(${getAccountLanguage(LANGUAGE_TYPE.SELF_REGISTERED_USER)}) ` : ''}${jobTitle ?? ''}`}
          title={name}
        />
        <Checkbox checked={!cpcData.excludedRecipients?.includes(id)} id={uId('cpc-edit-recipient')} />
      </Row>
    )
  }

  const getMore = async () => {
    if (initialList.length) {
      const {
        data: { groupMembers, success },
        // pass search parameter as empty string if it's less than 4 characters...JK
      } = await coreApi.post('/wambi/groups/getMemberList', { groupId, isRealm, page, search: searchInput.length > 3 ? searchInput : '' })
      if (success) {
        if (groupMembers.length > 0) {
          setPage(page + 1)
          return setRecipients(recipients => [...recipients, ...groupMembers])
        }
      }
      setLoadMore(false)
    }
  }

  const handleClear = () => {
    setSearchInput('')
    setPage(1)
    setRecipients(initialList)
    setLoadMore(true)
  }

  const handleSearch = async e => {
    const search = e.target.value
    setSearchInput(search)

    // minimum of 4 characters needed to full text index search...JK
    if (search.length > 3) {
      const {
        data: { groupMembers, success },
      } = await coreApi.post('/wambi/groups/getMemberList', { groupId, isRealm, search })
      if (success) {
        if (groupMembers.length > 0) {
          // reset page count on each search...JK
          setPage(1)
          setLoadMore(true)
          return setRecipients(groupMembers)
        }
        setPage(0)
        setRecipients([])
      }

      setLoadMore(false)
    } else {
      // to keep the search results in the same virtual container, we have to run handleSearch on every key stroke.
      // this preserves the original recipients and resets the page counter any time search value is less than 4 characters...JK
      setPage(1)
      setRecipients(initialList)
      setLoadMore(true)
    }
  }

  const isItemLoaded = index => !loadMore || index < recipients.length

  useEffect(() => {
    // reset scrollOffset to put user at top of the list...JK
    if (listRef?.current) listRef.current.scrollTo(0, 0)
  }, [searchInput])

  useEffect(() => {
    // fetch initial list of recipients...JK
    const getInitial = async () => {
      const {
        data: { groupMembers, success },
      } = await coreApi.post('/wambi/groups/getMemberList', { groupId, isRealm })
      if (success) {
        if (groupMembers.length > 0) {
          setPage(1)
          // save initial list to repopulate recipients when the search bar is cleared or goes below 4 characters...JK
          setInitialList(groupMembers)
          return setRecipients(groupMembers)
        }
        setLoadMore(false)
      } else setLoadMore(false)
    }

    getInitial()
  }, [groupId, groupSelected, isRealm])

  return (
    <Layout
      cta={cta}
      handleBack={() => {
        setTimeout(() => setGroupSelected(null), 250)
        setActive(cpcScreens.SEARCH)
      }}
      id='cpc-group-recipients'
      inner
      noFooter
      title='Edit Recipients'
    >
      <Wrapper>
        <GroupInfo>
          <GroupTile
            images={[groupImage]}
            extraInfo={peopleCount > 1 ? `${numberFormatter(peopleCount)} people` : `${peopleCount} person`}
            subtitle={subtitle}
            title={isRealm ? `Everyone ${isLocation ? 'at' : 'under'} ${title}` : title}
          />
          <PillButton onClick={() => deleteGroup(groupSelected)} small text='Remove' />
        </GroupInfo>
        <SearchBar
          full
          handleClear={handleClear}
          id='group-recipients-searchbar'
          onChange={handleSearch}
          placeholder='Search by name'
          value={searchInput}
        />
        <Totals>
          <Text color='gray1' fontSize={['14px', '16px']} fontWeight={700}>
            Recipients
          </Text>
        </Totals>
        {searchInput.length > 3 && recipients.length === 0 && <NoResults>No results found</NoResults>}
        <DynamicContainer id='scrollable-group-recipients'>
          <InfiniteLoader
            isItemLoaded={index => isItemLoaded(index)}
            itemCount={loadMore ? recipients.length + 1 : recipients.length}
            loadMoreItems={getMore}
            threshold={1}
          >
            {({ onItemsRendered, ref }) => (
              <AutoSizer ref={ref}>
                {({ height, width }) => (
                  <FixedSizeList
                    height={height}
                    itemCount={loadMore ? recipients.length + 1 : recipients.length}
                    // hardcoded height of each row...JK
                    itemSize={81}
                    onItemsRendered={onItemsRendered}
                    ref={listRef}
                    width={width}
                  >
                    {({ index, style }) => (recipients[index] ? <div style={style}>{getContent(index)}</div> : <div style={style} />)}
                  </FixedSizeList>
                )}
              </AutoSizer>
            )}
          </InfiniteLoader>
        </DynamicContainer>
        <CtaFooter>
          <PillButton full id='cpc-group-recipients' onClick={() => setActive(cpcScreens.SEARCH)} text='Done' />
        </CtaFooter>
      </Wrapper>
    </Layout>
  )
}

GroupRecipients.propTypes = {
  ...CpcWorkflowType,
  deleteGroup: PropTypes.func,
  groupSelected: PropTypes.object,
  setGroupSelected: PropTypes.func,
  toggleFromExclusionList: PropTypes.func,
}

export default GroupRecipients
