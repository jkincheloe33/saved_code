import { useEffect, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { devices } from '@assets'
import { DynamicContainer, Image, Layout, Loader, SearchBar, Title, WambiTypesCarousel } from '@components'
import { usePostContext } from '@contexts'
import { coreApi } from '@services'
import { CpcWorkflowType, useCallbackDelay } from '@utils'

const ImageWrapper = styled.div`
  cursor: pointer;
  flex: 0 0 50%;
  padding: 2px;
  transition: transform 250ms ease;
  width: 50%;

  @media (${devices.largeDesktop}) {
    &:hover {
      transform: scale(0.95);
    }
  }
`

const Images = styled(InfiniteScroll)`
  align-items: flex-start;
  display: flex;
  flex-wrap: wrap;
  margin-top: 25px;
  width: 100%;
`

const NoResults = styled(Title)`
  padding: 0 20px;
  text-align: center;
`

const SearchBarWrapper = styled.div`
  padding: 35px 22px 8px;
  position: relative;
`

// two different infinite loaders with 2 different loader/paging states and getMore functions...JK
const ImageSearch = ({ cpcScreens, cta, leftCta, setActive, setCpcData }) => {
  const [loadMoreSearch, setLoadMoreSearch] = useState(true)
  const [loadMoreThemes, setLoadMoreThemes] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [searchList, setSearchList] = useState(null)
  const [searchPage, setSearchPage] = useState(0)
  const [themePage, setThemePage] = useState(0)
  const [themes, setThemes] = useState([])

  const { setSelectedCpcTheme } = usePostContext()

  const getMoreThemes = async () => {
    const {
      data: { success, themes: newThemes },
    } = await coreApi.post('/wambi/themes/getWambiThemes', { page: themePage })
    if (success) {
      if (newThemes.length === 0) return setLoadMoreThemes(false)
      setThemes([...themes, ...newThemes])
      setThemePage(themePage + 1)
    } else {
      setLoadMoreThemes(false)
    }
  }

  const getMoreSearch = async () => {
    const {
      data: { list, success },
    } = await coreApi.post('/wambi/types/searchImages', { page: searchPage, search: searchInput })
    if (success) {
      if (list.length === 0) return setLoadMoreSearch(false)
      setSearchList([...searchList, ...list])
      setSearchPage(searchPage + 1)
    } else {
      setLoadMoreSearch(false)
    }
  }

  const handleClear = () => {
    setSearchInput('')
    setSearchList(null)
    // reset paging and loading to default states if search is cleared...JK
    setSearchPage(0)
    setLoadMoreSearch(true)
  }

  const handleSearch = async () => {
    if (searchInput.length > 2) {
      const {
        data: { list, success },
      } = await coreApi.post('/wambi/types/searchImages', { page: 0, search: searchInput })
      if (success) {
        setSearchList(list)
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

  const handleSelect = type => {
    setCpcData(cpcData => ({ ...cpcData, type }))
    setActive(cpcScreens.COMPOSE)
    // reset paging and loading to default states if cpc is selected...JK
    setSearchPage(0)
    setLoadMoreSearch(true)
  }

  const handleViewCategory = data => {
    setSelectedCpcTheme(data)
    setActive(cpcScreens.THEME_DETAILS)
  }

  // delay search results till user finishes typing or default/specified delay has passed...JK
  useCallbackDelay(() => {
    handleSearch()
  }, [searchInput])

  useEffect(() => {
    const getInitialThemes = async () => {
      const {
        data: { success, themes },
      } = await coreApi.post('/wambi/themes/getWambiThemes', { page: themePage })

      if (success) {
        setThemes(themes)
        setThemePage(1)
      } else {
        setLoadMoreThemes(false)
      }
    }

    getInitialThemes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Layout cta={cta} dark id='image-search' inner leftCta={leftCta} noFooter title='Send a Wambi'>
      <DynamicContainer id='cpc-image-search'>
        <SearchBarWrapper>
          <SearchBar
            // do not add autofocus as it will break the modal for edit Wambi...JK
            bgColor='white'
            full
            handleClear={handleClear}
            id='cpc-image-searchbar'
            onChange={e => setSearchInput(e.target.value)}
            placeholder='Search for an occasion'
            value={searchInput}
          />
        </SearchBarWrapper>
        {searchList?.length > 0 && (
          <Images
            dataLength={searchList.length}
            hasMore={loadMoreSearch}
            loader={<Loader />}
            next={getMoreSearch}
            scrollableTarget='cpc-image-search'
          >
            {searchList.map((image, i) => (
              <ImageWrapper key={i} onClick={() => handleSelect(image)}>
                <Image alt={`${image.name} Wambi`} src={image.src} width='100%' />
              </ImageWrapper>
            ))}
          </Images>
        )}
        {searchList && !searchList.length && (
          <NoResults fontSize='16px' fontWeight={700}>
            No results were found. Here are some suggestions!
          </NoResults>
        )}
        {themes && (searchInput < 3 || !searchList?.length) && (
          <InfiniteScroll
            dataLength={themes.length}
            hasMore={loadMoreThemes}
            loader={<Loader />}
            next={getMoreThemes}
            scrollableTarget='cpc-image-search'
            threshold={2}
          >
            {themes.map((theme, i) => (
              <WambiTypesCarousel {...theme} key={i} handleSelect={handleSelect} handleViewCategory={handleViewCategory} />
            ))}
          </InfiniteScroll>
        )}
      </DynamicContainer>
    </Layout>
  )
}

ImageSearch.propTypes = {
  ...CpcWorkflowType,
  leftCta: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
}

export default ImageSearch
