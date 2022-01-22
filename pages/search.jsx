import { useState } from 'react'
import styled from 'styled-components'

import { DynamicContainer, Layout, SearchBar, SearchList } from '@components'
import { coreApi } from '@services'
import { useCallbackDelay } from '@utils'

const Wrapper = styled(DynamicContainer)`
  display: flex;
  flex-direction: column;
  padding: 28px 0;
`

const SearchPage = () => {
  const [searchInput, setSearchInput] = useState('')
  const [searchList, setSearchList] = useState(null)

  // delay search results till user finishes typing or default/specified delay has passed...JK
  useCallbackDelay(() => {
    if (searchInput.length > 2) handleSearch()
    else setSearchList(null)
  }, [searchInput])

  const handleSearch = async () => {
    const {
      data: { searchList, success },
    } = await coreApi.post('/search', { search: searchInput })

    if (success) setSearchList(searchList)
  }

  return (
    <Layout head='Search' id='search'>
      <Wrapper outer>
        <SearchBar
          full
          handleClear={() => setSearchInput('')}
          id='search-page-searchbar'
          onChange={e => setSearchInput(e.target.value)}
          placeholder='Search people or groups'
          value={searchInput}
        />
        <SearchList handleClear={() => setSearchInput('')} searchInput={searchInput} searchList={searchList} />
      </Wrapper>
    </Layout>
  )
}

export default SearchPage
