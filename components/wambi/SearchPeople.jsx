import { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors } from '@assets'
import {
  Checkbox,
  CtaFooter,
  DefaultWambiView,
  DynamicContainer,
  Layout,
  Loader,
  PeopleTile,
  PillButton,
  SearchBar as SearchBarBase,
  SelectedRecipients,
  Text as TextBase,
} from '@components'
import { useLangContext, usePostContext } from '@contexts'
import { coreApi } from '@services'
import { CpcWorkflowType, LANGUAGE_TYPE, numberFormatter, uId, useCallbackDelay } from '@utils'

const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
`

const PersonTile = styled(PeopleTile)`
  cursor: pointer;
`

const RecipientTotal = styled.div`
  color: ${colors.gray3};
  font-size: 14px;
  padding: 17px 25px 0;
`

const RecipientsWrapper = styled.div`
  padding: 17px 25px;
`

const Row = styled.div`
  align-items: center;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
`

const SearchBar = styled(SearchBarBase)`
  margin: 0;
`

const SearchWrapper = styled.div`
  margin-bottom: 15px;
  position: relative;
`

const Text = styled(TextBase)`
  padding-bottom: 20px;
  text-align: center;
`

const Wrapper = styled(DynamicContainer)`
  display: flex;
  flex-direction: column;
  padding: 28px 0 125px;
