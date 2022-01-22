import { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { DynamicContainer, Layout, PillButton, PopUp, SearchBar, SearchList, Text } from '@components'
import { api } from '@services'
import { useCallbackDelay } from '@utils'

const IsEligibleText = styled(Text)`
  margin-bottom: 20px;
`

const IsEligibleWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  padding: 25px;
  text-align: center;
`

const Wrapper = styled(DynamicContainer)`
  margin-bottom: 2rem;
  padding: 20px;
`

const SearchPersonToGift = ({ cta, reward, rewardScreens, selectedPerson, setActive, setSelectedPerson }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchList, setSearchList] = useState(null)

  const handleSearch = async () => {
    const {
      data: { searchList, success },
    } = await api.post('reward/search', { search: searchInput, giftId: reward.rewardGiftId })
    if (success) setSearchList(searchList)
  }

  // delay search results till user finishes typing or default/specified delay has passed...JK
  useCallbackDelay(() => {
    if (searchInput.length > 2) handleSearch()
    else setSearchList(null)
  }, [searchInput])

  return (
    <Layout
      cta={cta}
      handleBack={() => {
        setActive(rewardScreens.CLAIM_REWARD)
        setSearchInput('')
      }}
      id='send-gift'
      inner
      noFooter
      title='Send to someone else'
    >
      <Wrapper>
        <SearchBar
          full
          handleClear={() => setSearchInput('')}
          id='send-gift-searchbar'
          onChange={e => setSearchInput(e.target.value)}
          placeholder='Search person'
          value={searchInput}
        />
        <SearchList
          giftId={reward?.rewardGiftId}
          handleSelect={person => {
            if (person.isEligible) {
              setActive(rewardScreens.GIVE_A_GIFT)
              setSelectedPerson(person)
              setSearchInput('')
            } else {
              setSelectedPerson(person)
              setIsOpen(true)
            }
          }}
          searchInput={searchInput}
          searchList={searchList}
        />
      </Wrapper>
      <PopUp background open={isOpen}>
        <IsEligibleWrapper>
          <IsEligibleText noClamp>
            {selectedPerson?.name} is not eligible for this item. Please select a different recipient.
          </IsEligibleText>
          <PillButton
            id='go-back-btn'
            onClick={() => {
              setIsOpen(false)
              setSearchInput('')
            }}
            text='Go back'
            thin
          />
        </IsEligibleWrapper>
      </PopUp>
    </Layout>
  )
}

SearchPersonToGift.propTypes = {
  cta: PropTypes.object,
  handleClearSearch: PropTypes.func,
  reward: PropTypes.object,
  rewardScreens: PropTypes.object,
  selectedPerson: PropTypes.object,
  setActive: PropTypes.func,
  setSelectedPerson: PropTypes.func,
}

export default SearchPersonToGift