`

const SearchPeople = ({
  cpcData,
  cpcScreens,
  cta,
  getPeopleInGroups,
  handleBack,
  handleClear,
  recipientCount,
  searchInput,
  searchList,
  setActive,
  setCpcData,
  setSearchInput,
  setSearchList,
  setGroupSelected,
}) => {
  const { getAccountLanguage } = useLangContext()
  const { autoFocusSearch } = usePostContext()

  const [isLoading, setIsLoading] = useState(false)

  const { groups, recipients } = cpcData

  const showDefaultCpcView = searchInput.length < 3 || (searchList && !searchList.length)

  // delay search results till user finishes typing or default/specified delay has passed...JK
  useCallbackDelay(() => {
    getSearchResults()
  }, [searchInput])

  const getSearchResults = async () => {
    if (searchInput.length > 2) {
      setIsLoading(true)
      const {
        data: { searchList },
      } = await coreApi.post('/wambi/search', { search: searchInput })
      setSearchList(searchList)
    } else setSearchList(null)
    setIsLoading(false)
  }

  const handleGetPeopleInGroups = id => {
    getPeopleInGroups(id, () => {
      setSearchInput('')
      setSearchList(null)
    })
  }

  // adds or removes an item from the selected state...JK
  const handleSelect = person => {
    setSearchInput('')
    setSearchList(null)

    // if selected a row with multiple people (direct reports), run handleSelectPeople instead...JC
    if (person.length) {
      return handleSelectPeople(person)
    }

    // toggle single recipient in cpcData.recipients...PS & JK
    const exists = recipients?.some(recipient => recipient.id === person.id)
    setCpcData(cpcData => ({
      ...cpcData,
      recipients: exists ? cpcData.recipients?.filter(recipient => recipient.id !== person.id) : [...cpcData.recipients, person],
    }))
  }

  const handleSelectPeople = people => {
    const existingPeople = people.filter(person => recipients?.find(recipient => recipient.id === person.id))
    if (existingPeople.length) {
      if (existingPeople.length < people.length) {
        return setCpcData(cpcData => ({
          ...cpcData,
          recipients: [...cpcData.recipients, ...people.filter(person => !existingPeople.find(({ id }) => id === person.id))],
        }))
      }
      return setCpcData(cpcData => ({
        ...cpcData,
        recipients: cpcData.recipients?.filter(recipient => !existingPeople.find(person => recipient.id === person.id)),
      }))
    }

    setCpcData(cpcData => ({ ...cpcData, recipients: [...cpcData.recipients, ...people] }))
  }

  const removeRecipient = id =>
    setCpcData(cpcData => ({ ...cpcData, recipients: cpcData.recipients.filter(recipient => recipient.id !== id) }))

  const setRecipientName = recipient => {
    if (recipient.isRealm) return `Everyone ${recipient.isLocation ? 'at' : 'under'} ${recipient.name}`
    return recipient.name
  }

  return (
    <Layout cta={cta} handleBack={handleBack} id='search-people' inner noFooter title='Add Recipients'>
      <Wrapper outer>
        <SearchWrapper>
          <SearchBar
            autoFocus={autoFocusSearch}
            full
            handleClear={handleClear}
            id='cpc-search-people-input'
            onChange={e => setSearchInput(e.target.value)}
            placeholder='Search'
            value={searchInput}
          />
        </SearchWrapper>
        {searchList && !searchList.length && <Text fontWeight={700}>No people matching that name were found.</Text>}
        {(recipientCount > 0 || recipients?.length > 0) && (
          <RecipientTotal>
            Recipients
            {` (${numberFormatter(recipientCount + recipients?.length)} ${
              recipientCount > 1 || recipients?.length > 1 ? 'people' : 'person'
            })`}
          </RecipientTotal>
        )}
        {(groups?.length > 0 || recipients?.length > 0) && (
          <RecipientsWrapper>
            <SelectedRecipients
              cpcScreens={cpcScreens}
              groups={groups}
              removeRecipient={removeRecipient}
              recipients={recipients}
              setActive={setActive}
              setGroupSelected={setGroupSelected}
            />
          </RecipientsWrapper>
        )}
        {isLoading && !showDefaultCpcView ? (
          <LoaderWrapper>
            <Loader />
          </LoaderWrapper>
        ) : (
          searchList?.length > 0 &&
          searchList.map((recipient, i) => (
            <Row
              key={i}
              onClick={() => {
                if (getPeopleInGroups && recipient.type === 'group') {
                  // navigate to group recipients screen, and if group id + isRealm doesn't already match an item in groups, add it to cpcData...JK
                  const exists = groups?.some(group => group.id === recipient.id && group.isRealm === recipient.isRealm)

                  setGroupSelected(recipient)
                  setActive(cpcScreens.GROUP_RECIPIENTS)
                  if (!exists) setCpcData(cpcData => ({ ...cpcData, groups: [...cpcData.groups, recipient] }))
                } else handleSelect(recipient)
              }}
            >
              <PersonTile
                extraInfo={
                  recipient.type === 'group'
                    ? recipient.peopleCount > 1
                      ? `${numberFormatter(recipient.peopleCount)} people`
                      : `${recipient.peopleCount} person`
                    : recipient.groupName
                }
                id={recipient.isRealm ? 'realm-search-result' : 'group-search-result'}
                images={[recipient.thumbnailImage]}
                ratio='50px'
                subtitle={
                  recipient.type === 'group'
                    ? recipient.groupName
                    : `${recipient.isSelfRegistered ? `(${getAccountLanguage(LANGUAGE_TYPE.SELF_REGISTERED_USER)}) ` : ''}${
                        recipient.jobTitle ?? ''
                      }`
                }
                title={setRecipientName(recipient)}
              />
              {recipient.type !== 'group' && (
                <Checkbox checked={recipients?.some(s => s.id === recipient.id)} id={uId('cpc-select-recipient')} />
              )}
            </Row>
          ))
        )}
        {showDefaultCpcView && (
          <DefaultWambiView
            getPeopleInGroups={handleGetPeopleInGroups}
            handleSelect={handleSelect}
            selected={recipients}
            setActive={setActive}
          />
        )}
        <CtaFooter>
          <PillButton
            disabled={groups?.length === 0 && recipients?.length === 0}
            full
            id='cpc-search-next-btn'
            onClick={() => {
              setCpcData(cd => ({ ...cd, recipients }))
              setActive(cpcScreens.COMPOSE)
            }}
            text='Continue'
          />
        </CtaFooter>
      </Wrapper>
    </Layout>
  )
}

SearchPeople.propTypes = {
  ...CpcWorkflowType,
  getPeopleInGroups: PropTypes.func,
  handleBack: PropTypes.func,
  handleClear: PropTypes.func,
  recipientCount: PropTypes.number,
  searchInput: PropTypes.string,
  searchList: PropTypes.array,
  setSearchInput: PropTypes.func,
  setSearchList: PropTypes.func,
  setGroupSelected: PropTypes.func,
}

export default SearchPeople
